import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  defaultCommandTimeout: 15000,
  requestTimeout: 15000,
  env: {
    // Retraso en milisegundos entre comandos para permitir visualizar el avance en Chrome (1 segundo por defecto)
    commandDelay: process.env['CYPRESS_COMMAND_DELAY'] !== undefined
      ? Number(process.env['CYPRESS_COMMAND_DELAY'])
      : 1000,
  },
  e2e: {
    baseUrl: process.env['CYPRESS_BASE_URL'] || 'https://whats-due-tomorrow-frontend.vercel.app',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    testIsolation: true,
  },
});
