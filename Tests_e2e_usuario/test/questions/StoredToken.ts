import { Question } from '@serenity-js/core';

import { nativePageOf } from '../support/backend';

export const StoredToken = {
  inTheBrowser: () => Question.about<Promise<string | null>>('sesion guardada en el navegador', async actor => {
    const page = await nativePageOf(actor);
    return page.evaluate(() => localStorage.getItem('token'));
  }),
};