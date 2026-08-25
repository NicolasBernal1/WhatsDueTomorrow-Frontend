import { test, expect } from '@playwright/test';

// ════════════════════════════════════════════════════════════════════════════
// CAJA NEGRA · CERRAR SESIÓN
// Simula una sesión ya iniciada (token en localStorage) para poder llegar
// a una ruta protegida sin pasar por el formulario de login.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cerrar Sesión', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('test-session-initialized')) {
        localStorage.setItem('token', 'fake-jwt-token');
        localStorage.setItem('test-session-initialized', 'true');
      }
    });
    await page.route('**/users/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { id: 1, name: 'Ana', email: 'ana@test.com' } }),
      }),
    );
    await page.goto('/schedule');
  });

  test('CN1: cerrar sesión con sesión activa elimina el token y redirige a /login', async ({ page }) => {
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'Log Out' }).click();

    await expect(page).toHaveURL(/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('CN2: tras cerrar sesión, una ruta protegida redirige de vuelta a /login', async ({ page }) => {
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'Log Out' }).click();
    await expect(page).toHaveURL(/login/);

    await page.goto('/schedule');

    await expect(page).toHaveURL(/login/);
  });
});
