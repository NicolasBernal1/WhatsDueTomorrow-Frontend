import { test, expect } from '@playwright/test';

test.describe('F23 - Calendar Sync & ICS Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'e2e-agent-f23-token');
      window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Estudiante Demo', email: 'demo@test.com' }));
    });

    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: { id: 1, name: 'Estudiante Demo', email: 'demo@test.com' } }),
      });
    });

    await page.route('**/classes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: [] }),
      });
    });

    await page.route('**/assignments/upcoming', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: [] }),
      });
    });
  });

  test('F23-E1: debe generar el enlace de suscripción webcal:// y habilitar botón de copia', async ({ page }) => {
    await page.route('**/calendar/subscription', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'ok',
          data: { webcalUrl: 'webcal://whatsduetomorrow-backed.onrender.com/calendar/user-1.ics' },
        }),
      });
    });

    await page.goto('/schedule');

    await expect(page.getByRole('heading', { name: 'Calendar sync' })).toBeVisible();

    const syncBtn = page.getByRole('button', { name: 'Sync calendar' });
    await syncBtn.click();

    const linkInput = page.getByLabel('Calendar subscription link');
    await expect(linkInput).toBeVisible();
    await expect(linkInput).toHaveValue(/webcal:\/\/.*user-1\.ics/);
    await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
    await expect(page.getByText('Your subscription link is ready.')).toBeVisible();
  });

  test('F23-E2: debe desencadenar la descarga del archivo .ics', async ({ page }) => {
    await page.route('**/calendar/download', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/calendar',
        headers: {
          'Content-Disposition': 'attachment; filename="whats-due-tomorrow.ics"',
        },
        body: 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WhatsDueTomorrow//ES\nEND:VCALENDAR\n',
      });
    });

    await page.goto('/schedule');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download .ics' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('whats-due-tomorrow.ics');
  });

  test('F23-E3: debe mostrar mensaje de error si falla la creación de suscripción', async ({ page }) => {
    await page.route('**/calendar/subscription', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/schedule');

    await page.getByRole('button', { name: 'Sync calendar' }).click();

    await expect(page.getByText('Unable to create the subscription link.')).toBeVisible();
    await expect(page.getByLabel('Calendar subscription link')).not.toBeVisible();
  });
});
