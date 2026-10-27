import type { ClientLLM } from '@browserbasehq/stagehand';

type GenerateInput = Parameters<ClientLLM['generate']>[0];
type GenerateOutput = Awaited<ReturnType<ClientLLM['generate']>>;

type OllamaResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function cleanJsonText(raw: string): string {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1);
  }
  return trimmed;
}

/**
 * Normaliza cualquier propiedad elementId para que cumpla con el patrón estricto
 * de Stagehand (/^\d+-\d+$/). Los modelos locales tienden a responder con
 * etiquetas completas como "[0-135] button: Click me", "button: Copy link",
 * o simplemente "135" en lugar de "0-135".
 */
function normalizeElementIds(obj: any, contextText?: string): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeElementIds(item, contextText));
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'elementId') {
      let resolvedId = '';
      if (typeof value === 'string') {
        const matchPair = value.match(/(\d+-\d+)/);
        if (matchPair && matchPair[1]) {
          resolvedId = matchPair[1];
        } else {
          const matchSingle = value.match(/(\d+)/);
          if (matchSingle && matchSingle[1]) {
            resolvedId = `0-${matchSingle[1]}`;
          }
        }
      } else if (typeof value === 'number') {
        resolvedId = `0-${value}`;
      }

      // Si aún no cumple el patrón /^\d+-\d+$/ y tenemos el texto del prompt con el árbol de accesibilidad
      if (!/^\d+-\d+$/.test(resolvedId) && contextText) {
        const candidatePhrases: string[] = [];
        if (typeof value === 'string' && value.trim()) {
          candidatePhrases.push(value.replace(/^(button|link|input|textbox|checkbox|combobox):\s*/i, '').trim());
        }
        if (obj.description && typeof obj.description === 'string' && obj.description.trim()) {
          candidatePhrases.push(obj.description.replace(/^(button|link|input|textbox|checkbox|combobox):\s*/i, '').trim());
        }

        for (const phrase of candidatePhrases) {
          if (phrase.length >= 2) {
            const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Buscar un elemento en el árbol de accesibilidad que contenga la frase
            const treeMatch = contextText.match(new RegExp(`\\[(\\d+-\\d+)\\][^\\[\\n]*?${escaped}`, 'i'));
            if (treeMatch && treeMatch[1]) {
              resolvedId = treeMatch[1];
              break;
            }
          }
        }
      }

      result[key] = /^\d+-\d+$/.test(resolvedId) ? resolvedId : value;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = normalizeElementIds(value, contextText);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function contentAsText(content: GenerateInput['messages'][number]['content']): string {
  const blocks = Array.isArray(content) ? content : [content];
  return blocks
    .map((block) => {
      if (block.type === 'text') return block.text;
      if (block.type === 'image') return `[Imagen ${block.mimeType} omitida del mensaje]`;
      if (block.type === 'tool_use') return JSON.stringify({ tool: block.name, input: block.input });
      return JSON.stringify({ toolResult: block.toolUseId, content: block.content });
    })
    .join('\n');
}

export function createOllamaClient(): ClientLLM {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1').replace(/\/$/, '');
  const apiKey = process.env.OLLAMA_API_KEY ?? 'ollama';
  const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';

  const generate = async (input: GenerateInput): Promise<GenerateOutput> => {
    const responseFormat = input.responseFormat ?? { type: 'text' as const };
    const isActionOrObservation =
      responseFormat.type === 'json_schema' &&
      JSON.stringify(responseFormat.schema).includes('elementId');

    let additionalHint = '';
    if (isActionOrObservation) {
      additionalHint = '\n\nIMPORTANT: If the user wants to type or enter text into an input/textbox, set method to "type", arguments to [the text to type], and elementId to the input\'s ID. If the user wants to click a button, link, or checkbox, set method to "click", arguments to [], and elementId to the matching ID. Always format elementId strictly as digits with hyphen (e.g. "0-123").';
    } else if (responseFormat.type === 'json_schema') {
      additionalHint = '\n\nIMPORTANT: For extraction, extract the actual textual content, values, and words displayed on the page, NOT element IDs or bracketed numbers.';
    }

    const systemContent = input.systemPrompt
      ? `${input.systemPrompt}${additionalHint}`
      : additionalHint
        ? additionalHint.trim()
        : undefined;

    const messages = [
      ...(systemContent ? [{ role: 'system' as const, content: systemContent }] : []),
      ...input.messages.map((message) => ({
        role: message.role,
        content: contentAsText(message.content),
      })),
    ];
    const fullContextText = messages.map((m) => m.content).join('\n');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: input.temperature ?? 0,
        stream: false,
        ...(responseFormat.type === 'json_schema'
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: responseFormat.name,
                  schema: responseFormat.schema,
                  strict: true,
                },
              },
            }
          : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama respondió ${response.status}: ${await response.text()}`);
    }

    const result = (await response.json()) as OllamaResponse;
    const text = result.choices?.[0]?.message?.content;
    if (!text) throw new Error('Ollama no devolvió contenido.');

    console.log(`\n🤖 [Ollama-DEBUG] Response text: ${text}`);

    const usage = result.usage
      ? {
          inputTokens: result.usage.prompt_tokens ?? 0,
          outputTokens: result.usage.completion_tokens ?? 0,
          totalTokens: result.usage.total_tokens ?? 0,
        }
      : undefined;

    if (responseFormat.type === 'json_schema') {
      const cleaned = cleanJsonText(text);
      let parsed = JSON.parse(cleaned);
      parsed = normalizeElementIds(parsed, fullContextText);
      console.log(`🤖 [Ollama-DEBUG] Normalized JSON: ${JSON.stringify(parsed)}\n`);
      const normalizedText = JSON.stringify(parsed);

      return {
        role: 'assistant',
        content: { type: 'text', text: normalizedText },
        outputFormat: 'json_schema',
        structuredContent: parsed,
        usage,
      };
    }

    return {
      role: 'assistant',
      content: { type: 'text', text },
      outputFormat: 'text',
      usage,
    };
  };

  return { generate };
}
