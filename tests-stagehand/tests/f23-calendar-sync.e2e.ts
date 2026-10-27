import 'dotenv/config';
import { z } from 'zod';
import { assertIncludes, assertTrue } from '../src/assert.js';
import { BACKEND_BASE_URL, selectedProvider } from '../src/config.js';
import { authenticateBrowserSession } from '../src/auth-helper.js';
import { captureScreenshot, extractTokensFromMetrics, saveMetricsRecord } from '../src/evidence-helper.js';
import { run } from '../src/run.js';
import { closeTestSession, createTestSession } from '../src/stagehand.js';
import { visualHighlight, visualPause } from '../src/visual-helper.js';

/**
 * ============================================================================
 * PRUEBA E2E STAGEHAND: F23 - Sincronización y Exportación de Calendario .ics
 * ============================================================================
 * Capacidades evaluadas:
 * - act(): Generación de suscripción webcal y copia al portapapeles con IA.
 * - observe(): Detección contextual de la sección y botones de calendario.
 * - extract(): Extracción tipada con Zod de la URL webcal:// y mensaje de confirmación.
 * - Aserciones deterministas: Verificación estricta de protocolo y estándar RFC 5545.
 * - Evidencias: Captura del link generado y métricas de consumo de tokens.
 */
async function main(): Promise<void> {
  const provider = selectedProvider();
  const startTime = Date.now();
  console.log(`\n🚀 [F23] Iniciando prueba de Calendario .ics y Sincronización con proveedor: ${provider}`);

  const session = await createTestSession(provider);

  try {
    // 1. Autenticar y navegar al módulo de horario en Vercel
    const userContext = await authenticateBrowserSession(session, '/schedule');
    await session.page.waitForTimeout(1500);
    await captureScreenshot(session.page, 'F23_CalendarSync', '01_vista_horario');

    // 2. Capacidad observe(): Identificar controles de sincronización en la página
    console.log('🔍 [F23] Ejecutando observe() para localizar controles de sincronización...');
    const observations = await session.stagehand.observe(
      'Encuentra el botón Sync calendar y Download .ics en la sección de sincronización de calendario',
      { page: session.page },
    );
    console.log(`👁️ [F23] Elementos observados: ${observations.data.length}`);
    assertTrue(observations.data.length > 0, 'observe() no localizó los botones de sincronización de calendario.');

    // 3. Capacidad act(): Generar el enlace de suscripción Webcal
    console.log('⚡ [F23] Ejecutando act() para pulsar "Sync calendar"...');
    await visualHighlight(session.page, '.calendar-section button, button:has-text("Sync calendar")', 400);
    await session.stagehand.act('Haz clic en el botón Sync calendar', {
      page: session.page,
    });
    console.log('⏳ [F23] Esperando a que el backend de Render devuelva la URL de suscripción...');
    await session.page.waitForSelector('.subscription-link button', { state: 'visible', timeout: 20000 });
    await visualPause(session.page, 'Enlace de suscripción Webcal generado y visible', 2000);

    // 4. Capacidad act(): Copiar el enlace de suscripción
    console.log('⚡ [F23] Ejecutando act() para pulsar "Copy link"...');
    await visualHighlight(session.page, '.subscription-link button', 400);
    await session.stagehand.act('Haz clic en el botón Copy link para copiar el enlace generado', {
      page: session.page,
    });
    await visualPause(session.page, 'Enlace copiado al portapapeles y mensaje visible en pantalla', 2000);

    // 5. Capacidad extract() con Zod
    console.log('📑 [F23] Ejecutando extract() con esquema Zod para validar el enlace...');
    const calendarSchema = z.object({
      sectionTitle: z.string(),
      subscriptionUrl: z.string(),
      feedbackMessage: z.string().optional(),
    });

    const extracted = await session.stagehand.extract(
      'Extrae el título de la sección de calendario, el valor del campo de texto con el enlace de suscripción y el mensaje informativo',
      calendarSchema,
      { page: session.page },
    );
    console.log('📊 [F23] Datos extraídos con Zod:', extracted.data);

    // 6. Aserciones Deterministas
    assertTrue(
      extracted.data.subscriptionUrl.startsWith('webcal://'),
      `La URL generada debe utilizar el protocolo webcal://. Valor: ${extracted.data.subscriptionUrl}`,
    );

    // Aserción directa sobre el DOM para doble verificación
    const inputVal = await session.page.locator('.subscription-link input').inputValue();
    assertTrue(inputVal.startsWith('webcal://'), 'El input readonly no contiene un enlace webcal:// válido.');

    const feedbackMsg = await session.page.locator('.calendar-message').innerText();
    assertTrue(
      feedbackMsg.includes('Subscription link copied') ||
        feedbackMsg.includes('Your subscription link is ready') ||
        feedbackMsg.includes('Copy the subscription link manually'),
      `El mensaje informativo de calendario no coincide. Recibido: "${feedbackMsg}"`,
    );

    // 7. Validación Determinista de Descarga RFC 5545 contra la API en Render
    console.log('🌐 [F23] Validando contrato RFC 5545 del endpoint de descarga .ics en Render...');
    const icsRes = await fetch(`${BACKEND_BASE_URL}/calendar/download`, {
      headers: { Authorization: `Bearer ${userContext.token}` },
    });
    const icsContent = await icsRes.text();
    assertTrue(icsRes.ok, `El endpoint de descarga .ics respondió con error: ${icsRes.status}`);
    assertIncludes(icsContent, 'BEGIN:VCALENDAR', 'El archivo no contiene la cabecera canónica BEGIN:VCALENDAR.');
    assertIncludes(icsContent, 'VERSION:2.0', 'El archivo no especifica la versión canónica VERSION:2.0.');
    assertIncludes(icsContent, 'END:VCALENDAR', 'El archivo no contiene el cierre canónico END:VCALENDAR.');
    console.log('📅 [F23] Archivo .ics verificado conforme al estándar RFC 5545.');

    // Validar también el feed público generado vía webcal/https
    const feedHttpUrl = extracted.data.subscriptionUrl.replace('webcal://', 'https://');
    console.log(`🌐 [F23] Validando feed público RFC 5545: ${feedHttpUrl}`);
    const feedRes = await fetch(feedHttpUrl);
    const feedContent = await feedRes.text();
    assertTrue(feedRes.ok, `El feed .ics respondió con error: ${feedRes.status}`);
    assertIncludes(feedContent, 'BEGIN:VCALENDAR', 'El feed no contiene BEGIN:VCALENDAR.');
    assertIncludes(feedContent, 'END:VCALENDAR', 'El feed no contiene END:VCALENDAR.');
    console.log('📅 [F23] Feed público .ics verificado conforme al estándar RFC 5545.');

    // 8. Evidencia visual y Métricas
    await captureScreenshot(session.page, 'F23_CalendarSync', '02_enlace_generado_y_copiado');

    const metrics = await session.stagehand.metrics();
    const tokenInfo = extractTokensFromMetrics(metrics);
    console.log('📈 [F23] Métricas de inferencia:', tokenInfo);

    saveMetricsRecord({
      testName: 'F23_CalendarSync',
      provider,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'PASSED',
      totalTokens: tokenInfo.totalTokens,
      promptTokens: tokenInfo.promptTokens,
      completionTokens: tokenInfo.completionTokens,
      inferenceTimeMs: tokenInfo.inferenceTimeMs,
    });

    await visualPause(session.page, 'Prueba F23 completada exitosamente. Inspección final en Chrome', 3000);
    console.log('✅ [F23] Prueba completada con éxito.');
  } catch (error) {
    saveMetricsRecord({
      testName: 'F23_CalendarSync',
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
