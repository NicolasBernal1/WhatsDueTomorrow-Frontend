import 'dotenv/config';
import { z } from 'zod';
import { APP_URL, createAccount, waitForUrl } from '../src/app.js';
import { alertas, campo, conEvidencia, deshabilitado, loginStatus, tokenGuardado } from '../src/usuario.js';
import { run } from '../src/run.js';

run(() =>
  conEvidencia('F01 Registrar estudiante (act + observe + extract)', async (s, ev) => {
    const email = `sh.f01.${Date.now()}@test.com`;
    const clave = 'Stagehand#123';
    const escribir = (nombre: 'name' | 'email' | 'password', valor: string) => () => s.page.locator(campo(nombre)).fill(valor);

    await s.page.goto(`${APP_URL}/register`);
    await s.page.waitForSelector(campo('name'), { state: 'visible', timeout: 60_000 });

    await ev.observe('Encuentra los campos Name, Email y Password del formulario de registro', 3);

    // Negativo: correo mal formado
    await ev.act('Escribe %correo% en el campo Email', escribir('email', 'no-es-email'), { correo: 'no-es-email' });
    await ev.act('Haz clic en el campo Password', () => s.page.locator(campo('password')).click());
    const error = await ev.extract(
      'Extrae el mensaje de error que aparece debajo del campo Email',
      z.object({ mensaje: z.string() }),
    );
    ev.check('extract: el error dice que el correo no es válido', /valid email/i.test(error.mensaje), error);
    ev.check('DOM: el botón Register está deshabilitado', (await deshabilitado(s, 'button[type="submit"]')) === true, 'disabled');

    // Negativo: correo ya registrado
    const existente = await createAccount();
    await s.page.locator(campo('email')).fill('');
    await ev.act('Escribe %nombre% en el campo Name', escribir('name', 'Ana Gomez'), { nombre: 'Ana Gomez' });
    await ev.act('Escribe %correo% en el campo Email', escribir('email', existente.email), { correo: existente.email });
    await ev.act('Escribe %clave% en el campo Password', escribir('password', clave), { clave });
    await ev.act('Haz clic en el botón Register', () => s.page.locator('button[type="submit"]').click());
    await s.page.waitForFunction(() => ((window as any).__alerts ?? []).length > 0, undefined, { timeout: 30_000 });
    ev.check('la app avisa que el correo ya está en uso', (await alertas(s)).includes('This email is already in use'), await alertas(s));
    ev.check('sigue en /register', (await s.page.url()).includes('/register'), await s.page.url());

    // Positivo
    await s.page.locator(campo('email')).fill('');
    await ev.act('Escribe %correo% en el campo Email', escribir('email', email), { correo: email });
    await ev.act('Haz clic en el botón Register', () => s.page.locator('button[type="submit"]').click());
    await waitForUrl(s, /\/schedule/);
    const barra = await ev.extract(
      'Extrae el nombre de la aplicación que aparece en la barra superior',
      z.object({ titulo: z.string() }),
    );
    ev.check('extract: la barra superior muestra la app', /due tomorrow/i.test(barra.titulo), barra);
    ev.check('hay token en localStorage', !!(await tokenGuardado(s)), 'token presente');
    ev.check('el backend acepta las credenciales nuevas (login 201)', (await loginStatus(email, clave)) === 201, email);
  }),
);