import { Interaction } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';

/** Clic derecho real (evento contextmenu) sobre un elemento localizado con XPath. */
export const ContextClick = {
  onXPath: (description: string, xpath: string) =>
    Interaction.where(`#actor hace clic derecho sobre ${ description }`, async actor => {
      const page = await BrowseTheWebWithPlaywright.as(actor).currentPage();
      const native = await (page as any).nativePage();
      await native.locator(`xpath=${ xpath }`).first().click({ button: 'right' });
    }),
};
