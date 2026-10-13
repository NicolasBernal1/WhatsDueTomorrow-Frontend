import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isPresent, not } from '@serenity-js/assertions';
import { Actor, Duration, Question, Wait } from '@serenity-js/core';
import { isEnabled } from '@serenity-js/web';

import { lastDialogMessage } from '../../test/interactions/RespondToNextDialog';
import { CurrentPath } from '../../test/questions/CurrentPath';
import {
  SubjectDetailsQuestions,
  SubjectModalQuestions,
  SubjectsQuestions,
} from '../../test/questions/SubjectsQuestions';
import { e2eNotes, subjectKey } from '../../test/support/notes';
import { AddSubject } from '../../test/tasks/AddSubject';
import { DeleteSubject } from '../../test/tasks/DeleteSubject';
import { EditSubject } from '../../test/tasks/EditSubject';
import { OpenSubject } from '../../test/tasks/OpenSubject';
import { OpenSubjects } from '../../test/tasks/OpenSubjects';
import { SearchSubjects } from '../../test/tasks/SearchSubjects';
import { SubjectModal } from '../../test/ui/SubjectModal';
import { SubjectsPage } from '../../test/ui/SubjectsPage';
import { FillSubjectForm } from '../../test/tasks/FillSubjectForm';

const WAIT = Duration.ofSeconds(15);

/* ---------- Navegacion ---------- */

When('{pronoun} abre la lista de asignaturas', async (actor: Actor) => {
  await actor.attemptsTo(OpenSubjects.list());
});

When('{pronoun} abre la asignatura {string}', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(OpenSubject.named(subject));
});

/* ---------- F07 Listar ---------- */

Then('{pronoun} ve la asignatura {string} del profesor {string}', async (actor: Actor, subject: string, professor: string) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(SubjectsPage.cardOf(subject), isPresent()),
    Ensure.eventually(SubjectsQuestions.professorOf(subject), equals(professor)),
  );
});

Then('{pronoun} ve la asignatura {string} con {int} créditos', async (actor: Actor, subject: string, credits: number) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(SubjectsPage.cardOf(subject), isPresent()),
    Ensure.eventually(SubjectsQuestions.creditsOf(subject), includes(`${ credits } cr.`)),
  );
});

Then('{pronoun} no ve la asignatura {string}', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(SubjectsPage.cardOf(subject), not(isPresent())),
  );
});

Then('{pronoun} ve el mensaje {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(SubjectsPage.emptyMessage(), isPresent()),
    Ensure.eventually(SubjectsQuestions.emptyMessage(), equals(message)),
  );
});

Then('{pronoun} ve exactamente {int} asignaturas', async (actor: Actor, count: number) => {
  const names = Question.about<Promise<number>>('cantidad de asignaturas', async asker =>
    (await asker.answer(SubjectsQuestions.names())).length);
  await actor.attemptsTo(Wait.upTo(WAIT).until(names, equals(count)));
});

/* ---------- F08 Detalle ---------- */

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

/* ---------- F09 Registrar ---------- */

When('{pronoun} registra la asignatura {string} del profesor {string} con {int} créditos', async (
  actor: Actor,
  name: string,
  professor: string,
  credits: number,
) => {
  await actor.attemptsTo(AddSubject.registering({ name, professor, credits }));
});

When('{pronoun} intenta registrar la asignatura {string} del profesor {string} con {int} créditos', async (
  actor: Actor,
  name: string,
  professor: string,
  credits: number,
) => {
  await actor.attemptsTo(AddSubject.tryingToRegister({ name, professor, credits }));
});

When('{pronoun} abre el formulario de nueva asignatura', async (actor: Actor) => {
  await actor.attemptsTo(AddSubject.openForm());
});

When('{pronoun} cancela el formulario', async (actor: Actor) => {
  await actor.attemptsTo(AddSubject.cancelling());
});

Then('{pronoun} ve el error {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(SubjectModalQuestions.errors(), contain(message)),
  );
});

Then('{pronoun} no puede guardar la asignatura', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.that(SubjectModal.submit(), not(isEnabled())),
  );
});

Then('{pronoun} ve que el formulario de asignatura se cierra', async (actor: Actor) => {
  await actor.attemptsTo(
    Wait.upTo(WAIT).until(SubjectModal.modal(), not(isPresent())),
  );
});

/* ---------- F10 Editar ---------- */

When('{pronoun} abre el formulario de edición de {string}', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(EditSubject.openFormOf(subject));
});

When('{pronoun} cambia la asignatura {string} a nombre {string} y profesor {string}', async (
  actor: Actor,
  subject: string,
  name: string,
  professor: string,
) => {
  await actor.attemptsTo(EditSubject.changing(subject, { name, professor }));
});

When('{pronoun} cancela la edición después de cambiar el nombre a {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(
    FillSubjectForm.replacingWith({ name }),
    EditSubject.cancelling(),
  );
});

Then('{pronoun} ve en el formulario el nombre {string} y el profesor {string}', async (actor: Actor, name: string, professor: string) => {
  await actor.attemptsTo(
    Ensure.eventually(SubjectModalQuestions.title(), equals('Edit Subject')),
    Ensure.eventually(SubjectModalQuestions.nameValue(), equals(name)),
    Ensure.eventually(SubjectModalQuestions.professorValue(), equals(professor)),
  );
});

/* ---------- F11 Eliminar ---------- */

When('{pronoun} elimina la asignatura {string} y acepta la confirmación', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(DeleteSubject.confirming(subject));
});

When('{pronoun} intenta eliminar la asignatura {string} y cancela la confirmación', async (actor: Actor, subject: string) => {
  await actor.attemptsTo(DeleteSubject.cancelling(subject));
});

Then('{pronoun} ve que el navegador pidió confirmar con el mensaje {string}', async (actor: Actor, message: string) => {
  const shown = Question.about<string | undefined>('mensaje de confirmación', () => lastDialogMessage());
  await actor.attemptsTo(Ensure.that(shown, equals(message)));
});

/* ---------- Buscar ---------- */

When('{pronoun} busca {string}', async (actor: Actor, term: string) => {
  await actor.attemptsTo(SearchSubjects.for(term));
});

When('{pronoun} borra el texto de búsqueda', async (actor: Actor) => {
  await actor.attemptsTo(SearchSubjects.clearing());
});
