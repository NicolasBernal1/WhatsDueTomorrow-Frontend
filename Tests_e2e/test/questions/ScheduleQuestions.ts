import { Question } from '@serenity-js/core';
import { Text } from '@serenity-js/web';

import { SchedulePage } from '../ui/SchedulePage';

export const ScheduleQuestions = {
  dayHeaders: () => Text.ofAll(SchedulePage.dayHeaders()),
  classNames: () => Text.ofAll(SchedulePage.classNames()),
  classTimes: () => Text.ofAll(SchedulePage.classTimes()),
  classCount: () => Question.about<Promise<number>>('cantidad de clases en el horario', async actor => {
    const names = await actor.answer(Text.ofAll(SchedulePage.classNames()));
    return names.length;
  }),
};

export const NextClassQuestions = {
  subject: () => Text.of(SchedulePage.nextClassSubject()),
  professor: () => Text.of(SchedulePage.nextClassProfessor()),
  time: () => Text.of(SchedulePage.nextClassTime()),
  emptyMessage: () => Text.of(SchedulePage.nextClassEmptyMessage()),
};
