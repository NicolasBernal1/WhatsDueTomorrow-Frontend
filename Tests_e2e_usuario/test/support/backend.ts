import { UsesAbilities } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { Page } from 'playwright';

import { environment } from './environment';

export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
}

export class BackendSimulation {
  readonly requests: RecordedRequest[] = [];
  readonly dialogs: string[] = [];
}

const simulations = new WeakMap<Page, BackendSimulation>();

const API_PREFIXES = /^\/(auth|users|subjects|assignments|subtasks|notes|evaluations|calendar|reminders)(\/|$)/;

const appOrigin = () => new URL(environment.baseUrl).origin;

export const isBackendCall = (url: URL): boolean =>
  url.origin !== appOrigin() && API_PREFIXES.test(url.pathname);

export async function nativePageOf(actor: UsesAbilities): Promise<Page> {
  const page = await BrowseTheWebWithPlaywright.as(actor).currentPage();
  return (page as any).nativePage();
}

export async function simulationOf(actor: UsesAbilities): Promise<BackendSimulation> {
  const page = await nativePageOf(actor);

  let simulation = simulations.get(page);
  if (!simulation) {
    simulation = new BackendSimulation();
    simulations.set(page, simulation);
    const current = simulation;

    page.on('dialog', async dialog => {
      current.dialogs.push(dialog.message());
      await dialog.accept().catch(() => undefined);
    });

    await page.route(isBackendCall, route => {
      const request = route.request();
      current.requests.push({ method: request.method(), path: new URL(request.url()).pathname, body: safeBody(request.postData()) });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: [] }),
      });
    });
  }
  return simulation;
}

function safeBody(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}