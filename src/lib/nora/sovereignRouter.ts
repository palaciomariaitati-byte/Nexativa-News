/**
 * ========================================================================
 * 🏛️ NORA TITÁN - ROUTER MULTIMODAL SOBERANO (SOVEREIGN ROUTER)
 * Ubicación: /src/lib/nora/sovereignRouter.ts
 * 
 * Despachador de inferencia abierta y pesos libres (Open Source / Open Weights)
 * a Costo $0 con 4 capas de resiliencia descentralizada:
 *   1. Capa 1: Cloudflare Workers AI (@cf/meta/llama-3.2-11b-vision-instruct / llama-3.3-70b)
 *   2. Capa 2: Hugging Face Serverless (Qwen/Qwen2.5-VL-7B-Instruct / DeepSeek-R1)
 *   3. Capa 3: OpenRouter Free Open Mesh (Modelos :free comunitarios)
 *   4. Capa 4: Ollama Local / VPS Bridge (Inmunidad total a caídas de red)
 * ========================================================================
 */

import { NORA_CONSTITUTIONAL_AXIOMS } from "@/lib/nora/constitutionalShield";

export interface SovereignMessage {
  role: "system" | "user" | "assistant";
  content: string | SovereignContentPart[];
}

export interface SovereignContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

export interface SovereignFileAttachment {
  name?: string;
  mimeType?: string;
  base64?: string;
  url?: string;
  storage_url?: string;
  textContent?: string;
}

export interface SovereignRouterParams {
  history?: { role: string; content: string }[];
  userMessage: string;
  systemPrompt?: string;
  file?: SovereignFileAttachment | null;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string | null;
}

/**
 * Normaliza y formatea el archivo adjunto (Base64 o URL remota de Supabase)
 * a un Data URL estandarizado para los modelos de visión de código abierto.
 */
function prepareImageDataUrl(file: SovereignFileAttachment): string | null {
  if (file.base64) {
    const mime = file.mimeType?.split(";")[0].trim() || "image/jpeg";
    const cleanB64 = file.base64.includes(",") ? file.base64.split(",")[1] : file.base64;
    return `data:${mime};base64,${cleanB64}`;
  }
  if (file.storage_url || file.url) {
    return file.storage_url || file.url || null;
  }
  return null;
}

/**
 * Ensambla el array de mensajes respetando la Constitución de Nora
 * y formateando el contenido multimodal para APIs compatibles con OpenAI/Qwen/Llama.
 */
function assembleMessages(
  history: { role: string; content: string }[] = [],
  userMessage: string,
  systemPrompt: string = "",
  imageDataUrl: string | null = null,
  fileTextContent?: string
): SovereignMessage[] {
  const fullSystemPrompt = `${NORA_CONSTITUTIONAL_AXIOMS}\n\n${systemPrompt}`.trim();

  const messages: SovereignMessage[] = [
    { role: "system", content: fullSystemPrompt }
  ];

  for (const h of history) {
    messages.push({
      role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
      content: h.content
    });
  }

  let finalUserContent: string | SovereignContentPart[] = userMessage;

  if (imageDataUrl) {
    finalUserContent = [
      {
        type: "text",
        text: userMessage || "Analiza detalladamente esta imagen, describe lo que ves y ofrece una explicación clara, útil y educativa."
      },
      {
        type: "image_url",
        image_url: { url: imageDataUrl }
      }
    ];
  } else if (fileTextContent) {
    finalUserContent = `[DOCUMENTO ADJUNTO]:\n${fileTextContent.slice(0, 12000)}\n\n[CONSULTA DEL USUARIO]:\n${userMessage || "Analiza el documento adjunto."}`;
  }

  messages.push({
    role: "user",
    content: finalUserContent
  });

  return messages;
}

/**
 * CAPA 4: Ollama Local / VPS Bridge (Servidor Propio Offline)
 */
async function tryOllamaLocal(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const ollamaHost = process.env.LOCAL_OLLAMA_URL || process.env.OLLAMA_HOST;
  if (!ollamaHost) return null;

  const endpoint = `${ollamaHost.replace(/\/+$/, "")}/v1/chat/completions`;
  const preferredModel = isVision
    ? (process.env.OLLAMA_VISION_MODEL || "qwen2.5-vl")
    : (process.env.OLLAMA_TEXT_MODEL || "llama3.3");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: preferredModel,
        messages,
        stream: true,
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok && res.body) {
      console.log(`[Sovereign Router]: Éxito con Nodo Local Ollama (${preferredModel})`);
      return res.body;
    }
  } catch (err) {
    console.warn("[Sovereign Router - Ollama Local]:", err);
  }
  return null;
}

/**
 * CAPA 1: Cloudflare Workers AI (Edge Ingestion)
 */
async function tryCloudflareWorkersAI(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;

  const modelName = isVision
    ? "@cf/meta/llama-3.2-11b-vision-instruct"
    : "@cf/meta/llama-3.3-70b-instruct";

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: true,
        max_tokens: 3000
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (res.ok && res.body) {
      console.log(`[Sovereign Router]: Éxito con Cloudflare Workers AI (${modelName})`);
      return res.body;
    }
  } catch (err) {
    console.warn("[Sovereign Router - Cloudflare AI]:", err);
  }
  return null;
}

/**
 * CAPA 2: Hugging Face Serverless Inference (Open Source Hub)
 */
async function tryHuggingFaceInference(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) return null;

  const candidateModels = isVision
    ? ["Qwen/Qwen2.5-VL-7B-Instruct", "meta-llama/Llama-3.2-11B-Vision-Instruct"]
    : ["deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", "meta-llama/Llama-3.3-70B-Instruct", "Qwen/Qwen2.5-72B-Instruct"];

  for (const model of candidateModels) {
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          max_tokens: 3500,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router]: Éxito con Hugging Face (${model})`);
        return res.body;
      }
    } catch (err) {
      console.warn(`[Sovereign Router - HF ${model}]:`, err);
    }
  }
  return null;
}

/**
 * CAPA 3: OpenRouter Free Mesh (Modelos Libres de Costo :free)
 */
async function tryOpenRouterFree(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return null;

  const freeModels = isVision
    ? [
        "qwen/qwen-2.5-vl-72b-instruct:free",
        "google/gemini-2.0-flash-lite-preview:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free"
      ]
    : [
        "deepseek/deepseek-r1:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "mistralai/mistral-small-24b-instruct-2501:free"
      ];

  for (const model of freeModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey.trim()}`,
          "HTTP-Referer": "https://nexativanews.com.ar",
          "X-Title": "Nora Titán Sovereign AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router]: Éxito con OpenRouter Free (${model})`);
        return res.body;
      }
    } catch (err) {
      console.warn(`[Sovereign Router - OpenRouter ${model}]:`, err);
    }
  }
  return null;
}

/**
 * DESPACHADOR PRINCIPAL (DISPATCHER)
 * Ejecuta la cascada soberana a través de las 4 capas abiertas.
 */
export async function dispatchSovereignInference(params: SovereignRouterParams): Promise<Response | null> {
  const {
    history = [],
    userMessage,
    systemPrompt = "",
    file = null,
    sessionId = null
  } = params;

  const imageDataUrl = file ? prepareImageDataUrl(file) : null;
  const isVision = Boolean(imageDataUrl);
  const messages = assembleMessages(history, userMessage, systemPrompt, imageDataUrl, file?.textContent);

  // 1. Intentar Capa 4: Nodo Local / VPS Propio si está configurado
  let stream = await tryOllamaLocal(messages, isVision);

  // 2. Intentar Capa 1: Cloudflare Workers AI
  if (!stream) {
    stream = await tryCloudflareWorkersAI(messages, isVision);
  }

  // 3. Intentar Capa 2: Hugging Face Serverless
  if (!stream) {
    stream = await tryHuggingFaceInference(messages, isVision);
  }

  // 4. Intentar Capa 3: OpenRouter Free Mesh
  if (!stream) {
    stream = await tryOpenRouterFree(messages, isVision);
  }

  if (!stream) {
    return null;
  }

  // Transformar el stream OpenAI-compatible al protocolo SSE estándar de NoraItu
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformedStream = new ReadableStream({
    async start(controller) {
      const reader = stream!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataContent = trimmed.slice(6).trim();
              if (dataContent === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataContent);
                const deltaText = parsed.choices?.[0]?.delta?.content || parsed.response;
                if (deltaText) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: deltaText, session_id: sessionId })}\n\n`)
                  );
                }
              } catch {}
            }
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(transformedStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}
