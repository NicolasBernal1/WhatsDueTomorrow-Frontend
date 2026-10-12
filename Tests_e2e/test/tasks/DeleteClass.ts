import { Task } from '@serenity-js/core';
import { Click, ModalDialog, RightClick } from '@serenity-js/web';

import { SchedulePage } from '../ui/SchedulePage';

const openContextMenuAndChooseDelete = (subjectName: string) => [
  RightClick.on(SchedulePage.cardOf(subjectName)),
  Click.on(SchedulePage.contextMenuOption('Delete')),
] as const;

export const DeleteClass = {
  ofTheSubject: (subjectName: string) => Task.where(`#actor elimina la clase de "${ subjectName }" y confirma`,
    ModalDialog.acceptNext(),
    ...openContextMenuAndChooseDelete(subjectName),
  ),

  butCancelsFor: (subjectName: string) => Task.where(`#actor intenta eliminar la clase de "${ subjectName }" pero cancela la confirmacion`,
    ModalDialog.dismissNext(),
    ...openContextMenuAndChooseDelete(subjectName),
  ),
};
