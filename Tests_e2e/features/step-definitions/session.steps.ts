import { Given, When } from '@cucumber/cucumber';
import { Actor } from '@serenity-js/core';

import { HaveAClass } from '../../test/tasks/api/HaveAClass';
import { HaveAnAccount } from '../../test/tasks/api/HaveAnAccount';
import { HaveASubject } from '../../test/tasks/api/HaveASubject';
import { LogIn } from '../../test/tasks/LogIn';
import { Weekday } from '../../test/support/weekdays';

Given('{actor} tiene una cuenta', async (actor: Actor) => {
  await actor.attemptsTo(HaveAnAccount.forActor(actor.name));
});

Given('{actor} tiene la asignatura {string} del profesor {string}', async (actor: Actor, subject: string, professor: string) => {
  await actor.attemptsTo(HaveASubject.named(subject).taughtBy(professor));
});

Given('{actor} tiene una clase de {string} {dia} de {hora} a {hora}', async (
  actor: Actor,
  subject: string,
  weekday: Weekday,
  startTime: string,
  endTime: string,
) => {
  await actor.attemptsTo(HaveAClass.of(subject).on(weekday).from(startTime).to(endTime));
});

Given('{actor} inicio sesion en la aplicacion', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.withTheirAccount());
});

When('{pronoun} inicia sesion en la aplicacion', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.withTheirAccount());
});

When('{actor} inicia sesion en la aplicacion', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.withTheirAccount());
});
