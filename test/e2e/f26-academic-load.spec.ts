import { test, expect } from '@playwright/test';

test.describe('F26 - Weekly Academic Load & Credit Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'e2e-agent-f26-token');
      window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Estudiante Demo', email: 'demo@test.com' }));
    });

    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { id: 1, name: 'Estudiante Demo', email: 'demo@test.com' } }),
      });
    });
  });

  test('F26-E1: debe mostrar semáforo balanceado y cálculo de horas presenciales vs autónomas', async ({ page }) => {
    await page.route('**/subjects/academic-load', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: {
            totalCredits: 16,
            weeklyPresentialHours: 12,
            weeklyAutonomousHours: 24,
            subjectsCount: 4,
            classesCount: 6,
            status: 'balanceada',
          },
        }),
      });
    });

    await page.route('**/subjects', async (route) => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: [
            { id: 1, name: 'Cálculo Diferencial', professor: 'Dr. Euler', color: '#e91e63', credits: 4 },
            { id: 2, name: 'Programación Web', professor: 'Ing. Turing', color: '#2196f3', credits: 4 },
          ],
        }),
      });
    });

    await page.goto('/subjects');

    await expect(page.getByRole('heading', { name: 'Your Subjects' })).toBeVisible();
    await expect(page.locator('section.academic-load-section')).toBeVisible();

    // Semáforo en zona balanceada activa
    await expect(page.locator('.traffic-step.step-balanceada.active')).toBeVisible();

    // Desglose de horas y créditos
    await expect(page.getByText('16 credits')).toBeVisible();
    await expect(page.getByText('12 h/week')).toBeVisible();
    await expect(page.getByText('24 h/week')).toBeVisible();
    await expect(page.getByText('Formula: 2h of independent study per 1h of class')).toBeVisible();
  });

  test('F26-E2: debe activar la alerta visual de sobrecarga cuando los créditos superan 18', async ({ page }) => {
    await page.route('**/subjects/academic-load', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: {
            totalCredits: 22,
            weeklyPresentialHours: 16,
            weeklyAutonomousHours: 32,
            subjectsCount: 6,
            classesCount: 8,
            status: 'sobrecarga',
          },
        }),
      });
    });

    await page.route('**/subjects', async (route) => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: [] }),
      });
    });

    await page.goto('/subjects');

    await expect(page.locator('.traffic-step.step-sobrecarga.active')).toBeVisible();
    await expect(page.locator('.load-card.status-sobrecarga')).toBeVisible();
    await expect(page.getByText('22 credits')).toBeVisible();
  });

  test('F26-E3: debe filtrar reactivamente la lista de asignaturas por el buscador', async ({ page }) => {
    await page.route('**/subjects/academic-load', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: null }),
      });
    });

    await page.route('**/subjects/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: [
            { id: 1, name: 'Cálculo Diferencial', professor: 'Dr. Euler', color: '#e91e63', credits: 4 },
          ],
        }),
      });
    });

    await page.route('**/subjects', async (route) => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: [
            { id: 1, name: 'Cálculo Diferencial', professor: 'Dr. Euler', color: '#e91e63', credits: 4 },
            { id: 2, name: 'Programación Web', professor: 'Ing. Turing', color: '#2196f3', credits: 4 },
          ],
        }),
      });
    });

    await page.goto('/subjects');

    await expect(page.getByText('Cálculo Diferencial')).toBeVisible();
    await expect(page.getByText('Programación Web')).toBeVisible();

    const searchInput = page.getByPlaceholder('Search by subject or professor...');
    await searchInput.fill('Cálculo');

    await expect(page.getByText('Cálculo Diferencial')).toBeVisible();
    await expect(page.getByText('Programación Web')).not.toBeVisible();
  });
});
