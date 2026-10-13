import { config } from 'dotenv';
import * as path from 'node:path';

config({
  path: [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ],
  quiet: true,
});

export const environment = {
  baseUrl: (process.env.E2E_BASE_URL ?? 'http://localhost:4200').replace(/\/$/, ''),
  headless: process.env.HEADLESS !== 'false',
  chromePath: process.env.CHROME_PATH,
};