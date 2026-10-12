import { Ensure, equals } from '@serenity-js/assertions';
import { Question, Task } from '@serenity-js/core';
import { LastResponse, PostRequest, Send } from '@serenity-js/rest';

import { e2eNotes, subjectKey } from '../../support/notes';
import { Weekday } from '../../support/weekdays';
import { withBearerToken } from './authorization';

export const HaveAClass = {
  of: (subjectName: string) => ({
    on: (weekday: Weekday) => ({
      from: (startTime: string) => ({
        to: (endTime: string) => Task.where(
          `#actor tiene una clase de "${ subjectName }" el ${ weekday } de ${ startTime } a ${ endTime }`,
          Send.a(PostRequest.to('/subjects/classes')
            .with(Question.about('datos de la clase', async actor => ({
              dayOfWeek: weekday,
              startTime,
              endTime,
              subjectId: await actor.answer(e2eNotes().get(subjectKey(subjectName))),
            })))
            .using(withBearerToken())),
          Ensure.that(LastResponse.status(), equals(201)),
        ),
      }),
    }),
  }),
};
