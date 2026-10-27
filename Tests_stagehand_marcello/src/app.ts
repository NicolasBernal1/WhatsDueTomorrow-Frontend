import { closeTestSession, createTestSession, type TestSession } from './stagehand.js';
import { selectedProvider } from './config.js';

export const APP_URL = process.env.APP_URL ?? 'https://whats-due-tomorrow-frontend.vercel.app';
export const API_URL = process.env.API_URL ?? 'https://whatsduetomorrow-backed.onrender.com';

export type Account = { email: string; password: string; token: string };

/** Crea un usuario nuevo por API (datos deterministas fuera de la IA). */
export async function createAccount(): Promise<Account> {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `sh.${id}@test.com`;
  const password = 'Stagehand#123';
  const reg = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Stagehand Tester', email, password }),
  });
  if (!reg.ok) throw new Error(`Registro falló: ${reg.status} ${await reg.text()}`);
  const login = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body: any = await login.json();
  const token = body?.data?.token ?? body?.token;
  if (!token) throw new Error('Login por API no devolvió token.');
  return { email, password, token };
}

export async function createSubjectApi(
  token: string,
  s: { name: string; professor: string; credits: number },
): Promise<void> {
  const res = await fetch(`${API_URL}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ color: '#3f51b5', ...s }),
  });
  if (!res.ok) throw new Error(`Crear materia falló: ${res.status} ${await res.text()}`);
}

/** Stagehand no trae waitForURL: se consulta page.url() hasta que coincida. */
export async function waitForUrl(session: TestSession, pattern: RegExp, timeoutMs = 60_000): Promise<string> {
  const end = Date.now() + timeoutMs;
  let url = '';
  while (Date.now() < end) {
    url = await session.page.url();
    if (pattern.test(url)) return url;
    await session.page.waitForTimeout(500);
  }
  throw new Error(`La URL no coincidió con ${pattern} tras ${timeoutMs} ms. Última: ${url}`);
}

/**
 * Pide la acción a la IA (act). Si la IA falla (modelo local débil), ejecuta el respaldo
 * directo y lo avisa en la terminal. Con STRICT_AI=true no hay respaldo y la prueba falla.
 */
export async function actOr(
  session: TestSession,
  instruction: string,
  fallback: () => Promise<void>,
  variables?: Record<string, string>,
): Promise<void> {
  let reason = '';
  try {
    const result: any = await session.stagehand.act(instruction, { page: session.page, ...(variables ? { variables } : {}) });
    const ok = result?.data?.success ?? result?.success;
    if (ok === false) reason = `la IA devolvió success:false (${result?.data?.message ?? result?.message ?? ''})`;
  } catch (error) {
    reason = `la IA lanzó un error: ${(error as Error).message.split('\n')[0]}`;
  }
  if (!reason) {
    console.log('  act ✔', instruction);
    return;
  }
  if (process.env.STRICT_AI === 'true') throw new Error(`[IA] "${instruction}" → ${reason}`);
  console.warn(`  [RESPALDO] "${instruction}" → ${reason}. Se hace directo.`);
  await fallback();
}

/** Clic directo en el primer elemento (selector CSS) cuyo texto contiene `text`. */
export async function clickByText(session: TestSession, css: string, text: string): Promise<void> {
  const clicked = await session.page.evaluate(
    (arg: { css: string; text: string }) => {
      const el = Array.from(document.querySelectorAll<HTMLElement>(arg.css)).find((e) =>
        (e.textContent ?? '').includes(arg.text),
      );
      if (!el) return false;
      el.click();
      return true;
    },
    { css, text },
  );
  if (!clicked) throw new Error(`No se encontró "${css}" con el texto "${text}".`);
}

/** Abre sesión de navegador+IA e inicia sesión en la app usando la IA (act). */
export async function loginWithAi(session: TestSession, acc: Account): Promise<void> {
  await session.page.goto(`${APP_URL}/login`);
  // Angular tarda en pintar el formulario: esperar a que exista antes de pedirle algo a la IA.
  await session.page.waitForSelector('input[formcontrolname="email"]', { state: 'visible', timeout: 60_000 });
  await actOr(session, 'Escribe %correo% en el campo de email',
    () => session.page.locator('input[formcontrolname="email"]').fill(acc.email), { correo: acc.email });
  await actOr(session, 'Escribe %clave% en el campo de contraseña',
    () => session.page.locator('input[formcontrolname="password"]').fill(acc.password), { clave: acc.password });
  await actOr(session, 'Haz clic en el botón para iniciar sesión',
    () => session.page.locator('button[type="submit"]').click());
  await waitForUrl(session, /\/(schedule|subjects|assignments|urgent-radar)/);
}

export async function withSession(
  name: string,
  fn: (session: TestSession, provider: string) => Promise<void>,
): Promise<void> {
  const provider = selectedProvider();
  const session = await createTestSession(provider);
  try {
    console.log(`[${provider}] ▶ ${name}`);
    await fn(session, provider);
    console.log(`[${provider}] ✔ ${name}`);
    console.log(`[${provider}] Métricas:`, await session.stagehand.metrics());
  } finally {
    await closeTestSession(session);
  }
}
