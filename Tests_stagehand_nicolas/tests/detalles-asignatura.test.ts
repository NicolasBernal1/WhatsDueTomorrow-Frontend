import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { logInThroughTheUi, openClassFromSchedule, readSubjectHeader } from '../support/ui';
import { openWorld, World } from '../support/world';

describe('Detalles de asignatura desde el horario', () => {
  let world: World;

  beforeEach(async () => {
    world = await openWorld('Alicia');
    await world.student.hasSubject('Cálculo', 'Gómez');
    await world.student.hasSubject('Física', 'Pérez');
    await world.student.hasClass('Cálculo', 'monday', '08:00', '09:00');
    await world.student.hasClass('Física', 'tuesday', '10:00', '11:00');
    await logInThroughTheUi(world.page, world.student.credentials);
  });
  afterEach(async () => { await world.close(); });

  it('[smoke] click en una clase lleva a los detalles de su asignatura', async () => {
    await openClassFromSchedule(world.page, 'Cálculo');
    await world.page.waitForURL('**/subjects/*', { timeout: 30_000 });
    await world.page.waitForSelector('mat-card.subject-header');

    expect(await readSubjectHeader(world.page)).toEqual({ name: 'Cálculo', professor: 'Gómez' });
  });

  it('cada clase lleva a los detalles de su propia asignatura', async () => {
    await openClassFromSchedule(world.page, 'Física');
    await world.page.waitForURL('**/subjects/*', { timeout: 30_000 });
    await world.page.waitForSelector('mat-card.subject-header');

    expect(await readSubjectHeader(world.page)).toEqual({ name: 'Física', professor: 'Pérez' });
  });
});
