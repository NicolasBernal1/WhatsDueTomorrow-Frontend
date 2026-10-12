import { Task } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { toOptionLabel, Weekday } from '../support/weekdays';
import { ClassModal } from '../ui/ClassModal';

export const FillClassForm = {
  with: (weekday: Weekday, startTime: string, endTime: string) => Task.where(
    `#actor completa el formulario de clase: ${ weekday }, de ${ startTime } a ${ endTime }`,
    Click.on(ClassModal.dayDropdown()),
    Click.on(ClassModal.option(toOptionLabel(weekday))),
    Click.on(ClassModal.startTimeDropdown()),
    Click.on(ClassModal.option(startTime)),
    Click.on(ClassModal.endTimeDropdown()),
    Click.on(ClassModal.option(endTime)),
  ),
};
