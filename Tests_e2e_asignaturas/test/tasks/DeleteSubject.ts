import { isPresent, not } from '@serenity-js/assertions';
import { Duration, Task, Wait } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { ContextClick } from '../interactions/ContextClick';
import { RespondToNextDialog } from '../interactions/RespondToNextDialog';
import { SubjectsPage } from '../ui/SubjectsPage';

const WAIT = Duration.ofSeconds(20);

const openMenuOf = (subjectName: string) => Task.where(`#actor abre el menu contextual de "${ subjectName }"`,
  Wait.upTo(WAIT).until(SubjectsPage.cardOf(subjectName), isPresent()),
  ContextClick.onXPath(`la tarjeta de "${ subjectName }"`, SubjectsPage.cardXPath(subjectName)),
  Wait.upTo(WAIT).until(SubjectsPage.contextMenuDelete(), isPresent()),
);

export const DeleteSubject = {
  confirming: (subjectName: string) => Task.where(`#actor elimina la asignatura "${ subjectName }" y acepta la confirmacion`,
    openMenuOf(subjectName),
    RespondToNextDialog.byAccepting(),
    Click.on(SubjectsPage.contextMenuDelete()),
    Wait.upTo(WAIT).until(SubjectsPage.cardOf(subjectName), not(isPresent())),
  ),

  cancelling: (subjectName: string) => Task.where(`#actor intenta eliminar "${ subjectName }" y cancela la confirmacion`,
    openMenuOf(subjectName),
    RespondToNextDialog.byDismissing(),
    Click.on(SubjectsPage.contextMenuDelete()),
  ),
};
