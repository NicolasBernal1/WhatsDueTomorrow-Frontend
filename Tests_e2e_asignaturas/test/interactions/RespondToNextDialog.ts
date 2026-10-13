import { Interaction } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';

let lastMessage: string | undefined;

/** Mensaje del ultimo dialogo (confirm/alert) del navegador respondido por el actor. */
export const lastDialogMessage = () => lastMessage;

/**
 * Deja listo el manejo del proximo dialogo nativo del navegador (confirm/alert):
 * lo acepta o lo cancela y guarda su mensaje. Debe ejecutarse ANTES del clic que lo provoca.
 */
export const RespondToNextDialog = {
  byAccepting: () => respond('acepta', true),
  byDismissing: () => respond('cancela', false),
};

function respond(verb: string, accept: boolean) {
  return Interaction.where(`#actor ${ verb } el proximo dialogo del navegador`, async actor => {
    const page = await BrowseTheWebWithPlaywright.as(actor).currentPage();
    const native = await (page as any).nativePage();

    lastMessage = undefined;
    native.removeAllListeners('dialog');
    native.once('dialog', async (dialog: any) => {
      lastMessage = dialog.message();
      await (accept ? dialog.accept() : dialog.dismiss());
    });
  });
}
