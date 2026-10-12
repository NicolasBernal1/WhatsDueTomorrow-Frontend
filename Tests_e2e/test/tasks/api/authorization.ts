import { Question } from '@serenity-js/core';

import { e2eNotes } from '../../support/notes';

const bearerToken = () => Question.about<Promise<string>>('token de autorización del actor', async actor =>
  `Bearer ${ await actor.answer(e2eNotes().get('token')) }`,
);

export const withBearerToken = () => ({ headers: { Authorization: bearerToken() } });
