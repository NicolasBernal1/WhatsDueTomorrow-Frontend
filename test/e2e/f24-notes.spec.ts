import { test, expect } from '@playwright/test';

test.describe('F24 - Notes and Quick Resources Log', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'e2e-agent-f24-token');
      window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Estudiante Demo', email: 'demo@test.com' }));
    });

    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { id: 1, name: 'Estudiante Demo', email: 'demo@test.com' } }),
      });
    });

    await page.route('**/subjects/1', async (route) => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: { id: 1, name: 'Bases de Datos', professor: 'Prof. Gómez', color: '#4caf50' },
        }),
      });
    });

    await page.route('**/subjects/1/evaluations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { evaluations: [], gradeSummary: null } }),
      });
    });

    await page.route('**/subjects/1/classes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok', data: [] }) });
    });

    await page.route('**/assignments', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok', data: [] }) });
    });
  });

  test('F24-E1: debe abrir el modal y crear un nuevo apunte con enlace de recurso', async ({ page }) => {
    let notesState: any[] = [];

    await page.route('**/subjects/1/notes', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const created = {
          id: 501,
          subjectId: 1,
          title: body.title,
          content: body.content,
          linkUrl: body.linkUrl,
          createdAt: new Date().toISOString(),
        };
        notesState.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ status: 201, message: 'created', data: created }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 200, message: 'ok', data: notesState }),
        });
      }
    });

    await page.goto('/subjects/1');

    await expect(page.getByRole('heading', { name: 'Notes and quick resources log' })).toBeVisible();

    // Abrir modal de nueva nota
    await page.getByRole('button', { name: '+ Add Note', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'New Note or Resource' })).toBeVisible();

    // Diligenciar formulario
    await page.getByLabel('Note title').fill('Resumen de Normalización 3FN');
    await page.getByLabel('Description').fill('Repasar dependencias funcionales y transitivas');
    await page.getByLabel('Link to online resource (optional)').fill('https://es.wikipedia.org/wiki/Tercera_forma_normal');

    // Guardar
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Verificar en lista
    await expect(page.getByText('Resumen de Normalización 3FN')).toBeVisible();
    await expect(page.getByText('Repasar dependencias funcionales y transitivas')).toBeVisible();
    await expect(page.getByText('https://es.wikipedia.org/wiki/Tercera_forma_normal')).toBeVisible();
  });

  test('F24-E2: debe mostrar el estado vacío informativo cuando no hay apuntes', async ({ page }) => {
    await page.route('**/subjects/1/notes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: [] }),
      });
    });

    await page.goto('/subjects/1');

    await expect(page.getByRole('heading', { name: 'No notes or resources registered for this subject' })).toBeVisible();
    await expect(page.getByText('Keep your study notes, formulas, class agreements and online links in one place.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create the first note', exact: true })).toBeVisible();
  });
});
