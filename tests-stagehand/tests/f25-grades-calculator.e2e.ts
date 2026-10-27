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
 * PRUEBA E2E STAGEHAND: F25 - Calculadora y Simulador de Calificaciones
 * ============================================================================
 * Capacidades evaluadas:
 * - act(): Creación de evaluación ponderada e ingreso en simulador de escenarios.
 * - observe(): Detección del botón de nueva evaluación y panel de métricas.
 * - extract(): Extracción tipada con Zod de promedios ponderados y proyección hipotética.
 * - Aserciones deterministas: Verificación matemática exacta de fórmulas ponderadas.
 * - Evidencias: Captura del panel de métricas y métricas de consumo de tokens.
 */
async function main(): Promise<void> {
  const provider = selectedProvider();
  const startTime = Date.now();
  console.log(`\n🚀 [F25] Iniciando prueba de Calculadora y Simulador de Calificaciones con proveedor: ${provider}`);

  const session = await createTestSession(provider);

  try {
    // 1. Autenticar y asegurar asignatura
    const userContext = await authenticateBrowserSession(session, '/schedule');
    const fixtures = await ensureTestFixtures(userContext);

    // 2. Navegar a la vista de detalle de la asignatura en Vercel
    const subjectUrl = `${FRONTEND_BASE_URL}/subjects/${fixtures.subjectId}`;
    console.log(`📍 [F25] Navegando a calculadora de asignatura: ${subjectUrl}`);
    await session.page.goto(subjectUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('⏳ [F25] Esperando a que cargue la sección de calculadora de calificaciones...');
    await session.page.waitForSelector('.calculator-section button', { state: 'visible', timeout: 20000 });
    await captureScreenshot(session.page, 'F25_GradesCalculator', '01_calculadora_inicial');

    // 3. Capacidad observe(): Identificar el botón para nueva evaluación
    console.log('🔍 [F25] Ejecutando observe() para localizar el botón de nueva evaluación...');
    const observations = await session.stagehand.observe(
      'Encuentra el botón + New Evaluation en la sección de calculadora de calificaciones',
      { page: session.page },
    );
    console.log(`👁️ [F25] Elementos observados: ${observations.data.length}`);
    assertTrue(observations.data.length > 0, 'observe() no localizó el botón de nueva evaluación.');

    // 4. Capacidad act(): Registrar una evaluación ponderada (30% con nota 4.5)
    console.log('⚡ [F25] Abriendo modal de evaluación con act()...');
    await visualHighlight(session.page, '.calculator-section button', 400);
    await session.stagehand.act('Click the "+ New Evaluation" button in the Grade calculator section', {
      page: session.page,
    });
    const isModalOpen = await session.page.evaluate(() => !!document.querySelector('app-evaluation-modal'));
    if (!isModalOpen) {
      await session.page.evaluate(() => {
        const btn = document.querySelector('.calculator-section button') as HTMLButtonElement | null;
        btn?.click();
      });
    }
    await session.page.waitForFunction(() => !!document.querySelector('app-evaluation-modal'), { timeout: 15000 });
    await visualPause(session.page, 'Modal de evaluación ponderada abierto', 1500);

    console.log('📝 [F25] Diligenciando formulario de la evaluación ponderada con visualType...');
    await visualType(session.page, 'app-evaluation-modal input[formControlName="name"]', 'Primer Examen Parcial', { delayMs: 25 });
    await visualType(session.page, 'app-evaluation-modal input[formControlName="weight"]', '30', { delayMs: 30 });
    await visualType(session.page, 'app-evaluation-modal input[formControlName="score"]', '4.5', { delayMs: 30 });
    await visualPause(session.page, 'Campos de evaluación ingresados', 1000);

    console.log('💾 [F25] Guardando evaluación...');
    await visualHighlight(session.page, 'app-evaluation-modal button[type="submit"]', 400);
    await session.page.evaluate(() => {
      const saveBtn = document.querySelector('app-evaluation-modal button[type="submit"]') as HTMLButtonElement;
      saveBtn?.click();
    });
    await session.page.waitForFunction(() => !!document.querySelector('.simulator-card'), { timeout: 20000 });
    await visualPause(session.page, 'Evaluación registrada y panel de métricas cargado', 2000);

    // 5. Capacidad extract() con Zod para el panel de métricas ponderadas
    console.log('📑 [F25] Extrayendo métricas calculadas con esquema Zod...');
    const metricsSchema = z.object({
      currentAverage: z.string(),
      accumulatedPoints: z.string(),
      evaluatedWeight: z.string(),
      statusText: z.string(),
    });

    const extractedMetrics = await session.stagehand.extract(
      'Extrae el promedio ponderado actual (Current Weighted Average), los puntos acumulados (Accumulated Points), el peso evaluado (Evaluated Weight) y el estado académico',
      metricsSchema,
      { page: session.page },
    );
    console.log('📊 [F25] Métricas ponderadas extraídas:', extractedMetrics.data);

    // 6. Aserciones Deterministas Matemáticas (Nota 4.5 al 30%)
    // Promedio ponderado actual: 4.50
    assertIncludes(extractedMetrics.data.currentAverage, '4.50', 'El promedio ponderado debe ser 4.50.');
    // Puntos acumulados: 4.5 * 0.30 = 1.35
    assertIncludes(extractedMetrics.data.accumulatedPoints, '1.35', 'Los puntos acumulados deben ser exactamente 1.35.');
    // Peso evaluado: 30.00%
    assertIncludes(extractedMetrics.data.evaluatedWeight, '30', 'El peso evaluado debe ser 30%.');
    // Estado académico: Aprobando / Passing
    assertTrue(
      extractedMetrics.data.statusText.includes('Passing') ||
        extractedMetrics.data.statusText.includes('Aprobando'),
      `El estado académico debe indicar Aprobando o Passing. Recibido: ${extractedMetrics.data.statusText}`,
    );

    // 7. Interacción con el Simulador de Escenarios Hipotéticos
    console.log('⚡ [F25] Ingresando nota hipotética 4.0 en el simulador con visualType...');
    await visualType(session.page, '#hypotheticalInput', '4.0', { delayMs: 50 });
    await session.page.waitForFunction(() => !!document.querySelector('.sim-feedback strong'), { timeout: 10000 });
    await visualPause(session.page, 'Simulación en vivo: promedio estimado recalculado a 4.15', 2500);

    // 8. Capacidad extract() para la nota final proyectada
    console.log('📑 [F25] Extrayendo proyección del simulador con Zod...');
    const simulationSchema = z.object({
      estimatedFinalGrade: z.string(),
      simulatedStatus: z.string().optional(),
    });

    const extractedSim = await session.stagehand.extract(
      'Extrae la nota final estimada calculada por el simulador de escenarios hipotéticos',
      simulationSchema,
      { page: session.page },
    );
    console.log('📊 [F25] Proyección extraída del simulador:', extractedSim.data);

    // 9. Aserción Matemática Determinista de Simulación:
    // Puntos actuales = 1.35. Restante = 70%. Hipotético = 4.0. Total = 1.35 + (4.0 * 0.70) = 4.15
    assertIncludes(
      extractedSim.data.estimatedFinalGrade,
      '4.15',
      'La proyección del simulador debe ser matemáticamente exacta: 4.15.',
    );

    // 10. Evidencia visual y Métricas
    await captureScreenshot(session.page, 'F25_GradesCalculator', '02_metricas_y_simulador_calculados');

    const metrics = await session.stagehand.metrics();
    const tokenInfo = extractTokensFromMetrics(metrics);
    console.log('📈 [F25] Métricas de inferencia:', tokenInfo);

    saveMetricsRecord({
      testName: 'F25_GradesCalculator',
      provider,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'PASSED',
      totalTokens: tokenInfo.totalTokens,
      promptTokens: tokenInfo.promptTokens,
      completionTokens: tokenInfo.completionTokens,
      inferenceTimeMs: tokenInfo.inferenceTimeMs,
    });

    await visualPause(session.page, 'Prueba F25 completada exitosamente. Inspección final en Chrome', 3000);
    console.log('✅ [F25] Prueba completada con éxito.');
  } catch (error) {
    saveMetricsRecord({
      testName: 'F25_GradesCalculator',
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
