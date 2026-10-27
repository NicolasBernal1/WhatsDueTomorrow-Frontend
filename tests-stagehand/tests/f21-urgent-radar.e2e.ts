import 'dotenv/config';
import { z } from 'zod';
import { assertIncludes, assertTrue } from '../src/assert.js';
import { selectedProvider } from '../src/config.js';
import { authenticateBrowserSession } from '../src/auth-helper.js';
import { captureScreenshot, extractTokensFromMetrics, saveMetricsRecord } from '../src/evidence-helper.js';
import { run } from '../src/run.js';
import { closeTestSession, createTestSession } from '../src/stagehand.js';
import { visualHighlight, visualPause } from '../src/visual-helper.js';

/**
 * ============================================================================
 * PRUEBA E2E STAGEHAND: F21 - Alertas y Radar de Entregas Urgentes
 * ============================================================================
 * Capacidades evaluadas:
 * - act(): Clic asistido por IA sobre el botón de habilitación de alertas.
 * - observe(): Inspección previa de elementos interactivos del radar.
 * - extract(): Extracción estructurada y validación con Zod del estado del radar.
 * - Aserciones deterministas: Verificación estricta de títulos y mensajes.
 * - Evidencias: Capturas de pantalla y reporte de métricas de tokens/latencia.
 */
async function main(): Promise<void> {
  const provider = selectedProvider();
  const startTime = Date.now();
  console.log(`\n🚀 [F21] Iniciando prueba de Radar de Entregas Urgentes con proveedor: ${provider}`);

  const session = await createTestSession(provider);

  try {
    // 1. Autenticar y navegar al radar desplegado en Vercel
    await authenticateBrowserSession(session, '/urgent-radar');
    await visualPause(session.page, 'Visualizando vista inicial del radar de entregas urgentes', 1500);
    await captureScreenshot(session.page, 'F21_UrgentRadar', '01_vista_inicial');

    // 2. Capacidad observe(): Identificar controles interactivos antes de actuar
    console.log('🔍 [F21] Ejecutando observe() para inspeccionar el radar...');
    const observations = await session.stagehand.observe(
      'Encuentra el botón para activar alertas web o las secciones de entregas urgentes',
      { page: session.page },
    );
    console.log(`👁️ [F21] Elementos observados: ${observations.data.length}`);
    assertTrue(observations.data.length > 0, 'observe() no identificó elementos interactivos en el radar.');

    // 3. Capacidad act(): Interactuar con el botón mediante lenguaje natural
    console.log('⚡ [F21] Ejecutando act() para activar alertas web...');
    await visualHighlight(session.page, '.radar-actions button', 400);
    await session.stagehand.act('Haz clic en el botón Enable web alerts', {
      page: session.page,
    });
    await visualPause(session.page, 'Observando activación de alertas web y feedback en pantalla', 2000);

    // 4. Capacidad extract(): Extraer datos estructurados validados con Zod
    console.log('📑 [F21] Ejecutando extract() con esquema Zod...');
    const radarSchema = z.object({
      radarTitle: z.string(),
      description: z.string(),
      notificationMessage: z.string().optional(),
    });

    const extracted = await session.stagehand.extract(
      'Extrae el título principal de la vista del radar, el subtítulo o descripción y el mensaje de notificación si existe',
      radarSchema,
      { page: session.page },
    );
    console.log('📊 [F21] Datos extraídos con Zod:', extracted.data);

    // 5. Aserciones Deterministas en Código
    assertIncludes(
      extracted.data.radarTitle,
      'Urgent assignments radar',
      'El título extraído no corresponde al radar de entregas urgentes.',
    );
    assertIncludes(
      extracted.data.description,
      '24 hours',
      'La descripción debe confirmar el rango de atención de 24 horas.',
    );

    // Verificación directa en el DOM para doble garantía determinista
    const headerTitle = await session.page.locator('#radar-title').innerText();
    assertIncludes(headerTitle, 'Urgent assignments radar', 'Verificación DOM directa fallida.');

    // 6. Captura de evidencia visual final
    await captureScreenshot(session.page, 'F21_UrgentRadar', '02_alertas_activadas');

    // 7. Registro de Métricas del Modelo de IA
    const metrics = await session.stagehand.metrics();
    const tokenInfo = extractTokensFromMetrics(metrics);
    console.log('📈 [F21] Métricas de inferencia:', tokenInfo);

    saveMetricsRecord({
      testName: 'F21_UrgentRadar',
      provider,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'PASSED',
      totalTokens: tokenInfo.totalTokens,
      promptTokens: tokenInfo.promptTokens,
      completionTokens: tokenInfo.completionTokens,
      inferenceTimeMs: tokenInfo.inferenceTimeMs,
    });

    await visualPause(session.page, 'Prueba F21 completada exitosamente. Inspección final en Chrome', 3000);
    console.log('✅ [F21] Prueba completada con éxito.');
  } catch (error) {
    saveMetricsRecord({
      testName: 'F21_UrgentRadar',
      provider,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'FAILED',
      error: (error as Error).message,
    });
    throw error;
  } finally {
    await closeTestSession(session);
  }
}

run(main);
