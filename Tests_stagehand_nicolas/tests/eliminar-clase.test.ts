import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  answerNextConfirmWith, chooseFromContextMenu, logInThroughTheUi, readSchedule, rightClickClassCard, timeRange,
  waitForSchedule,
} from '../support/ui';
import { openWorld, World } from '../support/world';

describe('Eliminar clase', () => {
  let world: World;

  beforeEach(async () => {
    world = await openWorld('Alicia');
    await world.student.hasSubject('Cálculo', 'Gómez');
    await world.student.hasClass('Cálculo', 'monday', '08:00', '09:00');
    await logInThroughTheUi(world.page, world.student.credentials);
  });
  afterEach(async () => { await world.close(); });

  it('[smoke] elimina una clase y desaparece sin recargar la pagina', async () => {
    await answerNextConfirmWith(world.page, true);
    await rightClickClassCard(world.page, 'Cálculo');
    await chooseFromContextMenu(world.page, 'Delete');

    await expect.poll(async () => (await world.student.classes()).length, { timeout: 15_000 }).toBe(0);

    await world.page.waitForSelector('.schedule-grid .class-card', { state: 'detached', timeout: 15_000 });
    expect((await readSchedule(world.page)).cards).toHaveLength(0);
  });

  it('la clase eliminada no vuelve a aparecer al recargar', async () => {
    await answerNextConfirmWith(world.page, true);
    await rightClickClassCard(world.page, 'Cálculo');
    await chooseFromContextMenu(world.page, 'Delete');

    await expect.poll(async () => (await world.student.classes()).length, { timeout: 15_000 }).toBe(0);

    await world.page.reload();
    await waitForSchedule(world.page);
    expect((await readSchedule(world.page)).cards).toHaveLength(0);
  });

  it('cancelar la confirmacion conserva la clase', async () => {
    await answerNextConfirmWith(world.page, false);
    await rightClickClassCard(world.page, 'Cálculo');
    await chooseFromContextMenu(world.page, 'Delete');

    await world.page.reload();
    await waitForSchedule(world.page);
    const schedule = await readSchedule(world.page);
    expect(schedule.cards).toHaveLength(1);
    expect(schedule.cards[0].time).toMatch(timeRange('08:00', '09:00'));
  });
});