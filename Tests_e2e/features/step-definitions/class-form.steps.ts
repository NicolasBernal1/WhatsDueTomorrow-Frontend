import { Then, When } from '@cucumber/cucumber';
import { containAtLeastOneItemThat, includes } from '@serenity-js/assertions';
import { Actor, Duration, Wait } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { ClassModalQuestions } from '../../test/questions/ClassModalQuestions';
import { Weekday } from '../../test/support/weekdays';
import { AddClass } from '../../test/tasks/AddClass';
import { EditClass } from '../../test/tasks/EditClass';
import { ClassModal } from '../../test/ui/ClassModal';

const WAIT = Duration.ofSeconds(15);

When('{pronoun} agrega a la asignatura {string} una clase {dia} de {hora} a {hora}', async (
  actor: Actor,
  subject: string,
  weekday: Weekday,
  startTime: string,
  endTime: string,
) => {
  await actor.attemptsTo(AddClass.toTheSubject(subject).on(weekday).from(startTime).to(endTime));
});

When('{pronoun} edita la clase de {string} para {dia} de {hora} a {hora}', async (
  actor: Actor,
  subject: string,
  weekday: Weekday,
  startTime: string,
  endTime: string,
) => {
  await actor.attemptsTo(EditClass.ofTheSubject(subject).to(weekday, startTime, endTime));
});

Then('{pronoun} observa el error {string} en el formulario', async (actor: Actor, message: string) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(ClassModalQuestions.errors(), containAtLeastOneItemThat(includes(message))),
  );
});

When('{pronoun} cancela el formulario de clase', async (actor: Actor) => {
  await actor.attemptsTo(Click.on(ClassModal.cancelButton()));
});
