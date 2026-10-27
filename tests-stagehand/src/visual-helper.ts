import type { Page } from '@browserbasehq/stagehand';

export interface VisualTypeOptions {
  delayMs?: number;
  highlightColor?: string;
}

/**
 * Realiza la escritura visual perceptible campo a campo en el navegador Chrome,
 * permitiendo al desarrollador observar en tiempo real la entrada de cada dato.
 */
export async function visualType(
  page: Page,
  selector: string,
  text: string,
  options: VisualTypeOptions = {},
): Promise<void> {
  const delay = options.delayMs ?? 35;
  const highlightColor = options.highlightColor ?? '#2563eb';

  // 1. Desplazar hacia el campo y aplicar foco y borde visual perceptible
  await page.evaluate(
    ({ sel, color }) => {
      try {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
          el.style.outline = `2px solid ${color}`;
          el.style.boxShadow = `0 0 8px ${color}66`;
          el.style.transition = 'all 0.2s ease-in-out';
        }
      } catch {
        // Selector no estándar o elemento ausente temporalmente
      }
    },
    { sel: selector, color: highlightColor },
  );
  await page.waitForTimeout(150);

  // 2. Escritura progresiva caracter por caracter con disparo de eventos Angular
  for (let i = 1; i <= text.length; i++) {
    const partialText = text.slice(0, i);
    await page.evaluate(
      ({ sel, val }) => {
        try {
          const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
          if (el) {
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } catch {}
      },
      { sel: selector, val: partialText },
    );
    if (delay > 0) {
      await page.waitForTimeout(delay);
    }
  }

  // 3. Confirmar evento de cambio (change/blur) y retirar el borde resaltado
  await page.evaluate((sel) => {
    try {
      const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.style.outline = '';
        el.style.boxShadow = '';
      }
    } catch {}
  }, selector);
  await page.waitForTimeout(200);
}

/**
 * Pausa visual descriptiva para permitir al desarrollador observar el estado
 * actual de la interfaz de usuario en la ventana abierta de Chrome.
 */
export async function visualPause(page: Page, message: string, durationMs = 2500): Promise<void> {
  console.log(`👀 [Visual] ${message} (${durationMs}ms)...`);
  await page.waitForTimeout(durationMs);
}

/**
 * Resalta visualmente un elemento antes de hacer clic en él para guiar
 * la vista del desarrollador sobre la acción ejecutada.
 */
export async function visualHighlight(
  page: Page,
  selector: string,
  durationMs = 400,
): Promise<void> {
  await page.evaluate(
    ({ sel, duration }) => {
      try {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const prevTransition = el.style.transition;
          const prevTransform = el.style.transform;
          el.style.transition = 'transform 0.2s ease, outline 0.2s ease';
          el.style.outline = '3px solid #10b981';
          el.style.transform = 'scale(1.03)';
          setTimeout(() => {
            el.style.outline = '';
            el.style.transform = prevTransform;
            el.style.transition = prevTransition;
          }, duration);
        }
      } catch {}
    },
    { sel: selector, duration: durationMs },
  );
  await page.waitForTimeout(durationMs);
}
