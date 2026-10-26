import Groq from 'groq-sdk';

/**
 * ========================================================================
 * ⚡ NORA & VALEN SOBERANOS - CLIENTE DE ALTO RENDIMIENTO GROQ SDK
 * Ubicación: src/lib/nora/groqClient.ts
 *
 * Utiliza Llama 3.3 70B Versatile con auto-failover a Llama 3.1 8B Instant,
 * soporte de pool multi-llave y gestión de concurrencia para soportar
 * cientos de interacciones simultáneas sin caídas ni errores 429.
 * ========================================================================
 */

function getGroqKeyPool(): string[] {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_FALLBACK,
    process.env.GROQ_API_KEY_FALLBACK_2,
    process.env.GROQ_API_KEY_2,
  ]
    .filter(Boolean)
    .map(k => (k || '').replace(/['"\r\n\t ]/g, '').trim())
    .filter(k => k.length > 10);

  return keys;
}

const clientPool: Map<string, Groq> = new Map();

function getClientForKey(key: string): Groq {
  let client = clientPool.get(key);
  if (!client) {
    client = new Groq({ apiKey: key });
    clientPool.set(key, client);
  }
  return client;
}

export function getGroqClient(): Groq | null {
  const keys = getGroqKeyPool();
  if (keys.length === 0) return null;
  return getClientForKey(keys[0]);
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqExecutionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
  retries?: number;
}

export async function executeGroqChat(
  messages: ChatMessage[],
  options: GroqExecutionOptions = {}
): Promise<{ text: string; model: string } | null> {
  const keys = getGroqKeyPool();
  if (keys.length === 0) return null;

  const candidateModels = [
    options.model || 'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
  ];

  // Recorrer todas las llaves disponibles y modelos candidatos
  for (const currentKey of keys) {
    const groq = getClientForKey(currentKey);

    for (const model of candidateModels) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? 1200,
          response_format: options.responseFormat,
        });

        const text = response.choices?.[0]?.message?.content;
        if (text) {
          return { text, model };
        }
      } catch (err: any) {
        const isRateLimit = err?.status === 429 || err?.message?.includes('rate_limit') || err?.message?.includes('429');
        if (isRateLimit) {
          console.warn(`[Groq SDK RateLimit 429] Modelo ${model} saturado bajo alta concurrencia. Conmutando de inmediato a 8B Instant.`);
          continue;
        } else {
          console.warn(`[Groq SDK Warning] Falló modelo ${model}:`, err?.message || err);
        }
      }
    }
  }

  return null;
}

