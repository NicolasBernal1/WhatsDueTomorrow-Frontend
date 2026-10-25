import { AvailableModel, CreateChatCompletionOptions, LLMClient } from '@browserbasehq/stagehand';
import { generateObject, generateText, LanguageModel } from 'ai';
import { createOllama } from 'ollama-ai-provider';

import { env } from './env';

function fixElementIds(value: any): any {
  if (Array.isArray(value)) return value.map(fixElementIds);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => {
      if (key === 'elementId' && typeof v === 'string') {
        const id = v.replace(/[\[\]\s]/g, '');
        return [key, /^\d+$/.test(id) ? `0-${id}` : id];
      }
      return [key, fixElementIds(v)];
    }));
  }
  return value;
}

export class OllamaClient extends LLMClient {
  public type = 'aisdk' as const;
  private readonly model: LanguageModel;

  constructor(model: LanguageModel) {
    super(model.modelId as AvailableModel);
    this.model = model;
  }

  async createChatCompletion<T = any>({ options }: CreateChatCompletionOptions): Promise<T> {
    const messages: any[] = options.messages.map((message: any) => {
      if (Array.isArray(message.content)) {
        if (message.role === 'system') {
          return { role: 'system', content: message.content.map((c: any) => c.text).join('\n') };
        }
        const parts = message.content.map((c: any) =>
          c.type === 'image_url'
            ? { type: 'image', image: c.image_url.url }
            : { type: 'text', text: c.text },
        );
        return { role: message.role, content: parts };
      }
      return { role: message.role, content: message.content };
    });

    if (options.response_model) {
      const response = await generateObject({
        model: this.model,
        messages,
        schema: options.response_model.schema,
        temperature: 0,
      });
      return {
        data: fixElementIds(response.object),
        usage: {
          prompt_tokens: response.usage?.promptTokens ?? 0,
          completion_tokens: response.usage?.completionTokens ?? 0,
          total_tokens: response.usage?.totalTokens ?? 0,
        },
      } as T;
    }

    const response = await generateText({ model: this.model, messages, temperature: 0 });
    return {
      data: response.text,
      usage: {
        prompt_tokens: response.usage?.promptTokens ?? 0,
        completion_tokens: response.usage?.completionTokens ?? 0,
        total_tokens: response.usage?.totalTokens ?? 0,
      },
    } as T;
  }
}

export function ollamaClient(): OllamaClient {
  const ollama = createOllama({ baseURL: env.ollamaBaseUrl });
  return new OllamaClient(ollama(env.ollamaModel, { structuredOutputs: true }));
}
