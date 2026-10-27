export function assertIncludes(actual: string, expected: string, message?: string): void {
  if (!actual.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(
      `${message ?? 'Aserción fallida: texto esperado no encontrado.'}\nEsperado: "${expected}"\nActual: "${actual}"`,
    );
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      `${message ?? 'Aserción fallida: valores no coinciden.'}\nEsperado: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`,
    );
  }
}

export function assertTrue(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message ?? 'Aserción fallida: la condición esperaba true pero fue false.');
  }
}

export function assertGreaterOrEqual(actual: number, expected: number, message?: string): void {
  if (actual < expected) {
    throw new Error(
      `${message ?? 'Aserción fallida: número fuera de rango.'}\nEsperado >= ${expected}\nActual: ${actual}`,
    );
  }
}
