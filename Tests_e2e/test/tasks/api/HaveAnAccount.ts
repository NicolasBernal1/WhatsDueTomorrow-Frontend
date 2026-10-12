import { Ensure, equals } from '@serenity-js/assertions';
import { Interaction, Question, Task } from '@serenity-js/core';
import { LastResponse, PostRequest, Send } from '@serenity-js/rest';

import { Credentials, credentialsFor } from '../../support/environment';
import { e2eNotes } from '../../support/notes';
import { ClearTheirData } from './ClearTheirData';

const unaccented = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const GenerateCredentials = () => Interaction.where(`#actor genera credenciales unicas`, async actor => {
  const unique = `${ Date.now() }${ Math.floor(Math.random() * 10_000) }`;
  const email = `e2e.${ unaccented(actor.name).toLowerCase() }.${ unique }@test.com`;

  await e2eNotes().set('email', email).performAs(actor);
  await e2eNotes().set('password', 'Clave123').performAs(actor);
});

const registrationPayload = () => Question.about('datos de registro', async actor => ({
  name: actor.name,
  email: await actor.answer(e2eNotes().get('email')),
  password: await actor.answer(e2eNotes().get('password')),
}));

const loginPayload = () => Question.about('credenciales de acceso', async actor => ({
  email: await actor.answer(e2eNotes().get('email')),
  password: await actor.answer(e2eNotes().get('password')),
}));

const registeredAccount = () => Task.where(`#actor tiene una cuenta registrada`,
  GenerateCredentials(),
  Send.a(PostRequest.to('/auth/register').with(registrationPayload())),
  Ensure.that(LastResponse.status(), equals(201)),
  logInThroughTheApi(),
);

const existingAccount = (credentials: Credentials) => Task.where(`#actor usa su cuenta de pruebas existente`,
  e2eNotes().set('email', credentials.email),
  e2eNotes().set('password', credentials.password),
  logInThroughTheApi(),
  ClearTheirData.now(),
);

function logInThroughTheApi() {
  return Task.where(`#actor obtiene su token mediante la API`,
    Send.a(PostRequest.to('/auth/login').with(loginPayload())),
    Ensure.that(LastResponse.status(), equals(201)),
    e2eNotes().set('token', LastResponse.body<{ data: { token: string } }>().data.token),
  );
}

export const HaveAnAccount = {
  forActor: (actorName: string) => {
    const credentials = credentialsFor(actorName);
    return credentials ? existingAccount(credentials) : registeredAccount();
  },
};
