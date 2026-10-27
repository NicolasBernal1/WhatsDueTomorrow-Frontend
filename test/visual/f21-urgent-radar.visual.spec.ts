import { test, expect } from '@playwright/test';
import { setupMockAuth, freezeTime, mockApiRoute, takeArgosScreenshot } from './support/visual-helpers';
import { MOCK_URGENT_ASSIGNMENTS, MOCK_USER } from './support/mock-data';

test.describe('CU-01 (F21): Radar y Alertas de Entregas Urgentes', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
    await freezeTime(page, '2026-10-26T12:00:00.000Z');

    // Mock global de perfil para el navbar
    await mockApiRoute(page, '**/users/profile', { data: MOCK_USER });

    // Mock de tareas próximas para el badge del navbar
    await mockApiRoute(page, '**/assignments/upcoming', { data: [] });
  });

  test('debe renderizar correctamente el estado vacío (sin tareas urgentes)', async ({ page }) => {
    await mockApiRoute(page, '**/assignments/urgent', { data: [] });

    await page.goto('/urgent-radar');

    const emptySection = page.locator('.empty-radar');
    await expect(emptySection).toBeVisible({ timeout: 15_000 });
    await expect(emptySection.locator('h2')).toHaveText('No urgent assignments');

    await takeArgosScreenshot(page, 'f21-urgent-radar-empty');
  });

  test('debe renderizar la grilla de tarjetas con entregas urgentes y cuenta regresiva', async ({ page }) => {
    await mockApiRoute(page, '**/assignments/urgent', { data: MOCK_URGENT_ASSIGNMENTS });

    await page.goto('/urgent-radar');

    const urgentGrid = page.locator('.urgent-grid');
    await expect(urgentGrid).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.urgent-card')).toHaveCount(2);

    await takeArgosScreenshot(page, 'f21-urgent-radar-populated');
  });
});
