import { equals, isPresent } from '@serenity-js/assertions';
import { Duration, Task, Wait } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { CurrentPath } from '../questions/CurrentPath';
import { Navbar } from '../ui/Navbar';
import { SubjectsPage } from '../ui/SubjectsPage';

export const OpenSubjects = {
  list: () => Task.where(`#actor abre la lista de asignaturas`,
    Click.on(Navbar.subjectsLink()),
    Wait.upTo(Duration.ofSeconds(20)).until(CurrentPath.ofThePage(), equals('/subjects')),
    Wait.upTo(Duration.ofSeconds(20)).until(SubjectsPage.searchBox(), isPresent()),
  ),
};
