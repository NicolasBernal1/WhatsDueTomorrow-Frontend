import { test, expect } from '@playwright/test';

test.describe('Agent Environment Seed', () => {
  test('seed: bootstrap authenticated session for test agents', async ({ page }) => {
    // 1. Interceptar rutas críticas para proveer respuestas deterministas si el backend está en reposo
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

    await page.route('**/classes', async (route) => {
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

    await page.route('**/assignments/upcoming', async (route) => {
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

    // 2. Inyectar token de autenticación en localStorage antes de que cargue la app (bypass auth.guard)
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'seed-jwt-token-for-agent-exploration');
      window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Estudiante Demo', email: 'demo@test.com' }));
    });

    // 3. Navegar hacia la vista principal autenticada
    await page.goto('/schedule');

    // 4. Aserciones de control de arranque
    await expect(page).toHaveURL(/.*schedule/);
    await expect(page.locator('app-navbar')).toBeVisible();
  });
});
