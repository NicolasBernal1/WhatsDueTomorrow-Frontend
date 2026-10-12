import { Task } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { SchedulePage } from '../ui/SchedulePage';

export const OpenClassFromSchedule = {
  byClickingTheClassOf: (subjectName: string) => Task.where(`#actor hace clic en la clase de "${ subjectName }" del horario`,
    Click.on(SchedulePage.cardOf(subjectName)),
  ),

  byClickingSeeDetailsOnTheNextClass: () => Task.where(`#actor hace clic en "Ver detalles" de su proxima clase`,
    Click.on(SchedulePage.nextClassDetailsButton()),
  ),
};
