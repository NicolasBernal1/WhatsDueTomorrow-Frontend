import { test, expect } from '@playwright/test';
import { setupMockAuth, mockApiRoute, takeArgosScreenshot } from './support/visual-helpers';
import { MOCK_GRADE_SUMMARIES, MOCK_SUBJECTS, MOCK_USER } from './support/mock-data';

test.describe('CU-04 (F25): Calculadora y Simulador de Calificaciones con Banners de Alerta', () => {
  const subjectId = 10;
  const mockEvaluationsList = [
    {
      id: 1,
      name: 'Primer Parcial Teórico',
      weight: 30,
      score: 4.5,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
      subjectId: 10,
    },
    {
      id: 2,
      name: 'Taller de Arquitectura y Patrones',
      weight: 30,
      score: 4.0,
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
      subjectId: 10,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);

    await mockApiRoute(page, '**/users/profile', { data: MOCK_USER });
    await mockApiRoute(page, '**/assignments/upcoming', { data: [] });
    await mockApiRoute(page, `**/subjects/${subjectId}`, { data: MOCK_SUBJECTS[0] });
    await mockApiRoute(page, `**/assignments/subject/${subjectId}`, { data: [] });
    await mockApiRoute(page, `**/subjects/${subjectId}/notes`, { data: [] });
  });

  test('debe renderizar el panel métrico estándar con calificaciones normales (estado alcanzable)', async ({ page }) => {
    await mockApiRoute(page, `**/subjects/${subjectId}/evaluations`, {
      data: {
        evaluations: mockEvaluationsList,
        summary: MOCK_GRADE_SUMMARIES.normal,
      },
    });

    await page.goto(`/subjects/${subjectId}`);

    const calcSection = page.locator('.calculator-section');
    await expect(calcSection).toBeVisible({ timeout: 15_000 });
    await expect(calcSection.locator('.metrics-grid')).toBeVisible();

    await takeArgosScreenshot(page, 'f25-evaluations-normal', { element: '.calculator-section' });
  });

  test('debe renderizar el banner de advertencia cuando el peso total supera el 100%', async ({ page }) => {
    await mockApiRoute(page, `**/subjects/${subjectId}/evaluations`, {
      data: {
        evaluations: mockEvaluationsList,
        summary: MOCK_GRADE_SUMMARIES.weightExceeded,
      },
    });

    await page.goto(`/subjects/${subjectId}`);

    const warningBanner = page.locator('.alert-banner.alert-warning');
    await expect(warningBanner).toBeVisible({ timeout: 15_000 });
    await expect(warningBanner).toContainText('Weight alert:');

    await takeArgosScreenshot(page, 'f25-evaluations-warning-exceeded', { element: '.calculator-section' });
  });

  test('debe renderizar el banner de peligro cuando la nota requerida es inalcanzable (> 5.0)', async ({ page }) => {
    await mockApiRoute(page, `**/subjects/${subjectId}/evaluations`, {
      data: {
        evaluations: mockEvaluationsList,
        summary: MOCK_GRADE_SUMMARIES.unreachable,
      },
    });

    await page.goto(`/subjects/${subjectId}`);

    const dangerBanner = page.locator('.alert-banner.alert-danger');
    await expect(dangerBanner).toBeVisible({ timeout: 15_000 });
    await expect(dangerBanner).toContainText('Unreachable grade:');

    await takeArgosScreenshot(page, 'f25-evaluations-danger-unreachable', { element: '.calculator-section' });
  });
});
