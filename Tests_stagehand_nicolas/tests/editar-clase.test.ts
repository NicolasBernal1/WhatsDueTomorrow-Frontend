import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cancelClassForm, chooseFromContextMenu, fillClassForm, logInThroughTheUi, readModalErrors, readSchedule,
  rightClickClassCard, saveClassForm, timeRange, waitForSchedule,
} from '../support/ui';
import { openWorld, World } from '../support/world';

describe('Editar clase', () => {
  let world: World;

  beforeEach(async () => {
    world = await openWorld('Alicia');
    await world.student.hasSubject('Cálculo', 'Gómez');
    await world.student.hasClass('Cálculo', 'monday', '08:00', '09:00');
    await logInThroughTheUi(world.page, world.student.credentials);
  });
  afterEach(async () => { await world.close(); });

  it('[smoke] cambia el horario de una clase y ve el cambio', async () => {
    await rightClickClassCard(world.page, 'Cálculo');
    await chooseFromContextMenu(world.page, 'Edit');
    await world.page.waitForSelector('mat-card.modal');

    await fillClassForm(world.page, { day: 'Thursday', start: '14:00', end: '15:00' });
    await saveClassForm(world.page);
    await world.page.waitForSelector('mat-card.modal', { state: 'detached' });
    await waitForSchedule(world.page);

    const schedule = await readSchedule(world.page);
    expect(schedule.cards).toHaveLength(1);
    expect(schedule.cards[0].time).toMatch(timeRange('14:00', '15:00'));

    const [saved] = await world.student.classes();
    expect(saved.dayOfWeek.toLowerCase()).toBe('thursday');
  });

  it('no permite editar una clase para que termine antes de empezar', async () => {
    await rightClickClassCard(world.page, 'Cálculo');
    await chooseFromContextMenu(world.page, 'Edit');
    await world.page.waitForSelector('mat-card.modal');

    await fillClassForm(world.page, { day: 'Thursday', start: '15:00', end: '14:00' });
    await saveClassForm(world.page);
    expect(await readModalErrors(world.page)).toContain('End time must be greater than start time.');

    await cancelClassForm(world.page);
    const schedule = await readSchedule(world.page);
    expect(schedule.cards).toHaveLength(1);
    expect(schedule.cards[0].time).toMatch(timeRange('08:00', '09:00'));
  });
});
