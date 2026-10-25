import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cancelClassForm, fillClassForm, goToScheduleFromNavbar, logInThroughTheUi, openAddClassModal,
  openSubjectFromSubjectsPage, readModalErrors, readSchedule, saveClassForm, timeRange,
} from '../support/ui';
import { openWorld, World } from '../support/world';

describe('Agregar clase', () => {
  let world: World;

  beforeEach(async () => {
    world = await openWorld('Alicia');
    await world.student.hasSubject('Cálculo', 'Gómez');
    await logInThroughTheUi(world.page, world.student.credentials);
    await openSubjectFromSubjectsPage(world.page, 'Cálculo');
  });
  afterEach(async () => { await world.close(); });

  it('[smoke] agrega una clase valida y la ve en el horario', async () => {
    await openAddClassModal(world.page);
    await fillClassForm(world.page, { day: 'Tuesday', start: '14:00', end: '15:00' });
    await saveClassForm(world.page);
    await world.page.waitForSelector('mat-card.modal', { state: 'detached' });

    await goToScheduleFromNavbar(world.page);
    const schedule = await readSchedule(world.page);

    expect(schedule.cards).toHaveLength(1);
    expect(schedule.cards[0].name).toBe('Cálculo');
    expect(schedule.cards[0].time).toMatch(timeRange('14:00', '15:00'));
  });

  it('no permite una clase que termina antes de empezar', async () => {
    await openAddClassModal(world.page);
    await fillClassForm(world.page, { day: 'Tuesday', start: '15:00', end: '14:00' });
    await saveClassForm(world.page);

    expect(await readModalErrors(world.page)).toContain('End time must be greater than start time.');

    await cancelClassForm(world.page);
    await goToScheduleFromNavbar(world.page);
    expect((await readSchedule(world.page)).cards).toHaveLength(0);
  });

  it('no permite una clase que se cruza con otra del mismo dia', async () => {
    await world.student.hasClass('Cálculo', 'monday', '09:00', '10:00');

    await openAddClassModal(world.page);
    await fillClassForm(world.page, { day: 'Monday', start: '08:00', end: '10:00' });
    await saveClassForm(world.page);

    const errors = await readModalErrors(world.page);
    if (!errors.includes('This class overlaps with another class in your schedule.')) {
      console.log('[DIAGNOSTICO traslape]', {
        erroresEnModal: errors,
        modalAbierto: await world.page.locator('mat-card.modal').count(),
        clasesEnBackend: (await world.student.classes()).length,
      });
    }
    expect(errors).toContain('This class overlaps with another class in your schedule.');

    await cancelClassForm(world.page);
    await goToScheduleFromNavbar(world.page);
    const schedule = await readSchedule(world.page);
    expect(schedule.cards).toHaveLength(1);
    expect(schedule.cards[0].time).toMatch(timeRange('09:00', '10:00'));
  });
});