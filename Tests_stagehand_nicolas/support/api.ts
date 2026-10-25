import { env } from './env';
import { Weekday } from './weekdays';

const unaccented = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export interface Credentials { email: string; password: string }

async function call<T = any>(method: string, url: string, body?: unknown, token?: string): Promise<{ status: number; body: T }> {
  const response = await fetch(`${env.apiUrl}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: (text ? JSON.parse(text) : undefined) as T };
}

export class Student {
  private subjectIds = new Map<string, number>();

  private constructor(readonly name: string, readonly credentials: Credentials, private token: string) {}

  static async register(name: string): Promise<Student> {
    const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
    const credentials = {
      email: `sh.${unaccented(name).toLowerCase()}.${unique}@test.com`,
      password: 'Clave123',
    };

    const registered = await call('POST', '/auth/register', { name, ...credentials });
    if (registered.status !== 201) throw new Error(`POST /auth/register respondio ${registered.status}`);

    const login = await call<{ data: { token: string } }>('POST', '/auth/login', credentials);
    if (login.status !== 201) throw new Error(`POST /auth/login respondio ${login.status}`);

    return new Student(name, credentials, login.body.data.token);
  }

  async hasSubject(name: string, professor: string): Promise<void> {
    const created = await call('POST', '/subjects', { name, professor, credits: 3 }, this.token);
    if (created.status !== 201) throw new Error(`POST /subjects respondio ${created.status}`);

    const list = await call<{ data: Array<{ id: number; name: string }> }>('GET', '/subjects', undefined, this.token);
    const subject = list.body.data.find(s => s.name === name);
    if (!subject) throw new Error(`La asignatura "${name}" no aparece en GET /subjects`);
    this.subjectIds.set(name, subject.id);
  }

  async hasClass(subjectName: string, dayOfWeek: Weekday, startTime: string, endTime: string): Promise<void> {
    const subjectId = this.subjectIds.get(subjectName);
    if (subjectId === undefined) throw new Error(`Primero crea la asignatura "${subjectName}"`);

    const created = await call('POST', '/subjects/classes', { dayOfWeek, startTime, endTime, subjectId }, this.token);
    if (created.status !== 201) throw new Error(`POST /subjects/classes respondio ${created.status}`);
  }

  async classes(): Promise<Array<{ id: number; dayOfWeek: string; startTime: string; endTime: string }>> {
    const list = await call<{ data: any[] }>('GET', '/subjects/classes', undefined, this.token);
    return list.body.data ?? [];
  }
  
  async cleanUp(): Promise<void> {
    for (const c of await this.classes()) await call('DELETE', `/subjects/classes/${c.id}`, undefined, this.token);
    const subjects = await call<{ data: Array<{ id: number }> }>('GET', '/subjects', undefined, this.token);
    for (const s of subjects.body.data ?? []) await call('DELETE', `/subjects/${s.id}`, undefined, this.token);
  }
}
