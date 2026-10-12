import { Then, When } from '@cucumber/cucumber';
import { contain, equals, not } from '@serenity-js/assertions';
import { Actor, Duration, Wait } from '@serenity-js/core';

import { WaitForNetworkIdle } from '../../test/interactions/WaitForNetworkIdle';
import { ScheduleQuestions } from '../../test/questions/ScheduleQuestions';
import { includeAClassScheduledFrom } from '../../test/support/expectations';
import { toOptionLabel, WEEKDAYS } from '../../test/support/weekdays';
import { GoToSchedule } from '../../test/tasks/GoToSchedule';
import { OpenSchedule } from '../../test/tasks/OpenSchedule';

const WAIT = Duration.ofSeconds(15);

When('{pronoun} consulta su horario', async (actor: Actor) => {
  await actor.attemptsTo(OpenSchedule.afresh());
});

When('{pronoun} va al horario desde la barra de navegacion', async (actor: Actor) => {
  await actor.attemptsTo(GoToSchedule.fromTheNavbar());
});

Then('{pronoun} observa los siete dias de la semana en el horario', async (actor: Actor) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(ScheduleQuestions.dayHeaders(), equals(WEEKDAYS.map(toOptionLabel))) 
  );
});

Then('{pronoun} observa {int} clase(s) en el horario', async (actor: Actor, count: number) => {
  await actor.attemptsTo(
    WaitForNetworkIdle.toSettle(),
    Wait.upTo(WAIT).until(ScheduleQuestions.classCount(), equals(count)),
  );
});

Then('{pronoun} observa en el horario la clase de {string} de {hora} a {hora}', async (
  actor: Actor,
  subject: string,
  startTime: string,
  endTime: string,
) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(ScheduleQuestions.classNames(), contain(subject)),
    Wait.upTo(WAIT).until(ScheduleQuestions.classTimes(), includeAClassScheduledFrom(startTime, endTime)),
  );
});

Then('{pronoun} no observa ninguna clase de {string} en el horario', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(
    WaitForNetworkIdle.toSettle(),
    Wait.upTo(WAIT).until(ScheduleQuestions.classNames(), not(contain(subject))),
  );
});
