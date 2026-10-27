import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Page } from '@browserbasehq/stagehand';

const REPORTS_DIR = path.resolve(process.cwd(), 'reports');
const SCREENSHOTS_DIR = path.resolve(REPORTS_DIR, 'screenshots');
const METRICS_FILE = path.resolve(REPORTS_DIR, 'execution-metrics.json');

export interface TestMetricRecord {
  testName: string;
  provider: string;
  timestamp: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED';
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inferenceTimeMs?: number;
  error?: string;
}

export function ensureEvidenceDirs(): void {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

export async function captureScreenshot(page: Page, testName: string, stepName: string): Promise<string> {
  ensureEvidenceDirs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName}_${stepName}_${timestamp}.png`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filepath = path.join(SCREENSHOTS_DIR, filename);

  try {
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 [Evidencia] Captura guardada: ${path.relative(process.cwd(), filepath)}`);
    return filepath;
  } catch (err) {
    console.warn(`⚠️ [Evidencia] No fue posible capturar pantalla: ${(err as Error).message}`);
    return '';
  }
}

export function extractTokensFromMetrics(metrics: any): { promptTokens: number; completionTokens: number; totalTokens: number; inferenceTimeMs: number } {
  const promptTokens = (metrics?.actPromptTokens ?? 0) + (metrics?.extractPromptTokens ?? 0);
  const completionTokens = (metrics?.actCompletionTokens ?? 0) + (metrics?.extractCompletionTokens ?? 0);
  const totalTokens = promptTokens + completionTokens;
  const inferenceTimeMs = metrics?.totalInferenceTimeMs ?? 0;
  return { promptTokens, completionTokens, totalTokens, inferenceTimeMs };
}

export function saveMetricsRecord(record: TestMetricRecord): void {
  ensureEvidenceDirs();
  let metrics: TestMetricRecord[] = [];

  if (fs.existsSync(METRICS_FILE)) {
    try {
      const content = fs.readFileSync(METRICS_FILE, 'utf-8');
      metrics = JSON.parse(content);
    } catch {
      metrics = [];
    }
  }

  metrics.push(record);
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
  console.log(`📊 [Métricas] Registro guardado en ${path.relative(process.cwd(), METRICS_FILE)}`);
}
