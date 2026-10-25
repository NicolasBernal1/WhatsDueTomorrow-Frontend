import { Stagehand } from '@browserbasehq/stagehand';

import { env } from './env';
import { ollamaClient } from './ollama-client';

export async function launchStagehand(): Promise<Stagehand> {
  const stagehand = new Stagehand({
    env: 'LOCAL',
    llmClient: ollamaClient(),
    localBrowserLaunchOptions: {
      headless: env.headless,
      viewport: { width: 1366, height: 900 },
    },
    domSettleTimeoutMs: 4_000,
    verbose: 1,
    disablePino: true,
    enableCaching: false,
  });

  await stagehand.init();
  return stagehand;
}
