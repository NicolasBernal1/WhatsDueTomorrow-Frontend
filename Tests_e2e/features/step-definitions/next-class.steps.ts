import { Then, When } from '@cucumber/cucumber';
import { equals, matches } from '@serenity-js/assertions';
import { Actor, Duration, Wait } from '@serenity-js/core';

import { WaitForNetworkIdle } from '../../test/interactions/WaitForNetworkIdle';
import { NextClassQuestions } from '../../test/questions/ScheduleQuestions';
import { hasTimeRange } from '../../test/support/expectations';
import { toOptionLabel, toWeekday, Weekday } from '../../test/support/weekdays';
import { OpenClassFromSchedule } from '../../test/tasks/OpenClassFromSchedule';

const WAIT = Duration.ofSeconds(15);

function expectedDayLabel(weekday: Weekday): string {
  if (weekday === toWeekday('hoy')) return 'Hoy';
  if (weekday === toWeekday('mañana')) return 'Mañana';
  return toOptionLabel(weekday);
}

Then('{pronoun} observa que su proxima clase es {string} {dia} de {hora} a {hora}', async (
  actor: Actor,
  subject: string,
  weekday: Weekday,
  startTime: string,
  endTime: string,
) => {
  const label = expectedDayLabel(weekday);
  const timeText = new RegExp(`^${ label } · ${ hasTimeRange(startTime, endTime).source }`);

  await actor.attemptsTo(
    Wait.upTo(WAIT).until(NextClassQuestions.subject(), equals(subject)),
    Wait.upTo(WAIT).until(NextClassQuestions.time(), matches(timeText)),
  );
});

Then('{pronoun} observa que la proxima clase es del profesor {string}', async (actor: Actor, professor: string) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(NextClassQuestions.professor(), equals(professor)),
  );
});

Then('{pronoun} observa el aviso de proxima clase {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(
    WaitForNetworkIdle.toSettle(),
    Wait.upTo(WAIT).until(NextClassQuestions.emptyMessage(), equals(message)),
  );
});

When('{pronoun} hace clic en Ver detalles de su proxima clase', async (actor: Actor) => {
  await actor.attemptsTo(OpenClassFromSchedule.byClickingSeeDetailsOnTheNextClass());
});

