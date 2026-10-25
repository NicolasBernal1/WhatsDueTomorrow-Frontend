import { config } from 'dotenv';
import * as path from 'node:path';

config({
  path: [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../../.env')],
});

export const env = {
  baseUrl: (process.env.E2E_BASE_URL ?? 'http://localhost:4200').replace(/\/$/, ''),
  apiUrl: (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  headless: process.env.HEADLESS === 'true',
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/api').replace(/\/$/, ''),
  ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b',
};
