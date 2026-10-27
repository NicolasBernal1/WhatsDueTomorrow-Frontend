import 'dotenv/config';
import { z } from 'zod';
import { APP_URL, createAccount, waitForUrl } from '../src/app.js';
import { alertas, campo, conEvidencia, deshabilitado, tokenGuardado } from '../src/usuario.js';
import { run } from '../src/run.js';

run(() =>
  conEvidencia('F02 Iniciar sesión (act + observe + extract)', async (s, ev) => {
    const acc = await createAccount();
    const escribir = (nombre: 'email' | 'password', valor: string) => () => s.page.locator(campo(nombre)).fill(valor);
    const enviar = () => s.page.locator('button[type="submit"]').click();

    await s.page.goto(`${APP_URL}/login`);
    await s.page.waitForSelector(campo('email'), { state: 'visible', timeout: 60_000 });

    await ev.observe('Encuentra el botón para iniciar sesión (Log In)');
    const boton = await ev.extract(
      'Indica si el botón "Log In" del formulario está habilitado para hacer clic',
      z.object({ habilitado: z.boolean() }),
    );
    const domDeshabilitado = await deshabilitado(s, 'button[type="submit"]');
    ev.check('extract coincide con el DOM: con el formulario vacío el botón está bloqueado',
      boton.habilitado === false && domDeshabilitado === true, { ia: boton, dom: { disabled: domDeshabilitado } });

    // Negativo: contraseña incorrecta
    await ev.act('Escribe %correo% en el campo Email', escribir('email', acc.email), { correo: acc.email });
    await ev.act('Escribe %clave% en el campo Password', escribir('password', 'incorrecta'), { clave: 'incorrecta' });
    await ev.act('Haz clic en el botón Log In', enviar);
    await s.page.waitForFunction(() => ((window as any).__alerts ?? []).length > 0, undefined, { timeout: 30_000 });
    ev.check('la app avisa "Invalid Credentials"', (await alertas(s)).includes('Invalid Credentials'), await alertas(s));
    ev.check('sigue en /login y sin token', (await s.page.url()).includes('/login') && !(await tokenGuardado(s)), await s.page.url());

    // Positivo
    await s.page.locator(campo('password')).fill('');
    await ev.act('Escribe %clave% en el campo Password', escribir('password', acc.password), { clave: acc.password });
    await ev.act('Haz clic en el botón Log In', enviar);
    await waitForUrl(s, /\/schedule/);
    const nav = await ev.extract(
      'Extrae los textos de los enlaces de navegación de la barra superior',
      z.object({ enlaces: z.array(z.string()) }),
    );
    const enlaces = nav.enlaces.map((e) => e.toLowerCase());
    ev.check('extract: la barra tiene Schedule, Subjects, Assignments y Urgent radar',
      ['schedule', 'subjects', 'assignments', 'urgent radar'].every((e) => enlaces.some((x) => x.includes(e))), nav);
    ev.check('hay token en localStorage', !!(await tokenGuardado(s)), 'token presente');
  }),
);