import { Then, When } from '@cucumber/cucumber';
import { equals } from '@serenity-js/assertions';
import { Actor, Duration, Question, Wait } from '@serenity-js/core';

import { CurrentPath } from '../../test/questions/CurrentPath';
import { SubjectDetailsQuestions } from '../../test/questions/SubjectDetailsQuestions';
import { e2eNotes, subjectKey } from '../../test/support/notes';
import { OpenClassFromSchedule } from '../../test/tasks/OpenClassFromSchedule';

const WAIT = Duration.ofSeconds(15);

When('{pronoun} hace clic en la clase de {string} del horario', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(OpenClassFromSchedule.byClickingTheClassOf(subject));
});

Then('{pronoun} llega a los detalles de la asignatura {string} del profesor {string}', async (
  actor: Actor,
  subject: string,
  professor: string,
) => {
  const expectedPath = Question.about<Promise<string>>(`ruta de "${ subject }"`, async asker =>
    `/subjects/${ await asker.answer(e2eNotes().get(subjectKey(subject))) }`);

  await actor.attemptsTo(
    Wait.upTo(WAIT).until(CurrentPath.ofThePage(), equals(expectedPath)),
    Wait.upTo(WAIT).until(SubjectDetailsQuestions.title(), equals(subject)),
    Wait.upTo(WAIT).until(SubjectDetailsQuestions.professor(), equals(professor)),
  );
});
