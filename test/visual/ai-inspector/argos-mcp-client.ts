import * as https from 'node:https';
import * as fs from 'node:fs';
import * as path from 'node:path';

function loadEnvVisual(): void {
  const envPath = path.resolve(process.cwd(), '.env.visual');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

/**
 * Cliente oficial para comunicarse con el servidor MCP de Argos CI (Model Context Protocol).
 * Endpoint: https://mcp.argos-ci.com/
 * Autenticación: Bearer <Personal Access Token (PAT)>
 */
export interface McpToolCallResult {
  content?: Array<{ type: string; text: string }>;
  structuredContent?: any;
  isError?: boolean;
}

export class ArgosMcpClient {
  private pat: string;
  private endpoint = 'https://mcp.argos-ci.com/';

  constructor(pat?: string) {
    loadEnvVisual();
    this.pat = pat || process.env['ARGOS_PAT'] || process.env['ARGOS_TOKEN'] || '';
    if (!this.pat) {
      throw new Error(
        'ArgosMcpClient: No se proporcionó un token PAT. Configure ARGOS_PAT o ARGOS_TOKEN en las variables de entorno.'
      );
    }
  }

  /**
   * Invoca una herramienta en el servidor MCP de Argos CI mediante JSON-RPC 2.0 sobre HTTP.
   */
  public async callTool(name: string, args: Record<string, any> = {}): Promise<any> {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        this.endpoint,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.pat}`,
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              // Manejo de respuesta SSE o JSON estándar
              const lines = body.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataJson = JSON.parse(line.slice(6));
                  if (dataJson.error) {
                    return reject(new Error(`Error MCP (${dataJson.error.code}): ${dataJson.error.message}`));
                  }
                  if (dataJson.result?.isError) {
                    const errMsg = dataJson.result.content?.[0]?.text || 'Error desconocido en tool MCP';
                    return reject(new Error(`MCP Tool Error: ${errMsg}`));
                  }
                  return resolve(dataJson.result?.structuredContent || dataJson.result);
                }
              }

              // Si es un JSON directo
              if (body.trim().startsWith('{')) {
                const parsed = JSON.parse(body);
                if (parsed.error) {
                  return reject(new Error(`Error MCP: ${parsed.error.message}`));
                }
                return resolve(parsed.result?.structuredContent || parsed.result);
              }

              resolve(body);
            } catch (err: any) {
              reject(new Error(`Fallo al parsear respuesta MCP: ${err.message}. Raw: ${body.slice(0, 300)}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(new Error(`Error de red al conectar con Argos MCP: ${err.message}`)));
      req.write(payload);
      req.end();
    });
  }

  /**
   * Obtiene la cuenta asociada al token PAT.
   */
  public async getAccount(accountSlug: string) {
    return this.callTool('getAccount', { accountSlug });
  }

  /**
   * Lista los proyectos del usuario.
   */
  public async listProjects(accountSlug: string) {
    return this.callTool('listProjects', { accountSlug });
  }

  /**
   * Obtiene detalles de un proyecto específico.
   */
  public async getProject(owner: string, project: string) {
    return this.callTool('getProject', { owner, project });
  }

  /**
   * Lista los builds de un proyecto.
   */
  public async listBuilds(owner: string, project: string) {
    return this.callTool('listBuilds', { owner, project });
  }

  /**
   * Lista las diferencias de capturas (diffs) de un build específico.
   */
  public async listBuildDiffs(owner: string, project: string, buildNumber: string) {
    return this.callTool('listBuildDiffs', { owner, project, buildNumber });
  }

  /**
   * Envía una revisión formal de build (APPROVE o REJECT) con el análisis de causa raíz.
   */
  public async createReview(
    owner: string,
    project: string,
    buildNumber: string,
    event: 'APPROVE' | 'REJECT' | 'COMMENT',
    body: string
  ) {
    return this.callTool('createReview', {
      owner,
      project,
      buildNumber,
      event,
      body,
    });
  }
}

// Ejecución directa de prueba si se llama desde la terminal
if (process.argv[1]?.endsWith('argos-mcp-client.ts')) {
  (async () => {
    try {
      const pat = process.env['ARGOS_PAT'] || process.env['ARGOS_TOKEN'];
      console.log('🤖 Conectando con servidor Argos MCP (https://mcp.argos-ci.com/)...');
      const client = new ArgosMcpClient(pat);
      const account = await client.getAccount('dsanabriagomez9');
      console.log('✅ Conexión exitosa con Argos MCP.');
      console.log(`👤 Usuario: ${account.name} (@${account.slug})`);
      console.log(`📦 Plan: ${account.plan.name} (${account.includedScreenshots} capturas/mes)`);
      
      const projects = await client.listProjects('dsanabriagomez9');
      console.log(`📁 Proyectos registrados (${projects.results.length}):`);
      for (const p of projects.results) {
        console.log(`   - ${p.name} (ID: ${p.id}, Rama Base: ${p.defaultBaseBranch})`);
      }
    } catch (err: any) {
      console.error('❌ Error al ejecutar cliente Argos MCP:', err.message);
      process.exit(1);
    }
  })();
}
