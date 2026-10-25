import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Student } from '../support/api';
import { logInThroughTheUi, readSchedule, timeRange } from '../support/ui';
import { openWorld, World } from '../support/world';

describe('Consultar horario de clases', () => {
  let world: World;

  beforeEach(async () => { world = await openWorld('Alicia'); });
  afterEach(async () => { await world.close(); });

  it('[smoke] ve en el horario las clases que tiene registradas', async () => {
    await world.student.hasSubject('Cálculo', 'Gómez');
    await world.student.hasClass('Cálculo', 'monday', '08:00', '09:00');
    await world.student.hasClass('Cálculo', 'wednesday', '10:00', '11:00');

    await logInThroughTheUi(world.page, world.student.credentials);
    const schedule = await readSchedule(world.page);

    expect(schedule.dayHeaders).toBe(7);
    expect(schedule.cards).toHaveLength(2);
    expect(schedule.cards.every(c => c.name === 'Cálculo' && c.professor === 'Gómez')).toBe(true);
    expect(schedule.cards.map(c => c.time)).toEqual(expect.arrayContaining([
      expect.stringMatching(timeRange('08:00', '09:00')),
      expect.stringMatching(timeRange('10:00', '11:00')),
    ]));
  });

  it('ve el horario vacio cuando no tiene clases', async () => {
    await logInThroughTheUi(world.page, world.student.credentials);
    const schedule = await readSchedule(world.page);

    expect(schedule.dayHeaders).toBe(7);
    expect(schedule.cards).toHaveLength(0);
  });

  it('no ve las clases de otro estudiante', async () => {
    await world.student.hasSubject('Cálculo', 'Gómez');
    await world.student.hasClass('Cálculo', 'monday', '08:00', '09:00');

    const bruno = await Student.register('Bruno');
    try {
      await logInThroughTheUi(world.page, bruno.credentials);
      const schedule = await readSchedule(world.page);

      expect(schedule.cards).toHaveLength(0);
      expect(schedule.cards.some(c => c.name === 'Cálculo')).toBe(false);
    } finally {
      await bruno.cleanUp().catch(() => undefined);
    }
  });
});
