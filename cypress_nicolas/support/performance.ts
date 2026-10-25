export const presupuesto = (porDefecto: number): number => Number(Cypress.env('perfBudgetMs')) || porDefecto;

export const medirRenderAlCargar = (win: Window & typeof globalThis, clave: string, selector: string, cantidad: number) => {
  win.addEventListener('DOMContentLoaded', () => {
    const observer = new win.MutationObserver(() => {
      if (win.document.querySelectorAll(selector).length >= cantidad) {
        (win as any)[clave] = win.performance.now();
        observer.disconnect();
      }
    });
    observer.observe(win.document.documentElement, { childList: true, subtree: true });
  });
};

export const clicYMedir = ($el: JQuery<HTMLElement>, clave: string, condicion: (doc: Document) => boolean) => {
  const el = $el[0];
  const win = el.ownerDocument.defaultView as any;
  const inicio = win.performance.now();
  const observer = new win.MutationObserver(() => {
    if (condicion(win.document)) { win[clave] = win.performance.now() - inicio; observer.disconnect(); }
  });
  observer.observe(win.document.documentElement, { childList: true, subtree: true, characterData: true });
  el.click();
  if (win[clave] === undefined && condicion(win.document)) { win[clave] = win.performance.now() - inicio; observer.disconnect(); }
};
