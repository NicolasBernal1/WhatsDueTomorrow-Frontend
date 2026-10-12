import { When } from '@cucumber/cucumber';
import { Actor } from '@serenity-js/core';

import { DeleteClass } from '../../test/tasks/DeleteClass';

When('{pronoun} elimina la clase de {string} y confirma', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(DeleteClass.ofTheSubject(subject));
});

When('{pronoun} intenta eliminar la clase de {string} pero cancela la confirmacion', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(DeleteClass.butCancelsFor(subject));
});
