import { Interaction } from '@serenity-js/core';

import { isBackendCall, nativePageOf, simulationOf } from '../support/backend';

export class SimulateTheBackend {
  static respondsTo(method: string, path: string) {
    return {
      with: (status: number, data: unknown = null) =>
        Interaction.where(`#actor simula que el servidor responde ${ status } a ${ method } ${ path }`, async actor => {
          const simulation = await simulationOf(actor);
          const page = await nativePageOf(actor);

          await page.route(
            (url: URL) => isBackendCall(url) && url.pathname === path,
            route => {
              const request = route.request();
              if (request.method() !== method) return route.fallback();

              let body: unknown = null;
              const raw = request.postData();
              if (raw !== null) {
                try { body = JSON.parse(raw); } catch { body = raw; }
              }
              simulation.requests.push({ method, path, body });

              return route.fulfill({
                status,
                contentType: 'application/json',
                body: JSON.stringify({ status, message: status < 400 ? 'ok' : 'error', data }),
              });
            },
          );
        }),
    };
  }
}