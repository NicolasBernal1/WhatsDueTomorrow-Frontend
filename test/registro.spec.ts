import { test, expect } from '@playwright/test';

// ════════════════════════════════════════════════════════════════════════════
// CAJA NEGRA · REGISTRAR ESTUDIANTE
// Interactúa solo con la UI: llena el formulario y hace clic en "Register".
// Las respuestas del backend se simulan con page.route() para que el test
// sea determinista (no depende de un backend real corriendo).
// ════════════════════════════════════════════════════════════════════════════

test.describe('Registrar Estudiante', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('CN1: registro con datos válidos redirige al horario', async ({ page }) => {
    await page.route('**/auth/register', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 201,
          message: 'User created',
          data: { id: 1, name: 'Ana', email: 'ana@test.com' },
        }),
      }),
    );
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

    await page.getByLabel('Name').fill('Ana');
    await page.getByLabel('Email').fill('ana@test.com');
    await page.getByLabel('Password').fill('Clave123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/schedule/);
  });

  test('CN2: email ya en uso muestra alerta y no navega', async ({ page }) => {
    await page.route('**/auth/register', (route) => route.fulfill({ status: 409 }));

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByLabel('Name').fill('Ana');
    await page.getByLabel('Email').fill('existente@test.com');
    await page.getByLabel('Password').fill('Clave123');
    await page.getByRole('button', { name: 'Register' }).click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('This email is already in use');
    await dialog.accept();
    await expect(page).toHaveURL(/register/);
  });

  test('CN3: nombre vacío deshabilita el botón y muestra error', async ({ page }) => {
    await page.getByLabel('Email').fill('ana@test.com');
    await page.getByLabel('Password').fill('Clave123');
    await page.getByLabel('Name').click();
    await page.getByLabel('Email').click(); // dispara blur en "Name"

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled();
  });

  test('CN4: email con formato inválido deshabilita el botón', async ({ page }) => {
    await page.getByLabel('Name').fill('Ana');
    await page.getByLabel('Email').fill('correo-invalido');
    await page.getByLabel('Password').fill('Clave123');
    await page.getByLabel('Password').click(); // dispara blur en "Email"

    await expect(page.getByText('Email must be a valid email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled();
  });

  test('CN5: contraseña vacía deshabilita el botón y muestra error', async ({ page }) => {
    await page.getByLabel('Name').fill('Ana');
    await page.getByLabel('Email').fill('ana@test.com');
    await page.getByLabel('Password').click();
    await page.getByLabel('Name').click(); // dispara blur en "Password"

    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled();
  });
});
