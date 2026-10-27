import 'dotenv/config';
import { z } from 'zod';
import { assertEquals, assertIncludes, assertTrue } from '../src/assert.js';
import { FRONTEND_BASE_URL, selectedProvider } from '../src/config.js';
import { authenticateBrowserSession } from '../src/auth-helper.js';
import { ensureTestFixtures } from '../src/fixture-helper.js';
import { captureScreenshot, extractTokensFromMetrics, saveMetricsRecord } from '../src/evidence-helper.js';
import { run } from '../src/run.js';
import { closeTestSession, createTestSession } from '../src/stagehand.js';
import { visualHighlight, visualPause, visualType } from '../src/visual-helper.js';

/**
 * ============================================================================
 * PRUEBA E2E STAGEHAND: F22 - Desglose de Tareas en Subtareas y Avance Porcentual
 * ============================================================================
 * Capacidades evaluadas:
 * - act(): Creación de subtareas e interacción con checkboxes mediante IA.
 * - observe(): Inspección del campo de ingreso y la lista de subtareas.
 * - extract(): Extracción tipada con Zod del avance porcentual (0% -> 50% -> 100%).
 * - Aserciones deterministas: Verificación estricta de porcentajes y mensaje de completitud.
 * - Evidencias: Captura de avance 100% y registro de métricas de tokens.
 */
async function main(): Promise<void> {
  const provider = selectedProvider();
  const startTime = Date.now();
  console.log(`\n🚀 [F22] Iniciando prueba de Subtareas y Avance Porcentual con proveedor: ${provider}`);

  const session = await createTestSession(provider);

  try {
    // 1. Autenticar y asegurar fixtures (asignatura y entrega)
    const userContext = await authenticateBrowserSession(session, '/schedule');
    const fixtures = await ensureTestFixtures(userContext);

    // 2. Navegar al detalle de la entrega en Vercel
    const assignmentUrl = `/assignments/${fixtures.assignmentId}`;
    console.log(`📍 [F22] Navegando al detalle de la entrega: ${FRONTEND_BASE_URL}${assignmentUrl}`);
    await session.page.goto(`${FRONTEND_BASE_URL}${assignmentUrl}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log('⏳ [F22] Esperando a que el detalle de la entrega y el formulario de subtareas carguen...');
    await session.page.waitForSelector('.new-subtask input', { state: 'visible', timeout: 20000 });
    await captureScreenshot(session.page, 'F22_Subtasks', '01_detalle_inicial');

    // 3. Capacidad observe(): Identificar el control de nueva subtarea
    console.log('🔍 [F22] Ejecutando observe() para localizar controles de subtarea...');
    const observations = await session.stagehand.observe(
      'Encuentra el campo de texto para agregar una subtarea y el botón Add',
      { page: session.page },
    );
    console.log(`👁️ [F22] Elementos observados: ${observations.data.length}`);
    assertTrue(observations.data.length > 0, 'observe() no localizó los controles de ingreso de subtarea.');

    // 4. Capacidad act(): Agregar dos subtareas secuencialmente
    console.log('⚡ [F22] Agregando subtarea 1 con visualType y act()...');
    await visualType(session.page, '.new-subtask input', 'Definir alcance del proyecto', { delayMs: 25 });
    await visualHighlight(session.page, '.new-subtask button', 300);
    await session.stagehand.act('Click the Add button', {
      page: session.page,
    });
    await session.page.waitForSelector('.subtask-item', { state: 'visible', timeout: 15000 });
    await visualPause(session.page, 'Subtarea 1 agregada a la lista', 1500);

    console.log('⚡ [F22] Agregando subtarea 2 con visualType y act()...');
    await visualType(session.page, '.new-subtask input', 'Implementar arquitectura', { delayMs: 25 });
    await visualHighlight(session.page, '.new-subtask button', 300);
    await session.stagehand.act('Click the Add button', {
      page: session.page,
    });
    await session.page.waitForTimeout(1500);
    await visualPause(session.page, 'Subtarea 2 agregada a la lista', 1500);

    // 5. Capacidad act(): Completar la primera subtarea (Avance esperado: 50%)
    console.log('⚡ [F22] Marcando la primera subtarea como completada...');
    await session.stagehand.act('Click the checkbox to complete Definir alcance del proyecto', {
      page: session.page,
    });
    await session.page.waitForTimeout(1500);
    await visualPause(session.page, 'Subtarea 1 completada. Observando avance al 50%', 2000);

    // 6. Capacidad extract() con Zod para el progreso al 50%
    const progressSchema = z.object({
      progressLabel: z.string(),
      progressPercentage: z.string(),
    });

    console.log('📑 [F22] Extrayendo avance porcentual con Zod tras paso 1...');
    const extractedStep1 = await session.stagehand.extract(
      'Extrae el texto de la etiqueta de progreso y el porcentaje actual del indicador de avance',
      progressSchema,
      { page: session.page },
    );
    console.log('📊 [F22] Progreso extraído (Paso 1):', extractedStep1.data);
    assertIncludes(extractedStep1.data.progressPercentage, '50%', 'El avance intermedio debe ser exactamente 50%.');

    // 7. Capacidad act(): Completar la segunda subtarea (Avance esperado: 100%)
    console.log('⚡ [F22] Marcando la segunda subtarea como completada...');
    await session.stagehand.act('Click the checkbox to complete Implementar arquitectura', {
      page: session.page,
    });
    await session.page.waitForTimeout(1500);
    await visualPause(session.page, 'Subtarea 2 completada. Observando avance al 100% y felicitación', 2000);

    // 8. Capacidad extract() con Zod para el progreso al 100% y mensaje de felicitación
    const completeSchema = z.object({
      progressPercentage: z.string(),
      completionTip: z.string().optional(),
    });

    const extractedStep2 = await session.stagehand.extract(
      'Extrae el porcentaje final de avance y el mensaje de felicitación o completitud de los pasos',
      completeSchema,
      { page: session.page },
    );
    console.log('📊 [F22] Progreso extraído (Paso 2):', extractedStep2.data);
    assertIncludes(extractedStep2.data.progressPercentage, '100%', 'El avance final debe ser exactamente 100%.');

    // 9. Aserción Determinista Directa sobre el DOM
    const rawProgress = await session.page.locator('.progress-label strong').innerText();
    assertEquals(rawProgress.trim(), '100%', 'Verificación DOM directa de progreso al 100% fallida.');

    const completionMsg = await session.page.locator('.completion-tip').innerText();
    assertIncludes(
      completionMsg,
      'You completed all the steps. You can now mark the assignment as completed.',
      'El mensaje de recomendación de entrega completada no coincide.',
    );

    // 10. Evidencia visual de avance 100%
    await captureScreenshot(session.page, 'F22_Subtasks', '02_progreso_100_completitud');

    // 11. Métricas de inferencia
    const metrics = await session.stagehand.metrics();
    const tokenInfo = extractTokensFromMetrics(metrics);
    console.log('📈 [F22] Métricas de inferencia:', tokenInfo);

    saveMetricsRecord({
      testName: 'F22_SubtasksProgress',
      provider,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'PASSED',
      totalTokens: tokenInfo.totalTokens,
      promptTokens: tokenInfo.promptTokens,
      completionTokens: tokenInfo.completionTokens,
      inferenceTimeMs: tokenInfo.inferenceTimeMs,
    });

    await visualPause(session.page, 'Prueba F22 completada exitosamente. Inspección final en Chrome', 3000);
    console.log('✅ [F22] Prueba completada con éxito.');
  } catch (error) {
    saveMetricsRecord({
      testName: 'F22_SubtasksProgress',
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
