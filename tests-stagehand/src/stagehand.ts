import {
  Stagehand,
  localBrowser,
  type ModelConfig,
  type Page,
  type StagehandBrowser,
} from '@browserbasehq/stagehand';
import { envBoolean, requireEnv, type Provider } from './config.js';
import { createOllamaClient } from './ollama-client.js';

export type TestSession = {
  browser: StagehandBrowser;
  page: Page;
  stagehand: Stagehand;
};

function cloudModel(provider: Exclude<Provider, 'ollama'>): ModelConfig {
  if (provider === 'openai') {
    return {
      modelName: (process.env.OPENAI_MODEL ?? 'openai/gpt-4.1-mini') as `openai/${string}`,
      apiKey: requireEnv('OPENAI_API_KEY'),
    };
  }

  return {
    modelName: (process.env.GEMINI_MODEL ?? 'google/gemini-2.5-flash') as `google/${string}`,
    apiKey: requireEnv('GOOGLE_GENERATIVE_AI_API_KEY'),
  };
}

export async function createTestSession(provider: Provider): Promise<TestSession> {
  const model = provider === 'ollama' ? createOllamaClient() : cloudModel(provider);
  const isHeadless = envBoolean('HEADLESS', false);
  const browser = await localBrowser.launch({
    headless: isHeadless,
    viewport: { width: 1280, height: 800 },
    args: [
      '--window-size=1280,850',
      '--window-position=60,40',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });

  try {
    try {
      await (browser.context as any).grantPermissions?.(['clipboard-read', 'clipboard-write']);
    } catch {
      // Ignorar si el navegador local no requiere permisos explícitos
    }

    const stagehand = await Stagehand.create({
      browser,
      model,
      logging: { level: process.env.STAGEHAND_LOG_LEVEL === 'debug' ? 'debug' : 'info' },
    });
    const [page] = await browser.context.pages();
    if (!page) throw new Error('Stagehand no pudo inicializar la página del navegador.');
    return { browser, page, stagehand };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function closeTestSession(session: TestSession): Promise<void> {
  await session.stagehand.close();
  if (!session.browser.closed) await session.browser.close();
}
