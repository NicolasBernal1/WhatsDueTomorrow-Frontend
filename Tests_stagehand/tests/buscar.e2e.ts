import 'dotenv/config';
import { APP_URL, createAccount, createSubjectApi, loginWithAi, withSession } from '../src/app.js';
import { assertIncludes } from '../src/assert.js';
import { run } from '../src/run.js';

/**
 * Búsqueda: con "Ciencias" e "Historia" creadas, buscar "Ciencias" deja solo una tarjeta;
 * buscar "zzzz-no-existe" muestra el mensaje vacío.
 */
run(() =>
  withSession('Búsqueda de asignaturas (act + observe)', async (s) => {
    const acc = await createAccount();
    await createSubjectApi(acc.token, { name: 'Ciencias', professor: 'Marco', credits: 4 });
    await createSubjectApi(acc.token, { name: 'Historia', professor: 'Lucia', credits: 3 });
    await loginWithAi(s, acc);
    await s.page.goto(`${APP_URL}/subjects`);
    await s.page.waitForSelector('mat-card.subject-card', { timeout: 30_000 });

    const found = await s.stagehand.observe('Encuentra el campo de búsqueda de asignaturas', { page: s.page });
    if (found.data.length === 0) throw new Error('Observe no encontró el buscador.');

    await s.stagehand.act('Escribe %q% en el campo de búsqueda', { page: s.page, variables: { q: 'Ciencias' } });
    await s.page.waitForFunction(() => document.querySelectorAll('mat-card.subject-card').length === 1, undefined, {
      timeout: 30_000,
    });
    assertIncludes(await s.page.locator('mat-card.subject-card').first().innerText(), 'Ciencias', 'Filtro incorrecto.');

    await s.page.locator('#subject-search').fill('');
    await s.stagehand.act('Escribe %q% en el campo de búsqueda', { page: s.page, variables: { q: 'zzzz-no-existe' } });
    await s.page.waitForSelector('p.empty', { state: 'visible', timeout: 30_000 });
    assertIncludes(await s.page.locator('p.empty').innerText(), 'You have no subjects yet', 'Falta mensaje vacío.');
  }),
);
