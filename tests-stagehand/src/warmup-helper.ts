import { BACKEND_BASE_URL, FRONTEND_BASE_URL } from './config.js';

/**
 * Realiza un sondeo previo al backend de Render y frontend de Vercel
 * para asegurar que las instancias no se encuentren suspendidas antes de iniciar
 * la suite de pruebas E2E con Stagehand.
 */
export async function warmupDeployment(maxRetries = 10, delayMs = 5000): Promise<void> {
  console.log(`📡 [Warmup] Verificando estado del backend en Render: ${BACKEND_BASE_URL}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${BACKEND_BASE_URL}`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status >= 200 && res.status < 500) {
        console.log(`✅ [Warmup] Backend despierto y respondiendo con HTTP ${res.status} (intento ${attempt}).`);
        break;
      }
    } catch (error) {
      console.log(
        `⏳ [Warmup] Backend en Render iniciando... Intento ${attempt}/${maxRetries} (${(error as Error).message}).`,
      );
    }

    if (attempt === maxRetries) {
      console.warn('⚠️ [Warmup] Se agotaron los intentos de precalentamiento. Continuando con la prueba...');
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Verificación rápida de Vercel
  try {
    const resFront = await fetch(FRONTEND_BASE_URL, { method: 'HEAD' });
    console.log(`✅ [Warmup] Frontend en Vercel respondiendo con HTTP ${resFront.status}.`);
  } catch (error) {
    console.warn(`⚠️ [Warmup] Advertencia al contactar Vercel: ${(error as Error).message}`);
  }
}

// Si se ejecuta directamente desde línea de comandos
if (process.argv[1]?.endsWith('warmup-helper.ts') || process.argv[1]?.endsWith('warmup-helper.js')) {
  warmupDeployment().then(() => process.exit(0));
}
