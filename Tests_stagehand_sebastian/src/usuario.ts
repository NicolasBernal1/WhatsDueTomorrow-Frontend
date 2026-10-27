import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'zod';
import { actOr, API_URL, APP_URL, withSession } from './app.js';
import type { TestSession } from './stagehand.js';

/** Paso registrado en la evidencia de una prueba. */
type Paso = {
  paso: number;
  tipo: 'act' | 'observe' | 'extract' | 'validación';
  instruccion: string;
  resultado: unknown;
  ok: boolean;
  captura?: string;
  ms?: number;
};

const slug = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/**
 * Envuelve act / observe / extract de Stagehand: cada llamada guarda una captura y su resultado,
 * y las validaciones quedan registradas. Al final escribe reporte.json y reporte.md en artifacts/usuario/.
 */
export class Evidencia {
  readonly dir: string;
  private pasos: Paso[] = [];
  private inicio = Date.now();

  constructor(readonly prueba: string, private readonly s: TestSession) {
    this.dir = join('artifacts', 'usuario', `${slug(prueba)}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    mkdirSync(this.dir, { recursive: true });
  }

  private async captura(etiqueta: string): Promise<string> {
    const file = `${String(this.pasos.length + 1).padStart(2, '0')}-${slug(etiqueta)}.png`;
    await this.s.page.screenshot({ path: join(this.dir, file), fullPage: true });
    return file;
  }

  private registrar(p: Omit<Paso, 'paso'>): void {
    this.pasos.push({ paso: this.pasos.length + 1, ...p });
    console.log(`  ${p.ok ? '✔' : '✘'} [${p.tipo}] ${p.instruccion}`);
  }

  /**
   * act: la IA ejecuta la acción. Igual que actOr de Marcello: si el modelo local falla se usa
   * el respaldo directo (con STRICT_AI=true no hay respaldo). La evidencia dice quién la hizo.
   * Los valores sensibles van en `variables` (%nombre%) y nunca llegan al modelo.
   */
  async act(instruccion: string, respaldo: () => Promise<unknown>, variables?: Record<string, string>): Promise<void> {
    const t = Date.now();
    let ejecutadoPor = 'IA';
    await actOr(this.s, instruccion, async () => { ejecutadoPor = 'respaldo'; await respaldo(); }, variables);
    this.registrar({
      tipo: 'act', instruccion, ok: true, ms: Date.now() - t, resultado: { ejecutadoPor },
      captura: await this.captura(`act ${instruccion}`),
    });
  }

  /** observe: la IA localiza elementos sin actuar. Exige al menos `minimo` resultados. */
  async observe(instruccion: string, minimo = 1) {
    const t = Date.now();
    const r = await this.s.stagehand.observe(instruccion, { page: this.s.page });
    const ok = r.data.length >= minimo;
    this.registrar({
      tipo: 'observe', instruccion, ok, ms: Date.now() - t, captura: await this.captura(`observe ${instruccion}`),
      resultado: r.data.map((e) => ({ descripcion: e.description, selector: e.selector })),
    });
    if (!ok) throw new Error(`observe encontró ${r.data.length} elemento(s), se esperaban al menos ${minimo}: "${instruccion}"`);
    return r.data;
  }

  /** extract: la IA lee datos estructurados de la página según un esquema zod. */
  async extract<S extends z.ZodType>(instruccion: string, esquema: S): Promise<z.output<S>> {
    const t = Date.now();
    const r = await this.s.stagehand.extract(instruccion, esquema, { page: this.s.page });
    this.registrar({
      tipo: 'extract', instruccion, ok: true, ms: Date.now() - t, resultado: r.data,
      captura: await this.captura(`extract ${instruccion}`),
    });
    return r.data;
  }

  /** Validación determinista (el código, no la IA, decide si la prueba pasa). */
  check(nombre: string, ok: boolean, detalle: unknown): void {
    this.registrar({ tipo: 'validación', instruccion: nombre, ok, resultado: detalle });
    if (!ok) throw new Error(`Validación fallida: ${nombre} → ${JSON.stringify(detalle)}`);
  }

  async guardar(estado: 'APROBADA' | 'FALLIDA', error?: unknown): Promise<void> {
    if (estado === 'FALLIDA') await this.captura('fallo').catch(() => undefined);
    const reporte = {
      prueba: this.prueba,
      estado,
      error: error ? String((error as Error).message ?? error) : undefined,
      modelo: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b',
      app: APP_URL,
      fecha: new Date().toISOString(),
      duracionSeg: Math.round((Date.now() - this.inicio) / 1000),
      metricas: await this.s.stagehand.metrics().catch(() => undefined),
      pasos: this.pasos,
    };
    writeFileSync(join(this.dir, 'reporte.json'), JSON.stringify(reporte, null, 2));
    const filas = this.pasos.map((p) =>
      `| ${p.paso} | ${p.tipo} | ${p.instruccion.replace(/\|/g, '/')} | ${p.ok ? '✔' : '✘'} | ${JSON.stringify(p.resultado).replace(/\|/g, '/').slice(0, 160)} | ${p.captura ? `![](${p.captura})` : ''} |`);
    writeFileSync(join(this.dir, 'reporte.md'), [
      `# ${this.prueba} — ${estado}`, '',
      `Fecha: ${reporte.fecha} · Modelo: Ollama ${reporte.modelo} · Duración: ${reporte.duracionSeg} s`, '',
      ...(reporte.error ? [`**Error:** ${reporte.error}`, ''] : []),
      '| # | Tipo | Instrucción / validación | OK | Resultado | Captura |', '|---|---|---|---|---|---|', ...filas, '',
    ].join('\n'));
    console.log(`  Evidencia: ${this.dir}/reporte.md`);
  }
}

/** Abre navegador + IA, ejecuta la prueba y siempre guarda la evidencia (pase o falle). */
export function conEvidencia(nombre: string, fn: (s: TestSession, ev: Evidencia) => Promise<void>): Promise<void> {
  return withSession(nombre, async (s) => {
    // Stagehand v4 no expone diálogos: se reemplaza alert() para que no bloquee y quede registrado.
    await s.page.addInitScript(() => {
      (window as any).__alerts = [];
      window.alert = (m?: unknown) => { (window as any).__alerts.push(String(m)); };
    });
    const ev = new Evidencia(nombre, s);
    try {
      await fn(s, ev);
      await ev.guardar('APROBADA');
    } catch (error) {
      await ev.guardar('FALLIDA', error);
      throw error;
    }
  });
}

// ── Preparación de datos por API (fuera de la IA, para que la prueba sea determinista) ──

async function api(method: string, url: string, body?: unknown, token?: string) {
  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined };
}

export const loginStatus = async (email: string, password: string) => (await api('POST', '/auth/login', { email, password })).status;

export const perfilApi = async (token: string) => (await api('GET', '/users/profile', undefined, token)).body?.data;

/** Crea una tarea que vence dentro de `horas` horas en la materia `materia` (ya creada). */
export async function createAssignmentApi(token: string, materia: string, title: string, horas: number): Promise<void> {
  const subjects = await api('GET', '/subjects', undefined, token);
  const id = subjects.body?.data?.find((s: any) => s.name === materia)?.id;
  if (!id) throw new Error(`La materia "${materia}" no existe`);
  const res = await api('POST', `/assignments/subject/${id}`, { title, dueDate: new Date(Date.now() + horas * 3_600_000).toISOString() }, token);
  if (res.status !== 201) throw new Error(`Crear tarea falló: ${res.status}`);
}

/** Inicia sesión dejando el token en localStorage (la IA se reserva para la funcionalidad bajo prueba). */
export async function sesionConToken(s: TestSession, token: string): Promise<void> {
  await s.page.goto(`${APP_URL}/login`);
  await s.page.evaluate((t: string) => localStorage.setItem('token', t), token);
  await s.page.goto(`${APP_URL}/schedule`);
  await s.page.waitForSelector('mat-toolbar', { state: 'visible', timeout: 60_000 });
}

export const tokenGuardado = (s: TestSession) => s.page.evaluate(() => localStorage.getItem('token'));
export const alertas = (s: TestSession) => s.page.evaluate(() => ((window as any).__alerts ?? []) as string[]);
export const deshabilitado = (s: TestSession, selector: string) =>
  s.page.evaluate((sel: string) => (document.querySelector(sel) as HTMLButtonElement | null)?.disabled ?? null, selector);

/** Selectores de los campos y botones de F01–F06, usados por los respaldos de act. */
export const campo = (nombre: 'name' | 'email' | 'password') => `input[formcontrolname="${nombre}"]`;
export const CAMPANA = 'button[aria-label="Upcoming assignments"]';
export const CLAVE_PERFIL = '.password-section input[type="password"]';