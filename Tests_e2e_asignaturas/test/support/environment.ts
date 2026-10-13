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
  apiUrl: (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  headless: process.env.HEADLESS !== 'false',
  chromePath: process.env.CHROME_PATH,
};

export interface Credentials {
  email: string;
  password: string;
}

const unaccented = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function credentialsFor(actorName: string): Credentials | undefined {
  const prefix = `E2E_${ unaccented(actorName).toUpperCase() }`;
  const email = process.env[`${ prefix }_EMAIL`];
  const password = process.env[`${ prefix }_PASSWORD`];

  if (!email && !password) return undefined;
  if (!email || !password) {
    throw new Error(`Configura ${ prefix }_EMAIL y ${ prefix }_PASSWORD juntas (falta una de las dos).`);
  }
  return { email, password };
}
