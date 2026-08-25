import { test, expect } from '@playwright/test';

// ════════════════════════════════════════════════════════════════════════════
// CAJA NEGRA · INICIAR SESIÓN
// ════════════════════════════════════════════════════════════════════════════

test.describe('Iniciar Sesión', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('CN1: credenciales correctas redirige al horario', async ({ page }) => {
    await page.route('**/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: { token: 'fake-jwt-token', user: { id: 1, name: 'Ana', email: 'ana@test.com' } },
        }),
      }),
    );

    await page.getByLabel('Email').fill('ana@test.com');
    await page.getByLabel('Password').fill('correcta123');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page).toHaveURL(/schedule/);
  });

  test('CN2/CN3: credenciales incorrectas muestra alerta y no navega', async ({ page }) => {
    await page.route('**/auth/login', (route) => route.fulfill({ status: 401 }));

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByLabel('Email').fill('ana@test.com');
    await page.getByLabel('Password').fill('incorrecta');
    await page.getByRole('button', { name: 'Log In' }).click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Invalid Credentials');
    await dialog.accept();
    await expect(page).toHaveURL(/login/);
  });

  test('CN4: email vacío deshabilita el botón', async ({ page }) => {
    await page.getByLabel('Password').fill('correcta123');
    await page.getByLabel('Email').click();
    await page.getByLabel('Password').click(); // dispara blur en "Email"

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' })).toBeDisabled();
  });

  test('CN5: contraseña vacía deshabilita el botón', async ({ page }) => {
    await page.getByLabel('Email').fill('ana@test.com');
    await page.getByLabel('Password').click();
    await page.getByLabel('Email').click(); // dispara blur en "Password"

    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' })).toBeDisabled();
  });
});
