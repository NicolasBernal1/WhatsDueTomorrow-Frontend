import 'dotenv/config';
import { APP_URL, createAccount, loginWithAi, withSession } from '../src/app.js';
import { assertIncludes } from '../src/assert.js';
import { run } from '../src/run.js';

/**
 * Dado un usuario registrado, cuando inicia sesión con la IA (act),
 * entonces llega a la aplicación y puede abrir /subjects.
 */
run(() =>
  withSession('Login con IA', async (s) => {
    const acc = await createAccount();
    await loginWithAi(s, acc);
    await s.page.goto(`${APP_URL}/subjects`);
    await s.page.waitForSelector('#subject-search', { state: 'visible', timeout: 30_000 });
    assertIncludes(await s.page.url(), '/subjects', 'No se llegó a /subjects tras iniciar sesión.');
  }),
);
