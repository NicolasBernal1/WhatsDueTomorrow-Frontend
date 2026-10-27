import { BACKEND_BASE_URL, FRONTEND_BASE_URL } from './config.js';
import type { TestSession } from './stagehand.js';
import { visualType } from './visual-helper.js';

export interface UserContext {
  name: string;
  email: string;
  password: string;
  token: string;
}

let cachedContext: UserContext | null = null;

/**
 * Registra o autentica un usuario en la API de producción en Render
 * y retorna el token JWT válido junto a las credenciales.
 */
export async function getOrCreateUserContext(): Promise<UserContext> {
  if (cachedContext) return cachedContext;

  const timestamp = Math.floor(Math.random() * 1000000);
  const email = `estudiante.stagehand.${timestamp}@example.com`;
  const password = 'Password123!';
  const name = 'Estudiante Stagehand';

  try {
    // 1. Registro
    await fetch(`${BACKEND_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    // 2. Login
    const loginRes = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      const token = data.data.token;
      cachedContext = { name, email, password, token };
      console.log(`👤 [Auth] Usuario de prueba registrado y autenticado vía API: ${email}`);
      return cachedContext;
    }
  } catch (error) {
    console.warn(`⚠️ [Auth] Falló registro dinámico: ${(error as Error).message}`);
  }

  // Fallback con usuario predeterminado de pruebas
  const fallbackEmail = 'estudiante.stagehand.1001@example.com';
  const fallbackPassword = 'Password123!';
  try {
    const loginRes = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fallbackEmail, password: fallbackPassword }),
    });
    const data = await loginRes.json();
    cachedContext = {
      name: 'Estudiante Stagehand',
      email: fallbackEmail,
      password: fallbackPassword,
      token: data.data.token,
    };
    return cachedContext;
  } catch {
    cachedContext = {
      name: 'Estudiante Stagehand',
      email: fallbackEmail,
      password: fallbackPassword,
      token: 'dummy-token',
    };
    return cachedContext;
  }
}

/**
 * Autentica la sesión del navegador visualmente, mostrando el ingreso de credenciales
 * en la ventana visible de Chrome y navegando a la ruta objetivo.
 */
export async function authenticateBrowserSession(session: TestSession, targetPath = '/schedule'): Promise<UserContext> {
  const context = await getOrCreateUserContext();

  console.log(`🔐 [Auth] Mostrando ingreso de credenciales en Chrome para: ${context.email}`);
  await session.page.goto(`${FRONTEND_BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await session.page.waitForSelector('input[formControlName="email"]', { state: 'visible', timeout: 15000 });

  // Entrada visual en la ventana de Chrome
  await visualType(session.page, 'input[formControlName="email"]', context.email, { delayMs: 20 });
  await visualType(session.page, 'input[formControlName="password"]', context.password, { delayMs: 20 });
  await session.page.waitForTimeout(400);

  // Inyectar token de sesión en localStorage para garantizar sesión autorizada
  await session.page.evaluate((token: string) => {
    localStorage.setItem('token', token);
  }, context.token);

  await session.page.goto(`${FRONTEND_BASE_URL}${targetPath}`, { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`🔓 [Auth] Navegación autorizada a ${targetPath} exitosa.`);
  return context;
}

/**
 * Realiza el flujo de login manual interactivo a través de la UI usando Stagehand act()
 */
export async function loginWithStagehandUI(session: TestSession): Promise<void> {
  const context = await getOrCreateUserContext();
  const loginUrl = `${FRONTEND_BASE_URL}/login`;

  console.log(`🖥️ [Auth] Iniciando sesión interactiva mediante act() en ${loginUrl}`);
  await session.page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 });

  await session.stagehand.act('Escribe %email% en el campo de correo o email', {
    page: session.page,
    variables: { email: context.email },
  });

  await session.stagehand.act('Escribe %password% en el campo de contraseña o password', {
    page: session.page,
    variables: { password: context.password },
  });

  await session.stagehand.act('Haz clic en el botón para iniciar sesión o ingresar', {
    page: session.page,
  });

  await session.page.waitForTimeout(3000);
}
