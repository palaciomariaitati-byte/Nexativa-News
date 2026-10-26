import Groq from 'groq-sdk';

/**
 * ========================================================================
 * ⚡ NORA & VALEN SOBERANOS - CLIENTE DE ALTO RENDIMIENTO GROQ SDK
 * Ubicación: src/lib/nora/groqClient.ts
 *
 * Utiliza Llama 3.3 70B Versatile con latencias <300ms y cuota masiva.
 * ========================================================================
 */

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq | null {
  const rawKey = process.env.GROQ_API_KEY;
  if (!rawKey) return null;
  const cleanKey = rawKey.replace(/['"\r\n\t ]/g, '').trim();
  if (!cleanKey) return null;

  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: cleanKey });
  }
  return groqInstance;
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
}

export async function executeGroqChat(
  messages: ChatMessage[],
  options: GroqExecutionOptions = {}
): Promise<{ text: string; model: string } | null> {
  const groq = getGroqClient();
  if (!groq) return null;

  const candidateModels = [
    options.model || 'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
  ];

  for (const model of candidateModels) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 2500,
        response_format: options.responseFormat,
      });

      const text = response.choices?.[0]?.message?.content;
      if (text) {
        return { text, model };
      }
    } catch (err: any) {
      console.warn(`[Groq SDK Warning] Falló modelo ${model}:`, err?.message || err);
    }
  }

  return null;
}
