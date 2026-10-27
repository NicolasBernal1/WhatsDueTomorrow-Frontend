import { test, expect } from '@playwright/test';
import { setupMockAuth, mockApiRoute, takeArgosScreenshot } from './support/visual-helpers';
import { MOCK_ACADEMIC_LOAD, MOCK_SUBJECTS, MOCK_USER } from './support/mock-data';

test.describe('CU-03 (F26): Semáforo y Estimación de Carga Académica Semanal', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);

    await mockApiRoute(page, '**/users/profile', { data: MOCK_USER });
    await mockApiRoute(page, '**/assignments/upcoming', { data: [] });
    await mockApiRoute(page, '**/subjects', { data: MOCK_SUBJECTS });
  });

  test('debe renderizar el semáforo en estado de Carga Baja (<12 créditos)', async ({ page }) => {
    await mockApiRoute(page, '**/subjects/academic-load', { data: MOCK_ACADEMIC_LOAD.baja });

    await page.goto('/subjects');

    const loadSection = page.locator('.academic-load-section');
    await expect(loadSection).toBeVisible({ timeout: 15_000 });
    await expect(loadSection.locator('.step-baja')).toHaveClass(/active/);

    await takeArgosScreenshot(page, 'f26-load-status-baja', { element: '.academic-load-section' });
  });

  test('debe renderizar el semáforo en estado de Carga Balanceada (12-18 créditos)', async ({ page }) => {
    await mockApiRoute(page, '**/subjects/academic-load', { data: MOCK_ACADEMIC_LOAD.balanceada });

    await page.goto('/subjects');

    const loadSection = page.locator('.academic-load-section');
    await expect(loadSection).toBeVisible({ timeout: 15_000 });
    await expect(loadSection.locator('.step-balanceada')).toHaveClass(/active/);

    await takeArgosScreenshot(page, 'f26-load-status-balanceada', { element: '.academic-load-section' });
  });

  test('debe renderizar el semáforo en estado de Sobrecarga (>18 créditos)', async ({ page }) => {
    await mockApiRoute(page, '**/subjects/academic-load', { data: MOCK_ACADEMIC_LOAD.sobrecarga });

    await page.goto('/subjects');

    const loadSection = page.locator('.academic-load-section');
    await expect(loadSection).toBeVisible({ timeout: 15_000 });
    await expect(loadSection.locator('.step-sobrecarga')).toHaveClass(/active/);

    await takeArgosScreenshot(page, 'f26-load-status-sobrecarga', { element: '.academic-load-section' });
  });
});
