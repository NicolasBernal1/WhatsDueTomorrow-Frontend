import { test, expect } from '@playwright/test';

test.describe('F21 - Urgent Radar', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'e2e-agent-f21-token');
      window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Estudiante Demo', email: 'demo@test.com' }));
    });

    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: { id: 1, name: 'Estudiante Demo', email: 'demo@test.com' },
        }),
      });
    });
  });

  test('F21-E1: debe visualizar asignaciones urgentes con temporizador y metadatos', async ({ page }) => {
    const futureDue = new Date(Date.now() + 18 * 3600 * 1000).toISOString();

    await page.route('**/assignments/urgent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: [
            {
              id: 101,
              title: 'Taller de Algoritmos',
              subjectName: 'Estructuras de Datos',
              dueDate: futureDue,
              reminderMinutes: 60,
            },
          ],
        }),
      });
    });

    await page.goto('/urgent-radar');

    await expect(page.getByRole('heading', { name: 'Urgent assignments radar' })).toBeVisible();
    await expect(page.locator('section.urgent-grid')).toBeVisible();
    await expect(page.getByText('Estructuras de Datos')).toBeVisible();
    await expect(page.getByText('Taller de Algoritmos')).toBeVisible();
    await expect(page.getByText('Reminder: 60 min before')).toBeVisible();
    await expect(page.locator('.countdown')).toContainText('h');
  });

  test('F21-E2: debe mostrar el estado vacío cuando no hay tareas urgentes', async ({ page }) => {
    await page.route('**/assignments/urgent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: [],
        }),
      });
    });

    await page.goto('/urgent-radar');

    await expect(page.getByRole('heading', { name: 'No urgent assignments' })).toBeVisible();
    await expect(page.getByText('You have no pending assignments due within the next 24 hours.')).toBeVisible();
    await expect(page.locator('mat-card.urgent-card')).toHaveCount(0);
  });

  test('F21-E3: debe responder a la acción de habilitar alertas web', async ({ page }) => {
    await page.route('**/assignments/urgent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: [] }),
      });
    });

    await page.goto('/urgent-radar');

    // Selector auto-reparado con expresión regular resiliente por el Healer Agent
    const alertBtn = page.getByRole('button', { name: /(?:Enable web alerts|Activate web notifications)/ });
    await expect(alertBtn).toBeVisible();
    await alertBtn.click();
    await expect(page.locator('.notification-message')).toBeVisible();
  });
});
