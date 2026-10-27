import { test, expect } from '@playwright/test';
import { setupMockAuth, mockApiRoute, takeArgosScreenshot } from './support/visual-helpers';
import { MOCK_USER } from './support/mock-data';

test.describe('CU-06: Autenticación y Navegación Multidispositivo (Responsive)', () => {
  test('debe renderizar el formulario de Login de forma consistente en múltiples viewports', async ({ page }) => {
    await page.goto('/login');

    const loginCard = page.locator('.login-card');
    await expect(loginCard).toBeVisible({ timeout: 15_000 });

    // Argos capturará el screenshot en viewports Desktop y Mobile
    await takeArgosScreenshot(page, 'auth-login-responsive', {
      viewports: [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1280, height: 720 },
      ],
    });
  });

  test('debe renderizar el formulario de Registro con todos sus campos en múltiples viewports', async ({ page }) => {
    await page.goto('/register');

    const registerCard = page.locator('.register-card');
    await expect(registerCard).toBeVisible({ timeout: 15_000 });
    await expect(registerCard.locator('h2.title')).toHaveText('Register');

    await takeArgosScreenshot(page, 'auth-register-responsive', {
      viewports: [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1280, height: 720 },
      ],
    });
  });

  test('debe adaptar el Navbar entre Desktop (enlaces completos) y Mobile (botón hamburguesa)', async ({ page }) => {
    await setupMockAuth(page);

    await mockApiRoute(page, '**/users/profile', { data: MOCK_USER });
    await mockApiRoute(page, '**/assignments/upcoming', { data: [] });
    await mockApiRoute(page, '**/subjects/classes', { data: [] });

    await page.goto('/schedule');

    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible({ timeout: 15_000 });

    await takeArgosScreenshot(page, 'navbar-responsive', {
      viewports: [
        { width: 375, height: 667 },
        { width: 1280, height: 720 },
      ],
    });
  });
});
