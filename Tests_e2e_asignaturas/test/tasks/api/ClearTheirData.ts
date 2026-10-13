import { Interaction } from '@serenity-js/core';
import { CallAnApi } from '@serenity-js/rest';

import { e2eNotes } from '../../support/notes';

export const ClearTheirData = {
  now: () => Interaction.where(`#actor deja su cuenta sin clases ni asignaturas`, async actor => {
    const api = CallAnApi.as(actor);
    const token = await actor.answer(e2eNotes().get('token'));
    const headers = { Authorization: `Bearer ${ token }` };

    const send = async (method: 'GET' | 'DELETE', url: string) => {
      const response = await api.request({ method, url, headers });
      if (response.status >= 300) {
        throw new Error(`${ method } ${ url } respondió ${ response.status } al limpiar la cuenta de pruebas`);
      }
      return response.data;
    };

    for (const schoolClass of (await send('GET', '/subjects/classes')).data as Array<{ id: number }>) {
      await send('DELETE', `/subjects/classes/${ schoolClass.id }`);
    }
    for (const subject of (await send('GET', '/subjects')).data as Array<{ id: number }>) {
      await send('DELETE', `/subjects/${ subject.id }`);
    }
  }),
};
