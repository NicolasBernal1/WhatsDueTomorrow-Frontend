import { Ensure, equals } from '@serenity-js/assertions';
import { Question, Task } from '@serenity-js/core';
import { GetRequest, LastResponse, PostRequest, Send } from '@serenity-js/rest';

import { e2eNotes, subjectKey } from '../../support/notes';
import { withBearerToken } from './authorization';

interface SubjectsResponse {
  data: Array<{ id: number; name: string }>;
}

export const HaveASubject = {
  named: (subjectName: string) => ({
    taughtBy: (professor: string) => Task.where(`#actor tiene la asignatura "${ subjectName }" del profesor "${ professor }"`,
      Send.a(PostRequest.to('/subjects')
        .with({ name: subjectName, professor, credits: 3 })
        .using(withBearerToken())),
      Ensure.that(LastResponse.status(), equals(201)),

      Send.a(GetRequest.to('/subjects').using(withBearerToken())),
      e2eNotes().set(subjectKey(subjectName), Question.about(`id de "${ subjectName }"`, actor => {
        const subjects = LastResponse.body<SubjectsResponse>().data;
        return actor.answer(subjects).then(list => {
          const subject = list.find(s => s.name === subjectName);
          if (!subject) throw new Error(`La asignatura "${ subjectName }" no aparece en GET /subjects`);
          return subject.id;
        });
      })),
    ),
  }),
};
