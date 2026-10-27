import { defineConfig } from 'cypress';
import baseConfig from './cypress.marcello.config';

const registerReportPortalPlugin = require('@reportportal/agent-js-cypress/lib/plugin');


const rpConfig = {
  endpoint: process.env['RP_ENDPOINT'] ?? 'http://localhost:8080/api/v1',
  apiKey: process.env['RP_API_KEY'] ?? '',
  project: process.env['RP_PROJECT'] ?? 'whatsduetomorrow',
  launch: process.env['RP_LAUNCH'] ?? 'Asignaturas - Cypress',
  description: 'Pruebas de asignaturas (F07-F11 + búsqueda)',
  attributes: [{ key: 'modulo', value: 'asignaturas' }],
};

export default defineConfig({
  ...baseConfig,
  reporter: '@reportportal/agent-js-cypress',
  reporterOptions: rpConfig,
  e2e: {
    ...(baseConfig.e2e ?? {}),
    setupNodeEvents(on, config) {
      registerReportPortalPlugin(on, config);
      return config;
    },
  },
});
