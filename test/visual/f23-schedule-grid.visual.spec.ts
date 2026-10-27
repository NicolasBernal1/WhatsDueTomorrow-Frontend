import { test, expect } from '@playwright/test';
import { setupMockAuth, freezeTime, mockApiRoute, takeArgosScreenshot } from './support/visual-helpers';
import { MOCK_CLASSES, MOCK_USER } from './support/mock-data';

test.describe('CU-02 (F23): Horario Semanal y Grilla Matricial', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
    // Fijar la fecha a un Lunes a las 09:00 AM local para activar la clase actual (08:00 - 10:00)
    await freezeTime(page, '2026-10-26T09:00:00');

    await mockApiRoute(page, '**/users/profile', { data: MOCK_USER });
    await mockApiRoute(page, '**/assignments/upcoming', { data: [] });
    await mockApiRoute(page, '**/subjects/classes', { data: MOCK_CLASSES });
  });

  test('debe renderizar la grilla semanal completa con la tarjeta Next Class y la clase activa con badge Now', async ({ page }) => {
    await page.goto('/schedule');

    const scheduleGrid = page.locator('.schedule-grid');
    await expect(scheduleGrid).toBeVisible({ timeout: 15_000 });

    // Verificar la presencia de tarjetas de clase en la matriz
    const classCards = page.locator('.class-card');
    await expect(classCards.first()).toBeVisible();

    // Validar el badge 'Now' en la clase en curso
    const currentBadge = page.locator('.current-badge').first();
    await expect(currentBadge).toBeVisible();
    await expect(currentBadge).toHaveText('Now');

    // Validar tarjeta Next Class destacada
    await expect(page.locator('.next-class-card')).toBeVisible();

    await takeArgosScreenshot(page, 'f23-schedule-full-grid');
  });

  test('debe renderizar el menú contextual flotante al hacer clic derecho sobre una clase', async ({ page }) => {
    await page.goto('/schedule');

    const firstCard = page.locator('.class-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });

    // Disparar clic derecho sobre la clase para desplegar el menú contextual
    await firstCard.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible();
    await expect(contextMenu.locator('button:has-text("Edit")')).toBeVisible();
    await expect(contextMenu.locator('button:has-text("Delete")')).toBeVisible();

    await takeArgosScreenshot(page, 'f23-schedule-context-menu', { element: '.schedule-container' });
  });
});
