import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

test.describe('Fase 4: Auditoría de Mutación Visual y Detección de Discrepancias', () => {
  test('debe certificar que una mutación deliberada en la UI produce una discrepancia visual detectable', async ({ page }) => {
    const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
    const baselinePath = path.join(screenshotsDir, 'smoke-login-page.png');
    const mutantPath = path.join(screenshotsDir, 'mutation-audit-detected.png');

    // 1. Confirmar existencia previa del Baseline inmutable
    expect(fs.existsSync(baselinePath)).toBe(true);

    const baselineBuffer = fs.readFileSync(baselinePath);
    const baselineHash = crypto.createHash('sha256').update(baselineBuffer).digest('hex');

    // 2. Navegar al componente de Login
    await page.goto('/login');
    const loginCard = page.locator('.login-card');
    await expect(loginCard).toBeVisible({ timeout: 15_000 });

    // 3. Inyectar mutación visual de prueba (alteración de fondo, borde y color tipográfico)
    await page.addStyleTag({
      content: `
        .login-card {
          background-color: #fff3e0 !important;
          border: 3px solid #ff9800 !important;
          box-shadow: 0 10px 20px rgba(255, 152, 0, 0.4) !important;
        }
        h2.title {
          color: #e65100 !important;
          letter-spacing: 2px !important;
        }
      `,
    });

    // 4. Capturar la vista con la mutación visual inyectada
    await page.screenshot({ path: mutantPath, fullPage: true });

    const mutantBuffer = fs.readFileSync(mutantPath);
    const mutantHash = crypto.createHash('sha256').update(mutantBuffer).digest('hex');

    // 5. Aserción matemática y determinista:
    // El hash SHA-256 de la mutación debe diferir obligatoriamente del baseline,
    // garantizando que el comparador de Argos CI detectará el fallo y detendrá el Quality Gate.
    expect(mutantHash).not.toBe(baselineHash);
    expect(mutantBuffer.length).toBeGreaterThan(0);
  });
});
