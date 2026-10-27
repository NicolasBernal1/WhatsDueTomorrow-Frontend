import { test, expect } from '@playwright/test';
import { takeArgosScreenshot } from './support/visual-helpers';

test.describe('Argos CI — Smoke Visual Test', () => {
  test('debe cargar la vista de inicio de sesión y registrar la captura base', async ({ page }) => {
    // 1. Navegar a la página de login
    await page.goto('/login');

    // 2. Esperar a que la tarjeta de inicio de sesión esté completamente visible en el DOM
    const loginCard = page.locator('.login-card');
    await expect(loginCard).toBeVisible({ timeout: 15_000 });
    await expect(loginCard.locator('h2.title')).toHaveText('Log In');

    // 3. Capturar screenshot con Argos CI
    await takeArgosScreenshot(page, 'smoke-login-page');
  });
});
