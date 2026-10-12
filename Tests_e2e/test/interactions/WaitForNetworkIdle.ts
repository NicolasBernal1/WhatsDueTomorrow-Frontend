import { Interaction } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';

export const WaitForNetworkIdle = {
  toSettle: () => Interaction.where(`#actor espera a que la pagina termine de cargar los datos`, async actor => {
    const page = await BrowseTheWebWithPlaywright.as(actor).currentPage();
    const nativePage = await (page as any).nativePage();
    await nativePage.waitForLoadState('networkidle');
  }),
};
