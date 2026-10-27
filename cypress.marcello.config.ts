import { defineConfig } from 'cypress';


export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  defaultCommandTimeout: 15000, 
  requestTimeout: 60000,
  responseTimeout: 60000,
  pageLoadTimeout: 90000,
  screenshotsFolder: 'cypress_marcello/screenshots',
  env: {
    apiUrl: process.env['CYPRESS_apiUrl'] || 'https://whatsduetomorrow-backed.onrender.com',
    
    expectIdorFixed: true,
  },
  e2e: {
    baseUrl: process.env['CYPRESS_BASE_URL'] || 'https://whats-due-tomorrow-frontend.vercel.app',
    specPattern: 'cypress_marcello/e2e/**/*.cy.ts',
    supportFile: 'cypress_marcello/support/e2e.ts',
    testIsolation: true,
  },
  component: {
    devServer: { framework: 'angular', bundler: 'webpack' },
    specPattern: 'cypress_marcello/component/**/*.cy.ts',
    supportFile: 'cypress_marcello/support/component.ts',
    indexHtmlFile: 'cypress_marcello/support/component-index.html',
  },
});
