import 'dotenv/config';
import { z } from 'zod';
import { createAccount, createSubjectApi } from '../src/app.js';
import { CAMPANA, conEvidencia, createAssignmentApi, sesionConToken } from '../src/usuario.js';
import { run } from '../src/run.js';

run(() =>
  conEvidencia('F06 Notificaciones de tareas próximas (act + observe + extract)', async (s, ev) => {
    const acc = await createAccount();
    await createSubjectApi(acc.token, { name: 'Calculo', professor: 'Marco', credits: 3 });
    await createAssignmentApi(acc.token, 'Calculo', 'Taller de Calculo', 3);
    await createAssignmentApi(acc.token, 'Calculo', 'Parcial', 30);
    await createAssignmentApi(acc.token, 'Calculo', 'Proyecto final', 72);
    await sesionConToken(s, acc.token);
    await s.page.waitForSelector(`${CAMPANA} .mat-badge-content`, { timeout: 30_000 });

    await ev.observe('Encuentra el botón de notificaciones (campana) de la barra superior');
    const insignia = await ev.extract(
      'Extrae el número que aparece en la insignia roja de la campana de notificaciones',
      z.object({ cantidad: z.number() }),
    );
    ev.check('extract: la insignia muestra 2', insignia.cantidad === 2, insignia);

    await ev.act('Haz clic en el botón de notificaciones (campana) de la barra superior', () => s.page.locator(CAMPANA).click());
    await s.page.waitForSelector('.upcoming-item', { state: 'visible', timeout: 30_000 });
    const lista = await ev.extract(
      'Extrae el título del menú y, de cada tarea listada, su título y el nombre de su materia',
      z.object({ encabezado: z.string(), tareas: z.array(z.object({ titulo: z.string(), materia: z.string() })) }),
    );
    const titulos = lista.tareas.map((t) => t.titulo.trim()).sort();
    ev.check('extract: el menú se titula "Due soon"', /due soon/i.test(lista.encabezado), lista.encabezado);
    ev.check('extract: aparecen exactamente las dos tareas de las próximas 48 h', JSON.stringify(titulos) === JSON.stringify(['Parcial', 'Taller de Calculo']), titulos);
    ev.check('extract: la tarea de 72 h no aparece', !titulos.includes('Proyecto final'), titulos);
    ev.check('extract: cada tarea muestra su materia', lista.tareas.every((t) => /calculo/i.test(t.materia)), lista.tareas);

    const filasDom = await s.page.locator('.upcoming-item').count();
    ev.check('DOM: hay 2 filas en el menú (coincide con la IA)', filasDom === 2 && lista.tareas.length === 2, { dom: filasDom, ia: lista.tareas.length });
  }),
);