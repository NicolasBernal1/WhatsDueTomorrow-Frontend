import { test, expect } from '@playwright/test';

// ════════════════════════════════════════════════════════════════════════════
// CAJA NEGRA · CONSULTAR PERFIL
// ════════════════════════════════════════════════════════════════════════════

test.describe('Consultar Perfil', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('token', 'fake-jwt-token'));
    await page.goto('/schedule');
  });

  test('CN1: con sesión activa muestra nombre y email en el menú de perfil', async ({ page }) => {
    await page.route('**/users/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: { id: 1, name: 'Ana Pérez', email: 'ana@test.com' },
        }),
      }),
    );

    await page.getByRole('button', { name: 'Profile' }).click();

    await expect(page.getByText('Ana Pérez')).toBeVisible();
    await expect(page.getByText('ana@test.com')).toBeVisible();
  });

  test('CN2: si el backend rechaza la petición, no se muestran datos de perfil', async ({ page }) => {
    await page.route('**/users/profile', (route) => route.fulfill({ status: 401 }));

    await page.getByRole('button', { name: 'Profile' }).click();

    await expect(page.getByText('Ana Pérez')).not.toBeVisible();
    // La sección de cambio de contraseña sigue disponible aunque el perfil falle
    await expect(page.getByText('Change Password')).toBeVisible();
  });
});
