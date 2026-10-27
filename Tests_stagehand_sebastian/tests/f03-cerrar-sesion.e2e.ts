import 'dotenv/config';
import { z } from 'zod';
import { APP_URL, clickByText, createAccount, waitForUrl } from '../src/app.js';
import { conEvidencia, sesionConToken, tokenGuardado } from '../src/usuario.js';
import { run } from '../src/run.js';


run(() =>
  conEvidencia('F03 Cerrar sesión (act + observe + extract)', async (s, ev) => {
    const acc = await createAccount();
    await sesionConToken(s, acc.token);

    await ev.observe('Encuentra el botón Profile de la barra superior');
    await ev.act('Haz clic en el botón Profile de la barra superior', () => clickByText(s, 'mat-toolbar button', 'Profile'));
    await s.page.waitForSelector('.profile-content', { state: 'visible', timeout: 30_000 });
    await ev.observe('Encuentra la opción "Log Out" dentro del menú de perfil');

    await ev.act('Haz clic en la opción Log Out del menú de perfil', () => clickByText(s, '.profile-content button', 'Log Out'));
    await waitForUrl(s, /\/login/);
    const pantalla = await ev.extract(
      'Extrae el título del formulario que se muestra y el texto del botón principal',
      z.object({ titulo: z.string(), boton: z.string() }),
    );
    ev.check('extract: se muestra el formulario "Log In"', /log in/i.test(pantalla.titulo) && /log in/i.test(pantalla.boton), pantalla);
    ev.check('el token se borró de localStorage', (await tokenGuardado(s)) === null, 'token = null');

    await s.page.goto(`${APP_URL}/schedule`);
    await waitForUrl(s, /\/login/, 30_000);
    ev.check('sin sesión, /schedule redirige a /login', (await s.page.url()).includes('/login'), await s.page.url());
  }),
);