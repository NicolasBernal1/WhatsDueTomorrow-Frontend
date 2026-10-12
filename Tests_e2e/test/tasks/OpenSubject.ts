import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Click } from '@serenity-js/web';

import { Navbar } from '../ui/Navbar';
import { SubjectDetailsPage } from '../ui/SubjectDetailsPage';
import { SubjectsPage } from '../ui/SubjectsPage';

export const OpenSubject = {
  fromTheSubjectsList: (subjectName: string) => Task.where(`#actor abre la asignatura "${ subjectName }" desde la lista de asignaturas`,
    Click.on(Navbar.subjectsLink()),
    Click.on(SubjectsPage.cardOf(subjectName)),
    Wait.upTo(Duration.ofSeconds(20)).until(SubjectDetailsPage.addClassButton(), isPresent()),
  ),
};
