import { Task } from '@serenity-js/core';
import { Clear, Enter } from '@serenity-js/web';

import { SubjectsPage } from '../ui/SubjectsPage';

export const SearchSubjects = {
  for: (term: string) => Task.where(`#actor busca "${ term }" en la lista de asignaturas`,
    Enter.theValue(term).into(SubjectsPage.searchBox()),
  ),

  clearing: () => Task.where(`#actor borra el texto de busqueda`,
    Clear.theValueOf(SubjectsPage.searchBox()),
  ),
};
