import { Question } from '@serenity-js/core';
import { Page } from '@serenity-js/web';

export const CurrentPath = {
  ofThePage: () => Question.about<Promise<string>>('ruta actual de la pagina', async actor => {
    const page = await actor.answer(Page.current());
    const url = await page.url();
    return url.pathname;
  }),
};