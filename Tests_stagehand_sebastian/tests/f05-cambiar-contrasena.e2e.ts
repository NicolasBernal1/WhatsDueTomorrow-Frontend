import 'dotenv/config';
import { z } from 'zod';
import { clickByText, createAccount, waitForUrl } from '../src/app.js';
import { CLAVE_PERFIL, conEvidencia, loginStatus, sesionConToken } from '../src/usuario.js';
import { run } from '../src/run.js';

run(() =>
  conEvidencia('F05 Cambiar contraseña (act + observe + extract)', async (s, ev) => {
    const acc = await createAccount();
    const nueva = 'Nueva#456';
    const escribirClave = (valor: string) => () => s.page.locator(CLAVE_PERFIL).fill(valor);
    const pulsar = (texto: string) => () => clickByText(s, '.password-section button', texto);
    await sesionConToken(s, acc.token);

    await ev.act('Haz clic en el botón Profile de la barra superior', () => clickByText(s, 'mat-toolbar button', 'Profile'));
    await s.page.waitForSelector('.password-section', { state: 'visible', timeout: 30_000 });

    // Negativo: contraseña actual incorrecta
    await ev.act('Escribe %clave% en el campo "Current password"', escribirClave('incorrecta'), { clave: 'incorrecta' });
    await ev.act('Haz clic en el botón "Verify Password"', pulsar('Verify Password'));
    await s.page.waitForSelector('.password-section .error-message', { state: 'visible', timeout: 30_000 });
    const error = await ev.extract(
      'Extrae el mensaje de error que aparece en la sección Change Password',
      z.object({ mensaje: z.string() }),
    );
    ev.check('extract: el mensaje es "Incorrect password"', /incorrect password/i.test(error.mensaje), error);

    // Positivo
    await s.page.locator(CLAVE_PERFIL).fill('');
    await ev.act('Escribe %clave% en el campo "Current password"', escribirClave(acc.password), { clave: acc.password });
    await ev.act('Haz clic en el botón "Verify Password"', pulsar('Verify Password'));
    await s.page.waitForSelector('.verified-message', { state: 'visible', timeout: 30_000 });
    await ev.observe('Encuentra el campo "New password" y el botón "Change Password"', 2);
    const verificado = await ev.extract(
      'Extrae el mensaje de confirmación que aparece en la sección Change Password',
      z.object({ mensaje: z.string() }),
    );
    ev.check('extract: la contraseña actual quedó verificada', /verified/i.test(verificado.mensaje), verificado);

    await ev.act('Escribe %clave% en el campo "New password"', escribirClave(nueva), { clave: nueva });
    await ev.act('Haz clic en el botón "Change Password"', pulsar('Change Password'));
    await waitForUrl(s, /\/login/);
    ev.check('al cambiarla se cierra la sesión (/login)', (await s.page.url()).includes('/login'), await s.page.url());
    ev.check('backend: la contraseña anterior ya no sirve (401)', (await loginStatus(acc.email, acc.password)) === 401, '401');
    ev.check('backend: la contraseña nueva sí sirve (201)', (await loginStatus(acc.email, nueva)) === 201, '201');
  }),
);