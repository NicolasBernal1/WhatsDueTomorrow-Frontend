import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Click } from '@serenity-js/web';

import { SubjectDetailsPage } from '../ui/SubjectDetailsPage';
import { SubjectsPage } from '../ui/SubjectsPage';

export const OpenSubject = {
  named: (subjectName: string) => Task.where(`#actor abre la asignatura "${ subjectName }" desde la lista`,
    Wait.upTo(Duration.ofSeconds(20)).until(SubjectsPage.cardOf(subjectName), isPresent()),
    Click.on(SubjectsPage.cardOf(subjectName)),
    Wait.upTo(Duration.ofSeconds(20)).until(SubjectDetailsPage.addClassButton(), isPresent()),
  ),
};
