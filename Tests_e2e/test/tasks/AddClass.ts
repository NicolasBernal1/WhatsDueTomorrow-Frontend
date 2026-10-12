import { Task } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { Weekday } from '../support/weekdays';
import { SubjectDetailsPage } from '../ui/SubjectDetailsPage';
import { ClassModal } from '../ui/ClassModal';
import { FillClassForm } from './FillClassForm';
import { OpenSubject } from './OpenSubject';

export const AddClass = {
  toTheSubject: (subjectName: string) => ({
    on: (weekday: Weekday) => ({
      from: (startTime: string) => ({
        to: (endTime: string) => Task.where(
          `#actor agrega a "${ subjectName }" una clase el ${ weekday } de ${ startTime } a ${ endTime }`,
          OpenSubject.fromTheSubjectsList(subjectName),
          Click.on(SubjectDetailsPage.addClassButton()),
          FillClassForm.with(weekday, startTime, endTime),
          Click.on(ClassModal.saveButton()),
        ),
      }),
    }),
  }),
};
