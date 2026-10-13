import { Given } from '@cucumber/cucumber';
import { Actor } from '@serenity-js/core';

import { HaveAnAccount } from '../../test/tasks/api/HaveAnAccount';
import { HaveASubject } from '../../test/tasks/api/HaveASubject';
import { LogIn } from '../../test/tasks/LogIn';
import { OpenSubjects } from '../../test/tasks/OpenSubjects';

Given('{actor} tiene una cuenta', async (actor: Actor) => {
  await actor.attemptsTo(HaveAnAccount.forActor(actor.name));
});

Given('{actor} tiene la asignatura {string} del profesor {string}', async (actor: Actor, subject: string, professor: string) => {
  await actor.attemptsTo(HaveASubject.named(subject).taughtBy(professor));
});

Given('{actor} inicio sesion en la aplicacion', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.withTheirAccount());
});

Given('{actor} abre la lista de asignaturas', async (actor: Actor) => {
  await actor.attemptsTo(OpenSubjects.list());
});
