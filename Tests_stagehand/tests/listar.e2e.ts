import 'dotenv/config';
import { z } from 'zod';
import { APP_URL, createAccount, createSubjectApi, loginWithAi, withSession } from '../src/app.js';
import { assertIncludes } from '../src/assert.js';
import { run } from '../src/run.js';

/**
 * F07: Dado un usuario con dos materias, cuando abre /subjects,
 * entonces la IA extrae ambas (extract) y el código verifica los datos exactos.
 */
run(() =>
  withSession('F07 Listar asignaturas (extract)', async (s) => {
    const acc = await createAccount();
    await createSubjectApi(acc.token, { name: 'Ciencias', professor: 'Marco', credits: 4 });
    await createSubjectApi(acc.token, { name: 'Historia', professor: 'Lucia', credits: 3 });
    await loginWithAi(s, acc);
    await s.page.goto(`${APP_URL}/subjects`);
    await s.page.waitForSelector('mat-card.subject-card', { timeout: 30_000 });

    const schema = z.object({
      subjects: z.array(z.object({ name: z.string(), professor: z.string() })).min(2),
    });
    const out = await s.stagehand.extract(
      'Extrae el nombre y el profesor de cada tarjeta de asignatura visible.',
      schema,
      { page: s.page },
    );
    const text = JSON.stringify(out.data.subjects);
    assertIncludes(text, 'Ciencias', 'Falta la asignatura Ciencias.');
    assertIncludes(text, 'Marco', 'Falta el profesor Marco.');
    assertIncludes(text, 'Historia', 'Falta la asignatura Historia.');
    assertIncludes(text, 'Lucia', 'Falta el profesor Lucia.');
  }),
);
