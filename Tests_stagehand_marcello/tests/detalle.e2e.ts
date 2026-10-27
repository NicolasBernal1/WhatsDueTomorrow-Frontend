import 'dotenv/config';
import { z } from 'zod';
import { APP_URL, createAccount, createSubjectApi, actOr, clickByText, loginWithAi, waitForUrl, withSession } from '../src/app.js';
import { assertIncludes } from '../src/assert.js';
import { run } from '../src/run.js';

/**
 * F08: Dado una materia, cuando la IA abre su detalle,
 * entonces extract devuelve título y profesor correctos.
 */
run(() =>
  withSession('F08 Detalle de asignatura (act + extract)', async (s) => {
    const acc = await createAccount();
    await createSubjectApi(acc.token, { name: 'Ciencias', professor: 'Marco', credits: 4 });
    await loginWithAi(s, acc);
    await s.page.goto(`${APP_URL}/subjects`);
    await s.page.waitForSelector('mat-card.subject-card', { timeout: 30_000 });

    await actOr(s, 'Haz clic en la tarjeta de la asignatura Ciencias', () => clickByText(s, 'mat-card.subject-card', 'Ciencias'));
    await waitForUrl(s, /\/subjects\/[\w-]+$/, 30_000);

    const out = await s.stagehand.extract(
      'Extrae el título y el subtítulo del encabezado de la asignatura.',
      z.object({ title: z.string(), subtitle: z.string() }),
      { page: s.page },
    );
    assertIncludes(out.data.title, 'Ciencias', 'El título del detalle no coincide.');
    assertIncludes(out.data.subtitle, 'Marco', 'El profesor del detalle no coincide.');
  }),
);
