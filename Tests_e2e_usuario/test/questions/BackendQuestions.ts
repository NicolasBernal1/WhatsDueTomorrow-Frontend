import { Question } from '@serenity-js/core';

import { simulationOf } from '../support/backend';

export const BackendQuestions = {
  requestsSent: (method: string, path: string) =>
    Question.about<Promise<number>>(`peticiones ${ method } ${ path }`, async actor => {
      const { requests } = await simulationOf(actor);
      return requests.filter(r => r.method === method && r.path === path).length;
    }),

  lastBodySent: (method: string, path: string) =>
    Question.about<Promise<unknown>>(`ultimo cuerpo enviado en ${ method } ${ path }`, async actor => {
      const { requests } = await simulationOf(actor);
      const sent = requests.filter(r => r.method === method && r.path === path);
      return sent[sent.length - 1]?.body;
    }),

  alertsShown: () =>
    Question.about<Promise<string[]>>('alertas mostradas por el navegador', async actor => {
      const { dialogs } = await simulationOf(actor);
      return [...dialogs];
    }),
};