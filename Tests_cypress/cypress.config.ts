import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  defaultCommandTimeout: 15000,
  requestTimeout: 15000,

  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'mochawesome-report',
    overwrite: false,
    html: true,
    json: true,
  },

  env: {
    commandDelay: process.env['CYPRESS_COMMAND_DELAY'] !== undefined
      ? Number(process.env['CYPRESS_COMMAND_DELAY'])
      : 1000,
    apiUrl: process.env['CYPRESS_apiUrl'] || 'https://localhost:3000',
  },

  e2e: {
    baseUrl: process.env['CYPRESS_BASE_URL'] || 'https://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    testIsolation: true,
    experimentalStudio: true,
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.ts',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
  },
});
