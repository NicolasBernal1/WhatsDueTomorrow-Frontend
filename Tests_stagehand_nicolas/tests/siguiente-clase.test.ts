import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { logInThroughTheUi, openNextClassDetails, readSchedule, waitForSchedule } from '../support/ui';
import { weekdayFromToday } from '../support/weekdays';
import { openWorld, World } from '../support/world';

describe('Ver siguiente clase', () => {
  let world: World;

  beforeEach(async () => {
    world = await openWorld('Alicia');
    await world.student.hasSubject('Cálculo', 'Gómez');
    await world.student.hasSubject('Física', 'Pérez');
  });
  afterEach(async () => { await world.close(); });

  it('[smoke] muestra la clase mas cercana en el tiempo', async () => {
    await world.student.hasClass('Física', weekdayFromToday(2), '08:00', '09:00');
    await world.student.hasClass('Cálculo', weekdayFromToday(1), '10:00', '11:00');

    await logInThroughTheUi(world.page, world.student.credentials);

    const { next } = await readSchedule(world.page);
    expect(next.subject).toBe('Cálculo');
    expect(next.professor).toBe('Gómez');
    expect(next.time).toMatch(/^Tomorrow · 10:00(:00)? - 11:00(:00)?$/);

    const extracted = await world.page.extract({
      instruction: 'Read the "Your Next Class" card at the top of the page: subject name and professor name.',
      schema: z.object({ subject: z.string(), professor: z.string() }),
    });
    expect(extracted.subject).toContain('Cálculo');
    expect(extracted.professor).toContain('Gómez');
  });

  it('avisa cuando no hay clases programadas', async () => {
    await logInThroughTheUi(world.page, world.student.credentials);

    const { next } = await readSchedule(world.page);
    expect(next.emptyMessage).toBe('You do not have more classes.');
  });

  it('va a los detalles de la asignatura desde la proxima clase', async () => {
    await world.student.hasClass('Cálculo', weekdayFromToday(1), '10:00', '11:00');
    await logInThroughTheUi(world.page, world.student.credentials);
    await waitForSchedule(world.page);

    await openNextClassDetails(world.page);
    await world.page.waitForURL('**/subjects/*', { timeout: 30_000 });
    await world.page.waitForSelector('mat-card.subject-header');

    const title = await world.page.evaluate(
      () => document.querySelector('mat-card.subject-header mat-card-title')?.textContent?.trim());
    expect(title).toBe('Cálculo');
  });
});
