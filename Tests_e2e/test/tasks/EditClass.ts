import { Task } from '@serenity-js/core';
import { Click, RightClick } from '@serenity-js/web';

import { Weekday } from '../support/weekdays';
import { ClassModal } from '../ui/ClassModal';
import { SchedulePage } from '../ui/SchedulePage';
import { FillClassForm } from './FillClassForm';

export const EditClass = {
  ofTheSubject: (subjectName: string) => ({
    to: (weekday: Weekday, startTime: string, endTime: string) => Task.where(
      `#actor edita la clase de "${ subjectName }" para ${ weekday } de ${ startTime } a ${ endTime }`,
      RightClick.on(SchedulePage.cardOf(subjectName)),
      Click.on(SchedulePage.contextMenuOption('Edit')),
      FillClassForm.with(weekday, startTime, endTime),
      Click.on(ClassModal.saveButton()),
    ),
  }),
};
