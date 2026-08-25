import { test, expect } from '@playwright/test';

// ════════════════════════════════════════════════════════════════════════════
// CAJA NEGRA · CAMBIAR CONTRASEÑA
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cambiar Contraseña', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('token', 'fake-jwt-token'));
    await page.route('**/users/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { id: 1, name: 'Ana', email: 'ana@test.com' } }),
      }),
    );
    await page.goto('/schedule');
    await page.getByRole('button', { name: 'Profile' }).click();
  });

  test('CN1: contraseña actual incorrecta muestra mensaje de error', async ({ page }) => {
    await page.route('**/auth/verify-password', (route) => route.fulfill({ status: 401 }));

    await page.getByLabel('Current password').fill('incorrecta');
    await page.getByRole('button', { name: 'Verify Password' }).click();

    await expect(page.getByText('Incorrect password')).toBeVisible();
    // No debe avanzar al formulario de nueva contraseña
    await expect(page.getByLabel('New password')).not.toBeVisible();
  });

  test('CN2: contraseña actual correcta habilita el formulario de nueva contraseña', async ({ page }) => {
    await page.route('**/auth/verify-password', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok' }) }),
    );

    await page.getByLabel('Current password').fill('correcta123');
    await page.getByRole('button', { name: 'Verify Password' }).click();

    await expect(page.getByText('Current password verified')).toBeVisible();
    await expect(page.getByLabel('New password')).toBeVisible();
  });

  test('CN3: cambio exitoso muestra alerta y redirige a /login', async ({ page }) => {
    await page.route('**/auth/verify-password', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok' }) }),
    );
    await page.route('**/auth/change-password', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok' }) }),
    );

    await page.getByLabel('Current password').fill('correcta123');
    await page.getByRole('button', { name: 'Verify Password' }).click();
    await expect(page.getByLabel('New password')).toBeVisible();

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByLabel('New password').fill('NuevaClave1');
    await page.getByRole('button', { name: 'Change Password' }).click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Password changed successfully.');
    await dialog.accept();

    await expect(page).toHaveURL(/login/);
  });

  test('CN4: el botón "Change Password" está deshabilitado si el campo está vacío', async ({ page }) => {
    await page.route('**/auth/verify-password', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok' }) }),
    );

    await page.getByLabel('Current password').fill('correcta123');
    await page.getByRole('button', { name: 'Verify Password' }).click();
    await expect(page.getByLabel('New password')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Change Password' })).toBeDisabled();
  });
});
