import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Click, isVisible } from '@serenity-js/web';

import { SubjectModal } from '../ui/SubjectModal';
import { SubjectsPage } from '../ui/SubjectsPage';
import { FillSubjectForm, SubjectData } from './FillSubjectForm';

const WAIT = Duration.ofSeconds(20);

export const AddSubject = {
  openForm: () => Task.where(`#actor abre el formulario de nueva asignatura`,
    Click.on(SubjectsPage.addSubjectButton()),
    Wait.upTo(WAIT).until(SubjectModal.modal(), isPresent()),
  ),

  tryingToRegister: (data: SubjectData) => Task.where(`#actor intenta registrar la asignatura "${ data.name }"`,
    AddSubject.openForm(),
    FillSubjectForm.with(data),
  ),

  registering: (data: SubjectData) => Task.where(`#actor registra la asignatura "${ data.name }"`,
    AddSubject.tryingToRegister(data),
    Click.on(SubjectModal.submit()),
    Wait.upTo(WAIT).until(SubjectsPage.cardOf(data.name), isVisible()),
  ),

  cancelling: () => Task.where(`#actor cancela el formulario`,
    Click.on(SubjectModal.cancel()),
  ),
};
