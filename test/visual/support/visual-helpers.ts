import * as fs from 'fs';
import * as path from 'path';
import { Page } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

/**
 * Token JWT sintético pero estructuralmente válido (header.payload.signature)
 * para eludir guardias de autenticación en las pruebas de regresión visual.
 */
export const MOCK_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxIiwibmFtZSI6IkVzdHVkaWFudGUgVGVzdCIsImVtYWlsIjoidGVzdEBlbWFpbC5jb20iLCJleHAiOjE5OTk5OTk5OTl9.' +
  'mockSignatureForVisualTestingOnly';

/**
 * Inyecta autenticación en localStorage antes de que cargue cualquier documento en la página.
 */
export async function setupMockAuth(page: Page, token = MOCK_JWT_TOKEN): Promise<void> {
  await page.addInitScript((authToken) => {
    window.localStorage.setItem('token', authToken);
  }, token);
}

/**
 * Deshabilita animaciones CSS, transiciones, efectos de pulsación (ripples)
 * y cursores intermitentes para evitar discrepancias de subpíxeles.
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        -moz-transition: none !important;
        transition: none !important;
        -moz-animation: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
      .mat-mdc-progress-spinner, .mat-progress-spinner {
        animation: none !important;
      }
    `,
  });
}

/**
 * Espera de forma determinista a que todas las fuentes web (Roboto, Material Icons)
 * terminen de renderizarse en el documento.
 */
export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });
}

/**
 * Congela la fecha y hora del navegador a un instante fijo predecible.
 */
export async function freezeTime(page: Page, fixedIso = '2026-10-26T12:00:00.000Z'): Promise<void> {
  if (page.clock) {
    await page.clock.setFixedTime(new Date(fixedIso));
  } else {
    await page.addInitScript((iso) => {
      const fixedDate = new Date(iso);
      // @ts-ignore
      Date.now = () => fixedDate.getTime();
    }, fixedIso);
  }
}

/**
 * Intercepta peticiones a la API del backend sin interferir con las rutas
 * de navegación SPA de Angular (resourceType !== 'document').
 */
export async function mockApiRoute(
  page: Page,
  endpointPattern: string | RegExp,
  data: any,
  status = 200
): Promise<void> {
  await page.route(endpointPattern, async (route) => {
    // Si la petición es la carga de la página HTML (SPA document), dejar pasar a Angular
    if (route.request().resourceType() === 'document') {
      return route.continue();
    }

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/**
 * Helper estandarizado para capturar screenshots con Argos CI aplicando
 * las garantías de estabilidad visual (fuentes listas, animaciones desactivadas)
 * y persistiendo una copia en ./screenshots para inspección local o subida por CLI.
 */
export async function takeArgosScreenshot(
  page: Page,
  name: string,
  options?: Parameters<typeof argosScreenshot>[2]
): Promise<void> {
  await waitForFonts(page);
  await disableAnimations(page);

  // Asegurar existencia del directorio local de capturas
  const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Guardar captura física local para visualización directa y CLI
  const localFilePath = path.join(screenshotsDir, `${name}.png`);
  if (options?.element) {
    const locator = typeof options.element === 'string' ? page.locator(options.element) : options.element;
    // @ts-ignore
    await locator.screenshot({ path: localFilePath });
  } else if (!options?.viewports) {
    await page.screenshot({ path: localFilePath, fullPage: options?.fullPage ?? true });
  }

  // Notificar y adjuntar a Argos CI
  await argosScreenshot(page, name, options);
}
