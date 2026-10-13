import { Interaction } from '@serenity-js/core';

import { nativePageOf, simulationOf } from '../support/backend';

export const StoreTheSession = {
  withToken: (token: string) =>
    Interaction.where(`#actor tiene guardada una sesion iniciada`, async actor => {
      await simulationOf(actor);
      const page = await nativePageOf(actor);
      await page.addInitScript((t: string) => {
        if (!sessionStorage.getItem('e2e-seeded')) {
          localStorage.setItem('token', t);
          sessionStorage.setItem('e2e-seeded', '1');
        }
      }, token);
    }),
};