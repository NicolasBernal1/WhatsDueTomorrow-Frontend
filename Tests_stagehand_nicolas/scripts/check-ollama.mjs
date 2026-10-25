import { config } from 'dotenv';
config();

const base = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/api').replace(/\/$/, '');
const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';

try {
  const response = await fetch(`${base}/tags`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { models = [] } = await response.json();
  const names = models.map(m => m.name);
  const found = names.some(n => n === model || n === `${model}:latest`);

  if (!found) {
    console.error(`Ollama esta funcionando pero falta el modelo "${model}".\nModelos instalados: ${names.join(', ') || '(ninguno)'}`);
    process.exit(1);
  }
  console.log(`OK: Ollama responde en ${base} y el modelo "${model}" esta disponible.`);
} catch (error) {
  console.error(`No se pudo contactar a Ollama en ${base}: ${error.message}\nInicia el servicio con:  ollama serve`);
  process.exit(1);
}
