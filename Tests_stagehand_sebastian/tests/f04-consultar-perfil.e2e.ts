import 'dotenv/config';
import { z } from 'zod';
import { clickByText, createAccount } from '../src/app.js';
import { conEvidencia, perfilApi, sesionConToken } from '../src/usuario.js';
import { run } from '../src/run.js';


run(() =>
  conEvidencia('F04 Consultar perfil (act + observe + extract)', async (s, ev) => {
    const acc = await createAccount();
    await sesionConToken(s, acc.token);

    await ev.act('Haz clic en el botón Profile de la barra superior', () => clickByText(s, 'mat-toolbar button', 'Profile'));
    await s.page.waitForSelector('.profile-info', { state: 'visible', timeout: 30_000 });

    const perfil = await ev.extract(
      'Extrae el nombre y el correo electrónico del usuario que aparecen en el menú de perfil',
      z.object({ nombre: z.string(), correo: z.string() }),
    );
    ev.check('extract: el nombre es el de la cuenta', perfil.nombre.trim() === 'Stagehand Tester', perfil);
    ev.check('extract: el correo es el de la cuenta', perfil.correo.trim().toLowerCase() === acc.email, perfil);

    const api = await perfilApi(acc.token);
    ev.check('la UI coincide con GET /users/profile', api?.name === perfil.nombre.trim() && api?.email === perfil.correo.trim().toLowerCase(), { ui: perfil, api });

    await ev.observe('Encuentra el botón para editar el perfil y la sección "Change Password"', 2);
  }),
);