import { defineConfig, devices } from '@playwright/test';

/**
 * ==============================================================================
 * CONFIGURACIÓN DE REGRESIÓN VISUAL CON ARGOS CI Y PLAYWRIGHT
 * ==============================================================================
 * Esta configuración aísla las pruebas visuales de las pruebas E2E funcionales,
 * asegurando un viewport determinista y el entorno idóneo para capturas estables.
 */
export default defineConfig({
  testDir: './test/visual',
  testMatch: '**/*.visual.spec.ts',
  fullyParallel: false,
  workers: 1, // Ejecución secuencial para determinismo y estabilidad de captura
  timeout: 30_000,
  outputDir: 'test-results-visual',
  reporter: [
    ['list'],
    // Si no se cuenta con ARGOS_TOKEN en local, el reporter no fallará; las capturas
    // se guardan en ./screenshots para ser cargadas manualmente o en CI.
    ['@argos-ci/playwright/reporter', {
      uploadToArgos: !!process.env['ARGOS_TOKEN'] && process.env['ARGOS_TOKEN'] !== 'argos_token_placeholder',
    }],
  ],
  use: {
    baseURL: process.env['BASE_URL'] || 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: ['--disable-lcd-text', '--font-render-hinting=none'],
        },
      },
    },
  ],
});
