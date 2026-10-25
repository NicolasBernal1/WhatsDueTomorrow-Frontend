import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  defaultCommandTimeout: 15000,
  requestTimeout: 15000,
  screenshotsFolder: "cypress_nicolas/screenshots",
  env: {
    commandDelay: process.env["CYPRESS_COMMAND_DELAY"] !== undefined ? Number(process.env["CYPRESS_COMMAND_DELAY"]) : 0,
    apiUrl: process.env["CYPRESS_apiUrl"] || "http://localhost:3000",
  },
  e2e: {
    baseUrl: process.env["CYPRESS_BASE_URL"] || "http://localhost:4200",
    specPattern: "cypress_nicolas/e2e/**/*.cy.ts",
    supportFile: "cypress_nicolas/support/e2e.ts",
    testIsolation: true,
    experimentalStudio: true,
  },
  component: {
    devServer: { framework: "angular", bundler: "webpack" },
    specPattern: "cypress_nicolas/component/**/*.cy.ts",
    supportFile: "cypress_nicolas/support/component.ts",
    indexHtmlFile: "cypress_nicolas/support/component-index.html",
  },
});
