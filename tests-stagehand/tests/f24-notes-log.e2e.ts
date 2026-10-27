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
 * PRUEBA E2E STAGEHAND: F24 - Bitácora de Apuntes y Recursos Rápidos
 * ============================================================================
 * Capacidades evaluadas:
 * - act(): Apertura de modal, diligenciamiento de título, contenido y enlace con IA.
 * - observe(): Localización de la sección de bitácora y tarjeta del nuevo apunte.
 * - extract(): Extracción tipada con Zod del apunte y enlace externo.
 * - Aserciones deterministas: Verificación de título y atributos de seguridad rel/target.
 * - Evidencias: Captura de pantalla del apunte en la bitácora y métricas LLM.
 */
async function main(): Promise<void> {
  const provider = selectedProvider();
  const startTime = Date.now();
  console.log(`\n🚀 [F24] Iniciando prueba de Bitácora de Apuntes con proveedor: ${provider}`);

  const session = await createTestSession(provider);

  try {
    // 1. Autenticar y asegurar asignatura
    const userContext = await authenticateBrowserSession(session, '/schedule');
    const fixtures = await ensureTestFixtures(userContext);

    // 2. Navegar a la vista de detalle de la asignatura en Vercel
    const subjectUrl = `${FRONTEND_BASE_URL}/subjects/${fixtures.subjectId}`;
    console.log(`📍 [F24] Navegando a detalle de asignatura: ${subjectUrl}`);
    await session.page.goto(subjectUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await session.page.waitForTimeout(2000);
    await captureScreenshot(session.page, 'F24_NotesLog', '01_vista_asignatura');

    // 3. Capacidad observe(): Identificar el botón para crear un nuevo apunte
    console.log('🔍 [F24] Ejecutando observe() para localizar el botón de nuevo apunte...');
    const observations = await session.stagehand.observe(
      'Encuentra el botón + New Note de la sección de bitácora de apuntes',
      { page: session.page },
    );
    console.log(`👁️ [F24] Elementos observados: ${observations.data.length}`);
    assertTrue(observations.data.length > 0, 'observe() no localizó el botón de nuevo apunte.');

    // 4. Capacidad act(): Abrir el modal y registrar el apunte
    console.log('⚡ [F24] Abriendo modal de nuevo apunte con act()...');
    await visualHighlight(session.page, '.notes-section button', 400);
    await session.stagehand.act('Click the + New Note button', {
      page: session.page,
    });
    await session.page.waitForSelector('mat-card.modal', { state: 'visible', timeout: 15000 });
    await visualPause(session.page, 'Modal de nuevo apunte abierto en pantalla', 1500);

    console.log('📝 [F24] Diligenciando formulario del apunte con visualType...');
    await visualType(session.page, 'input[formControlName="title"]', 'Fórmulas de Gradiente y Rotacional', { delayMs: 25 });
    await visualType(
      session.page,
      'textarea[formControlName="content"]',
      'El gradiente apunta a la dirección de máxima tasa de cambio',
      { delayMs: 20 },
    );
    await visualType(session.page, 'input[formControlName="linkUrl"]', 'https://ocw.mit.edu/gradient-notes', { delayMs: 20 });
    await visualPause(session.page, 'Datos del apunte diligenciados con éxito', 1000);

    console.log('💾 [F24] Guardando apunte...');
    await visualHighlight(session.page, 'mat-card.modal button[type="submit"]', 400);
    await session.page.locator('mat-card.modal button[type="submit"]').click();
    await session.page.waitForSelector('.note-card', { state: 'visible', timeout: 15000 });
    await visualPause(session.page, 'Nuevo apunte renderizado en la bitácora', 2000);

    // 5. Capacidad observe(): Localizar la tarjeta recién creada en la lista
    console.log('🔍 [F24] Ejecutando observe() para confirmar la tarjeta en la bitácora...');
    const noteCardObs = await session.stagehand.observe(
      'Localiza la tarjeta de apunte con el título de fórmulas en la sección de bitácora',
      { page: session.page },
    );
    assertTrue(noteCardObs.data.length > 0, 'observe() no detectó la tarjeta de apunte creada.');

    // 6. Capacidad extract() con Zod
    console.log('📑 [F24] Extrayendo datos del apunte con esquema Zod...');
    const noteSchema = z.object({
      sectionTitle: z.string(),
      noteTitle: z.string(),
      noteContent: z.string(),
      linkUrl: z.string().optional(),
    });

    const extracted = await session.stagehand.extract(
      'Extrae el título de la sección de bitácora, el título de la tarjeta del apunte, su contenido y el enlace externo',
      noteSchema,
      { page: session.page },
    );
    console.log('📊 [F24] Datos extraídos con Zod:', extracted.data);

    // 7. Aserciones Deterministas
    assertEquals(
      extracted.data.noteTitle,
      'Fórmulas de Gradiente y Rotacional',
      'El título del apunte en la bitácora no coincide con el registrado.',
    );
    assertIncludes(
      extracted.data.noteContent,
      'máxima tasa de cambio',
      'El contenido del apunte no contiene el texto registrado.',
    );

    // Verificación estricta de seguridad en el DOM: anti-tabnabbing en enlace externo
    const linkAttrs = await session.page.evaluate(() => {
      const link = document.querySelector('.note-card .note-link') as HTMLAnchorElement | null;
      return {
        target: link?.getAttribute('target') ?? '',
        rel: link?.getAttribute('rel') ?? '',
      };
    });
    assertEquals(linkAttrs.target, '_blank', 'El enlace externo debe abrir en una pestaña nueva (target="_blank").');
    assertIncludes(linkAttrs.rel, 'noopener', 'El enlace debe incluir noopener por seguridad anti-tabnabbing.');
    assertIncludes(linkAttrs.rel, 'noreferrer', 'El enlace debe incluir noreferrer.');

    // 8. Evidencia visual y Métricas
    await captureScreenshot(session.page, 'F24_NotesLog', '02_apunte_creado_en_bitacora');

    const metrics = await session.stagehand.metrics();
    const tokenInfo = extractTokensFromMetrics(metrics);
    console.log('📈 [F24] Métricas de inferencia:', tokenInfo);

    saveMetricsRecord({
      testName: 'F24_NotesLog',
      provider,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'PASSED',
      totalTokens: tokenInfo.totalTokens,
      promptTokens: tokenInfo.promptTokens,
      completionTokens: tokenInfo.completionTokens,
      inferenceTimeMs: tokenInfo.inferenceTimeMs,
    });

    await visualPause(session.page, 'Prueba F24 completada exitosamente. Inspección final en Chrome', 3000);
    console.log('✅ [F24] Prueba completada con éxito.');
  } catch (error) {
    saveMetricsRecord({
      testName: 'F24_NotesLog',
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
