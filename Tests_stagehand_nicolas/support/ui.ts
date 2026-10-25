import { Page } from '@browserbasehq/stagehand';

import { Credentials } from './api';
import { env } from './env';

const STRICT_AI = process.env.STRICT_AI === 'true';
const AI_DROPDOWNS = process.env.AI_DROPDOWNS === 'true';
const SKIP_AI = process.env.SKIP_AI === 'true';

export async function waitForSchedule(page: Page): Promise<void> {
  await page.waitForSelector('.schedule-grid .header', { timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

interface Target {
  click: string;
  expect?: string;
  gone?: string;
}

async function reached(page: Page, target: Target, timeout: number): Promise<boolean> {
  try {
    if (target.expect) await page.waitForSelector(target.expect, { state: 'visible', timeout });
    if (target.gone) await page.waitForSelector(target.gone, { state: 'detached', timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickDirect(page: Page, target: Target): Promise<boolean> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.locator(target.click).first().click();
    if (await reached(page, target, 10_000)) return true;
  }
  return false;
}

export async function act(page: Page, instruction: string, target: Target): Promise<void> {
  if (SKIP_AI) {
    if (!(await clickDirect(page, target))) throw new Error(`"${instruction}" no produjo el resultado esperado (${target.click})`);
    return;
  }

  let reason = '';
  try {
    const result = await page.act({ action: instruction, timeoutMs: 240_000 });
    if (!result.success) reason = `act() devolvio success:false (${result.message})`;
  } catch (error) {
    reason = `act() lanzo un error: ${(error as Error).message}`;
  }

  if (!reason && await reached(page, target, 8_000)) return;
  if (!reason) reason = 'el click del modelo no produjo el resultado esperado';

  if (STRICT_AI) throw new Error(`[IA] "${instruction}" -> ${reason}`);

  console.warn(`[FALLBACK] "${instruction}" -> ${reason}. Click directo en ${target.click}`);
  if (!(await clickDirect(page, target))) {
    throw new Error(`"${instruction}" fallo con la IA y con el click directo (${target.click})`);
  }
}

export async function logInThroughTheUi(page: Page, { email, password }: Credentials): Promise<void> {
  const response = await fetch(`${env.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (response.status !== 201) throw new Error(`POST /auth/login respondio ${response.status}`);
  const token: string = (await response.json()).data.token;

  await page.goto(`${env.baseUrl}/login`);
  await page.evaluate((t: string) => localStorage.setItem('token', t), token);
  await page.goto(`${env.baseUrl}/schedule`);
  await waitForSchedule(page);
}

const navLink = (label: string) => `xpath=//mat-toolbar//span[contains(@class,"navbar-center")]//a[normalize-space(.)="${label}"]`;

export async function goToScheduleFromNavbar(page: Page): Promise<void> {
  await act(page, 'Click the "Schedule" link in the center of the top toolbar', {
    click: navLink('Schedule'), expect: '.schedule-grid .header',
  });
  await waitForSchedule(page);
}

export async function openSubjectFromSubjectsPage(page: Page, subjectName: string): Promise<void> {
  await act(page, 'Click the "Subjects" link in the center of the top toolbar', {
    click: navLink('Subjects'), expect: 'mat-card.subject-card',
  });
  await act(page, `Click the subject card titled "${subjectName}"`, {
    click: `xpath=//mat-card[contains(@class,"subject-card")][.//h3[normalize-space(.)="${subjectName}"]]`,
    expect: 'mat-card.subject-header',
  });
}

export async function openAddClassModal(page: Page): Promise<void> {
  await act(page, 'Click the "+ Add Class" button', {
    click: 'xpath=//button[contains(normalize-space(.),"+ Add Class")]', expect: 'mat-card.modal',
  });
}

async function pickFromDropdown(page: Page, label: string, option: string): Promise<void> {
  const field = `xpath=//mat-card[contains(@class,"modal")]//mat-form-field[.//mat-label[normalize-space(.)="${label}"]]//mat-select`;
  const choice = `xpath=//div[contains(@class,"cdk-overlay-container")]//mat-option[normalize-space(.)="${option}"]`;

  if (AI_DROPDOWNS) {
    await act(page, `Click the "${label}" dropdown inside the class modal`, { click: field, expect: 'mat-option' });
    await act(page, `In the open dropdown list, click the option "${option}"`, { click: choice, gone: 'mat-option' });
    return;
  }
  await page.locator(field).click();
  await page.waitForSelector('mat-option', { state: 'visible' });
  await page.locator(choice).click();
  await page.waitForSelector('mat-option', { state: 'detached' });
}

export async function fillClassForm(page: Page, form: { day: string; start: string; end: string }): Promise<void> {
  await pickFromDropdown(page, 'Day', form.day);
  await pickFromDropdown(page, 'Start time', form.start);
  await pickFromDropdown(page, 'End time', form.end);
}

export async function saveClassForm(page: Page): Promise<void> {
  await act(page, 'Click the "Save" button in the class modal', {
    click: 'mat-card.modal button[type="submit"]',
  });
}

export async function cancelClassForm(page: Page): Promise<void> {
  await act(page, 'Click the "Cancel" button in the class modal', {
    click: 'xpath=//mat-card[contains(@class,"modal")]//button[normalize-space(.)="Cancel"]',
    gone: 'mat-card.modal',
  });
}

export async function rightClickClassCard(page: Page, subjectName: string): Promise<void> {
  await page.evaluate((name: string) => {
    const card = Array.from(document.querySelectorAll<HTMLElement>('.schedule-grid .class-card'))
      .find(c => c.querySelector('.class-name')?.textContent?.trim() === name);
    if (!card) throw new Error(`No hay tarjeta de clase para "${name}"`);
    const rect = card.getBoundingClientRect();
    card.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, button: 2,
      clientX: rect.left + 10, clientY: rect.top + 10,
    }));
  }, subjectName);
  await page.waitForSelector('.context-menu');
}

export async function chooseFromContextMenu(page: Page, option: 'Edit' | 'Delete'): Promise<void> {
  await act(page, `Click the "${option}" button inside the small context menu`, {
    click: `xpath=//div[contains(@class,"context-menu")]//button[normalize-space(.)="${option}"]`,
    ...(option === 'Edit' ? { expect: 'mat-card.modal' } : { gone: '.context-menu' }),
  });
}

export async function openClassFromSchedule(page: Page, subjectName: string): Promise<void> {
  await act(page, `Click the class card "${subjectName}" in the weekly schedule grid`, {
    click: `xpath=(//div[contains(@class,"class-card")][.//div[contains(@class,"class-name")][normalize-space(.)="${subjectName}"]])[1]`,
    expect: 'mat-card.subject-header',
  });
}

export async function openNextClassDetails(page: Page): Promise<void> {
  await act(page, 'Click the "Details" button in the "Your Next Class" card', {
    click: 'section.next-class .next-class-card button', expect: 'mat-card.subject-header',
  });
}

export async function answerNextConfirmWith(page: Page, accept: boolean): Promise<void> {
  await page.evaluate((answer: boolean) => { window.confirm = () => answer; }, accept);
}

export interface ScheduleSnapshot {
  dayHeaders: number;
  cards: Array<{ name: string; professor: string; time: string }>;
  next: { subject: string; professor: string; time: string; emptyMessage: string };
}

function readScheduleOnce(page: Page): Promise<ScheduleSnapshot> {
  return page.evaluate(() => {
    const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const q = (selector: string) => document.querySelector(selector);

    return {
      dayHeaders: document.querySelectorAll('.schedule-grid .header').length,
      cards: Array.from(document.querySelectorAll('.schedule-grid .class-card')).map(card => ({
        name: text(card.querySelector('.class-name')),
        professor: text(card.querySelector('.class-professor')),
        time: text(card.querySelector('.class-time')),
      })),
      next: {
        subject: text(q('section.next-class .next-class-subject')),
        professor: text(q('section.next-class .next-class-professor')),
        time: text(q('section.next-class .next-class-time')),
        emptyMessage: text(q('section.next-class .next-class-empty')),
      },
    };
  });
}

export async function readSchedule(page: Page, quietMs = 1200, timeoutMs = 20_000): Promise<ScheduleSnapshot> {
  const started = Date.now();
  let value = await readScheduleOnce(page);
  let serialized = JSON.stringify(value);
  let since = Date.now();

  while (Date.now() - since < quietMs && Date.now() - started < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 250));
    const next = await readScheduleOnce(page);
    const nextSerialized = JSON.stringify(next);
    if (nextSerialized !== serialized) { value = next; serialized = nextSerialized; since = Date.now(); }
  }
  return value;
}

export async function readModalErrors(page: Page): Promise<string[]> {
  await page.waitForSelector('mat-card.modal mat-error', { state: 'visible', timeout: 4_000 }).catch(() => undefined);
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('mat-card.modal mat-error'))
      .map(e => e.textContent?.replace(/\s+/g, ' ').trim() ?? ''));
}

export function readSubjectHeader(page: Page): Promise<{ name: string; professor: string }> {
  return page.evaluate(() => ({
    name: document.querySelector('mat-card.subject-header mat-card-title')?.textContent?.trim() ?? '',
    professor: document.querySelector('mat-card.subject-header mat-card-subtitle')?.textContent?.trim() ?? '',
  }));
}

export const timeRange = (start: string, end: string) => new RegExp(`^${start}(:00)? - ${end}(:00)?$`);