import { test, expect } from '@playwright/test';

test.describe('F22 - Subtasks & Progress', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'e2e-agent-f22-token');
      window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Estudiante Demo', email: 'demo@test.com' }));
    });

    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { id: 1, name: 'Estudiante Demo', email: 'demo@test.com' } }),
      });
    });

    await page.route('**/assignments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: [
            {
              id: 1,
              title: 'Proyecto Final de Software',
              subjectName: 'Ingeniería de Software',
              description: 'Entrega final de arquitectura y pruebas',
              dueDate: new Date(Date.now() + 86400000).toISOString(),
            },
          ],
        }),
      });
    });
  });

  test('F22-E1: debe renderizar la asignación y permitir agregar una subtarea', async ({ page }) => {
    let subtasksState = [
      { id: 10, assignmentId: 1, title: 'Diseñar diagramas C4', completed: false, position: 0 },
    ];

    await page.route('**/assignments/1/subtasks', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        subtasksState.push({
          id: 11,
          assignmentId: 1,
          title: body.title,
          completed: false,
          position: subtasksState.length,
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 200,
            message: 'ok',
            data: { subtasks: subtasksState, progress: 0 },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 200,
            message: 'ok',
            data: { subtasks: subtasksState, progress: 0 },
          }),
        });
      }
    });

    await page.goto('/assignments/1');

    await expect(page.getByRole('heading', { name: 'Proyecto Final de Software' })).toBeVisible();
    await expect(page.locator('.progress-label strong')).toHaveText('0%');
    await expect(page.getByText('Diseñar diagramas C4')).toBeVisible();

    const input = page.getByPlaceholder('Add a step for this assignment');
    await input.fill('Configurar Dockerfile');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Configurar Dockerfile')).toBeVisible();
  });

  test('F22-E2: debe calcular reactivamente el progreso porcentual (0% -> 50% -> 100%)', async ({ page }) => {
    const subtasksState = [
      { id: 21, assignmentId: 1, title: 'Paso 1: Setup', completed: false, position: 0 },
      { id: 22, assignmentId: 1, title: 'Paso 2: Pruebas', completed: false, position: 1 },
    ];

    await page.route('**/assignments/1/subtasks/**', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        const urlParts = route.request().url().split('/');
        const subtaskId = Number(urlParts[urlParts.length - 1]);
        const item = subtasksState.find((s) => s.id === subtaskId);
        if (item && body.completed !== undefined) {
          item.completed = body.completed;
        }
        const completedCount = subtasksState.filter((s) => s.completed).length;
        const progress = Math.round((completedCount / subtasksState.length) * 100);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 200,
            message: 'ok',
            data: { subtasks: subtasksState, progress },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 200,
            message: 'ok',
            data: { subtasks: subtasksState, progress: 0 },
          }),
        });
      }
    });

    await page.route('**/assignments/1/subtasks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: { subtasks: subtasksState, progress: 0 },
        }),
      });
    });

    await page.goto('/assignments/1');

    await expect(page.locator('.progress-label strong')).toHaveText('0%');

    // Marcar el primer checkbox
    const firstCheckbox = page.getByLabel('Completar Paso 1: Setup');
    await firstCheckbox.click();
    await expect(page.locator('.progress-label strong')).toHaveText('50%');

    // Marcar el segundo checkbox
    const secondCheckbox = page.getByLabel('Completar Paso 2: Pruebas');
    await secondCheckbox.click();
    await expect(page.locator('.progress-label strong')).toHaveText('100%');

    // Mensaje de felicitación al 100%
    await expect(page.getByText('You completed all the steps. You can now mark the assignment as completed.')).toBeVisible();
  });

  test('F22-E3: debe deshabilitar el botón de agregar si el título está vacío', async ({ page }) => {
    await page.route('**/assignments/1/subtasks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { subtasks: [], progress: 0 } }),
      });
    });

    await page.goto('/assignments/1');

    const addBtn = page.getByRole('button', { name: 'Add' });
    await expect(addBtn).toBeDisabled();

    const input = page.getByPlaceholder('Add a step for this assignment');
    await input.fill('   ');
    await expect(addBtn).toBeDisabled();
  });
});
