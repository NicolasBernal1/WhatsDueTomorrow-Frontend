export type Provider = 'openai' | 'gemini' | 'ollama';

export function envBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} debe ser true o false; se recibió: ${value}`);
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.includes('your-key-here')) {
    throw new Error(
      `Falta ${name}. Copie .env.example como .env y configure el valor antes de ejecutar esta prueba.`,
    );
  }
  return value;
}

export function selectedProvider(): Provider {
  const value = (process.env.AI_PROVIDER ?? 'ollama').toLowerCase();
  if (value === 'openai' || value === 'gemini' || value === 'ollama') return value;
  throw new Error('AI_PROVIDER debe ser openai, gemini u ollama.');
}
