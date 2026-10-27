import 'dotenv/config';
import { APP_URL, createAccount, actOr, clickByText, loginWithAi, withSession } from '../src/app.js';
import { assertIncludes } from '../src/assert.js';
import { run } from '../src/run.js';

/**
 * F09: Dado el formulario "Add New Subject", cuando la IA lo llena con datos válidos y guarda,
 * entonces la tarjeta "Ciencias / Marco" aparece en la lista.
 */
run(() =>
  withSession('F09 Registrar asignatura (act)', async (s) => {
    const acc = await createAccount();
    await loginWithAi(s, acc);
    await s.page.goto(`${APP_URL}/subjects`);
    await s.page.waitForSelector('#subject-search', { timeout: 30_000 });

    await actOr(s, 'Abre el formulario para agregar una nueva asignatura', () => clickByText(s, 'button', 'Add Subject'));
    await actOr(s, 'Escribe %n% en el campo Name', () => s.page.locator('input[formcontrolname="name"]').fill('Ciencias'), { n: 'Ciencias' });
    await actOr(s, 'Escribe %p% en el campo Professor', () => s.page.locator('input[formcontrolname="professor"]').fill('Marco'), { p: 'Marco' });
    await actOr(s, 'Escribe %c% en el campo de créditos', () => s.page.locator('input[formcontrolname="credits"]').fill('4'), { c: '4' });
    await actOr(s, 'Haz clic en el botón Save', () => s.page.locator('button[type="submit"]').click());

    await s.page.waitForSelector('mat-card.subject-card', { timeout: 30_000 });
    const card = await s.page.locator('mat-card.subject-card').first().innerText();
    assertIncludes(card, 'Ciencias', 'La tarjeta no muestra el nombre.');
    assertIncludes(card, 'Marco', 'La tarjeta no muestra el profesor.');
    assertIncludes(card, '4 cr.', 'La tarjeta no muestra los créditos.');
  }),
);
