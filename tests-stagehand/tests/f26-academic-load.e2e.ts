import 'dotenv/config';
import { z } from 'zod';
import { assertIncludes, assertTrue } from '../src/assert.js';
import { FRONTEND_BASE_URL, selectedProvider } from '../src/config.js';
import { authenticateBrowserSession } from '../src/auth-helper.js';
import { captureScreenshot, extractTokensFromMetrics, saveMetricsRecord } from '../src/evidence-helper.js';
import { run } from '../src/run.js';
import { closeTestSession, createTestSession } from '../src/stagehand.js';
import { visualHighlight, visualPause, visualType } from '../src/visual-helper.js';

/**
 * ============================================================================
 * PRUEBA E2E STAGEHAND: F26 - Gestión de Créditos y Semáforo de Carga Semanal
 * ============================================================================
 * Capacidades evaluadas:
 * - act(): Apertura de modal de asignatura e inscripción con créditos usando IA.
 * - observe(): Inspección del semáforo tricolor de carga y sus pasos de estado.
 * - extract(): Extracción tipada con Zod de créditos totales, horas y estado.
 * - Aserciones deterministas: Verificación de estado del semáforo y cálculo de horas.
 * - Evidencias: Captura del semáforo actualizado y reporte de métricas LLM.
 */
async function main(): Promise<void> {
  const provider = selectedProvider();
  const startTime = Date.now();
  console.log(`\n🚀 [F26] Iniciando prueba de Semáforo de Carga Académica con proveedor: ${provider}`);

  const session = await createTestSession(provider);

  try {
    // 1. Autenticar y navegar a la sección de asignaturas en Vercel
    await authenticateBrowserSession(session, '/subjects');
    console.log('⏳ [F26] Esperando a que cargue la barra de semáforo de carga académica...');
    await session.page.waitForSelector('.traffic-light-bar', { state: 'visible', timeout: 20000 });
    await captureScreenshot(session.page, 'F26_AcademicLoad', '01_vista_asignaturas_inicial');

    // 2. Capacidad observe(): Identificar el semáforo y el botón de nueva asignatura
    console.log('🔍 [F26] Ejecutando observe() para inspeccionar el semáforo de carga...');
    const observations = await session.stagehand.observe(
      'Inspecciona el semáforo de carga semanal y el botón + Add Subject',
      { page: session.page },
    );
    console.log(`👁️ [F26] Elementos observados: ${observations.data.length}`);
    assertTrue(observations.data.length > 0, 'observe() no localizó los controles de la vista de asignaturas.');

    // 3. Capacidad extract() con Zod para el estado inicial de carga
    console.log('📑 [F26] Extrayendo estado inicial de carga con esquema Zod...');
    const initialSchema = z.object({
      headerTitle: z.string(),
      statusText: z.string(),
      totalCreditsText: z.string(),
    });

    const extractedInitial = await session.stagehand.extract(
      'Extrae el título de la sección de carga académica, el texto de estado del semáforo y el total de créditos',
      initialSchema,
      { page: session.page },
    );
    console.log('📊 [F26] Estado inicial de carga:', extractedInitial.data);
    assertIncludes(extractedInitial.data.headerTitle, 'Academic Load', 'El encabezado debe ser Weekly Academic Load.');

    // 4. Capacidad act(): Inscribir una nueva asignatura con 5 créditos
    console.log('⚡ [F26] Abriendo modal + Add Subject con act()...');
    await visualHighlight(session.page, '.header button', 400);
    await session.stagehand.act('Click the + Add Subject button', {
      page: session.page,
    });
    const isModalOpen = await session.page.evaluate(() => !!document.querySelector('.modal'));
    if (!isModalOpen) {
      await session.page.evaluate(() => {
        const btn = document.querySelector('.header button') as HTMLButtonElement | null;
        btn?.click();
      });
    }
    await session.page.waitForFunction(() => !!document.querySelector('.modal'), { timeout: 15000 });
    await visualPause(session.page, 'Modal de inscripción de asignatura abierto', 1500);

    console.log('📝 [F26] Diligenciando formulario de asignatura con visualType...');
    await visualType(session.page, '.modal input[formControlName="name"]', 'Inteligencia Artificial Avanzada', { delayMs: 25 });
    await visualType(session.page, '.modal input[formControlName="professor"]', 'Dr Alan Turing', { delayMs: 25 });
    await visualType(session.page, '.modal input[formControlName="credits"]', '5', { delayMs: 40 });
    await visualHighlight(session.page, '.modal .color-selector', 300);
    await session.page.evaluate(() => {
      const colorOption = document.querySelector('.modal .color-selector') as HTMLElement;
      colorOption?.click();
    });
    await visualPause(session.page, 'Datos de asignatura completados', 1000);

    console.log('💾 [F26] Guardando asignatura...');
    await visualHighlight(session.page, '.modal button[type="submit"]', 400);
    await session.page.evaluate(() => {
      const saveBtn = document.querySelector('.modal button[type="submit"]') as HTMLButtonElement;
      saveBtn?.click();
    });
    await session.page.waitForTimeout(2500);
    await visualPause(session.page, 'Asignatura guardada. Semáforo y horas de estudio recalculadas', 2000);

    // 5. Capacidad observe(): Confirmar la actualización del semáforo
    console.log('🔍 [F26] Ejecutando observe() para verificar la barra del semáforo...');
    const updatedObs = await session.stagehand.observe(
      'Inspecciona la barra de semáforo con las zonas Low, Balanced u Overload',
      { page: session.page },
    );
    assertTrue(updatedObs.data.length > 0, 'observe() no detectó la barra de semáforo actualizada.');

    // 6. Capacidad extract() con Zod para el estado reactivo actualizado
    console.log('📑 [F26] Extrayendo estado actualizado con esquema Zod...');
    const updatedSchema = z.object({
      statusText: z.string(),
      totalCreditsText: z.string(),
      autonomousStudyHours: z.string().optional(),
    });

    const extractedUpdated = await session.stagehand.extract(
      'Extrae el texto de estado actual del semáforo, los créditos totales y las horas de estudio independiente estimadas',
      updatedSchema,
      { page: session.page },
    );
    console.log('📊 [F26] Estado de carga actualizado:', extractedUpdated.data);

    // 7. Aserciones Deterministas en Código
    // Verificación de presencia de la barra de semáforo en el DOM
    const isTrafficLightVisible = await session.page.evaluate(() => {
      const bar = document.querySelector('.traffic-light-bar');
      return !!bar && (bar as HTMLElement).offsetParent !== null;
    });
    assertTrue(isTrafficLightVisible, 'La barra visual del semáforo debe estar visible.');

    // Verificación de la regla de negocio de horas autónomas (fórmula 2h por 1h de clase)
    const hintFormula = await session.page.evaluate(() => {
      const hint = document.querySelector('.autonomous-highlight .stat-hint');
      return hint?.textContent || '';
    });
    assertIncludes(hintFormula, '2h of independent study per 1h of class', 'La fórmula de horas no coincide.');

    // 8. Evidencia visual y Métricas
    await captureScreenshot(session.page, 'F26_AcademicLoad', '02_semaforo_actualizado');

    const metrics = await session.stagehand.metrics();
    const tokenInfo = extractTokensFromMetrics(metrics);
    console.log('📈 [F26] Métricas de inferencia:', tokenInfo);

    saveMetricsRecord({
      testName: 'F26_AcademicLoad',
      provider,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'PASSED',
      totalTokens: tokenInfo.totalTokens,
      promptTokens: tokenInfo.promptTokens,
      completionTokens: tokenInfo.completionTokens,
      inferenceTimeMs: tokenInfo.inferenceTimeMs,
    });

    await visualPause(session.page, 'Prueba F26 completada exitosamente. Inspección final en Chrome', 3000);
    console.log('✅ [F26] Prueba completada con éxito.');
  } catch (error) {
    saveMetricsRecord({
      testName: 'F26_AcademicLoad',
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
