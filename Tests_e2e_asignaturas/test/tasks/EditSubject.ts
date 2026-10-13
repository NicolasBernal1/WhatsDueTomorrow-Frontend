import { isPresent, not } from '@serenity-js/assertions';
import { Duration, Task, Wait } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { ContextClick } from '../interactions/ContextClick';
import { SubjectModal } from '../ui/SubjectModal';
import { SubjectsPage } from '../ui/SubjectsPage';
import { FillSubjectForm, SubjectData } from './FillSubjectForm';

const WAIT = Duration.ofSeconds(20);

export const EditSubject = {
  openFormOf: (subjectName: string) => Task.where(`#actor abre el formulario de edicion de "${ subjectName }"`,
    Wait.upTo(WAIT).until(SubjectsPage.cardOf(subjectName), isPresent()),
    ContextClick.onXPath(`la tarjeta de "${ subjectName }"`, SubjectsPage.cardXPath(subjectName)),
    Wait.upTo(WAIT).until(SubjectsPage.contextMenuEdit(), isPresent()),
    Click.on(SubjectsPage.contextMenuEdit()),
    Wait.upTo(WAIT).until(SubjectModal.modal(), isPresent()),
  ),

  changing: (subjectName: string, changes: Partial<SubjectData>) =>
    Task.where(`#actor edita la asignatura "${ subjectName }"`,
      EditSubject.openFormOf(subjectName),
      FillSubjectForm.replacingWith(changes),
      Click.on(SubjectModal.submit()),
      Wait.upTo(WAIT).until(SubjectModal.modal(), not(isPresent())),
    ),

  cancelling: () => Task.where(`#actor cancela la edicion`,
    Click.on(SubjectModal.cancel()),
    Wait.upTo(WAIT).until(SubjectModal.modal(), not(isPresent())),
  ),
};
