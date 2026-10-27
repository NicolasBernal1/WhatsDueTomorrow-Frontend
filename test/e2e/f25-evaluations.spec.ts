import { test, expect } from '@playwright/test';

test.describe('F25 - Grade Calculator & Scenario Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'e2e-agent-f25-token');
      window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Estudiante Demo', email: 'demo@test.com' }));
    });

    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { id: 1, name: 'Estudiante Demo', email: 'demo@test.com' } }),
      });
    });

    await page.route('**/subjects/1', async (route) => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: { id: 1, name: 'Cálculo Vectorial', professor: 'Prof. Ruiz', color: '#3f51b5' },
        }),
      });
    });

    await page.route('**/subjects/1/notes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok', data: [] }) });
    });

    await page.route('**/subjects/1/classes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok', data: [] }) });
    });

    await page.route('**/assignments', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, message: 'ok', data: [] }) });
    });
  });

  test('F25-E1: debe mostrar las métricas ponderadas, nota requerida y tabla de evaluaciones', async ({ page }) => {
    await page.route('**/subjects/1/evaluations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: {
            evaluations: [
              { id: 1, subjectId: 1, name: 'Parcial 1', weight: 25, score: 4.0 },
              { id: 2, subjectId: 1, name: 'Taller 1', weight: 15, score: 3.5 },
            ],
            summary: {
              totalWeight: 40.0,
              remainingWeight: 60.0,
              currentContribution: 1.53,
              currentAverage: 3.81,
              requiredGrade: 2.45,
              isPassing: true,
              isAttainable: true,
              status: 'Aprobando',
              weightExceeded: false,
              passingGrade: 3.0,
              maxGrade: 5.0,
            },
          },
        }),
      });
    });

    await page.goto('/subjects/1');

    await expect(page.getByRole('heading', { name: 'Grade calculator and simulator' })).toBeVisible();

    // Validar métricas
    await expect(page.locator('.metric-card').filter({ hasText: 'Current Weighted Average' }).getByText('3.81')).toBeVisible();
    await expect(page.locator('.metric-card').filter({ hasText: 'Accumulated Points' }).getByText('1.53')).toBeVisible();
    await expect(page.locator('.metric-card').filter({ hasText: 'Evaluated Weight' }).getByText('40.00%')).toBeVisible();
    await expect(page.locator('.metric-card').filter({ hasText: 'Required Grade' }).getByText('2.45')).toBeVisible();

    // Validar tabla de evaluaciones
    await expect(page.getByText('Parcial 1')).toBeVisible();
    await expect(page.getByText('25%')).toBeVisible();
    await expect(page.getByText('Taller 1')).toBeVisible();
    await expect(page.getByText('15%')).toBeVisible();
  });

  test('F25-E2: debe calcular en vivo la nota final estimada en el simulador de escenarios', async ({ page }) => {
    await page.route('**/subjects/1/evaluations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: {
            evaluations: [
              { id: 1, subjectId: 1, name: 'Parcial 1', weight: 40, score: 3.5 },
            ],
            summary: {
              totalWeight: 40.0,
              remainingWeight: 60.0,
              currentContribution: 1.4,
              currentAverage: 3.5,
              requiredGrade: 2.67,
              isPassing: true,
              isAttainable: true,
              status: 'Aprobando',
              weightExceeded: false,
              passingGrade: 3.0,
              maxGrade: 5.0,
            },
          },
        }),
      });
    });

    await page.goto('/subjects/1');

    await expect(page.locator('.simulator-card')).toBeVisible();

    const simInput = page.locator('#hypotheticalInput');
    await simInput.fill('4.0');

    // La simulación local calcula: 1.4 + (4.0 * 60 / 100) = 1.4 + 2.4 = 3.80
    await expect(page.locator('.sim-feedback').first()).toContainText('Estimated final grade:');
    await expect(page.locator('.sim-feedback strong').first()).toHaveText('3.80');
  });

  test('F25-E3: debe mostrar alerta visual cuando el peso de evaluaciones supera el 100%', async ({ page }) => {
    await page.route('**/subjects/1/evaluations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: {
            evaluations: [
              { id: 1, subjectId: 1, name: 'Parcial 1', weight: 60, score: 3.0 },
              { id: 2, subjectId: 1, name: 'Parcial 2', weight: 50, score: 3.0 },
            ],
            summary: {
              totalWeight: 110.0,
              remainingWeight: -10.0,
              currentContribution: 3.3,
              currentAverage: 3.0,
              requiredGrade: null,
              isPassing: true,
              isAttainable: true,
              status: 'Aprobado',
              weightExceeded: true,
              passingGrade: 3.0,
              maxGrade: 5.0,
            },
          },
        }),
      });
    });

    await page.goto('/subjects/1');

    await expect(page.locator('.alert-warning')).toBeVisible();
    await expect(page.locator('.alert-warning')).toContainText('Weight alert:');
    await expect(page.locator('.alert-warning')).toContainText('110.00%');
  });
});
