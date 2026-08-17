/**
 * ========================================================================
 * 🏛️ NORA TITÁN - ROUTER MULTIMODAL SOBERANO (FASE 2)
 * Ubicación: /src/lib/nora/sovereignRouter.ts
 * 
 * Conectores de Código Abierto y Pesos Libres (Open Weights) a Costo $0:
 *   1. Capa 1: Cloudflare Workers AI (@cf/meta/llama-3.2-11b-vision-instruct / llama-3.3-70b)
 *   2. Capa 2: Hugging Face Serverless (Qwen/Qwen2.5-VL-7B-Instruct / DeepSeek-R1 Distill)
 *   3. Capa 3: OpenRouter Free Open Mesh (Modelos con sufijo :free exclusivos)
 *   4. Capa 4: Ollama Local / VPS Bridge (Inferencia local offline 100% soberana)
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
        text: userMessage || "Analiza detalladamente esta imagen, describe con precisión lo que observas y ofrece una explicación clara, útil y educativa."
      },
      {
        type: "image_url",
        image_url: { url: imageDataUrl }
      }
    ];
  } else if (fileTextContent) {
    finalUserContent = `[DOCUMENTO ADJUNTO]:\n${fileTextContent.slice(0, 12000)}\n\n[CONSULTA DEL USUARIO]:\n${userMessage || "Analiza el documento adjunto y responde con rigor."}`;
  }

  messages.push({
    role: "user",
    content: finalUserContent
  });

  return messages;
}

/**
 * CAPA 4: Ollama Local / VPS Bridge (Servidor Propio Offline)
 * Inmune a cortes de internet y caídas de proveedores de nube.
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
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok && res.body) {
      console.log(`[Sovereign Router - Capa 4]: Inferencia exitosa en Nodo Local (${preferredModel})`);
      return res.body;
    }
  } catch (err) {
    console.warn("[Sovereign Router - Capa 4 Ollama]: Desconectado o tiempo excedido, conmutando...");
  }
  return null;
}

/**
 * CAPA 1: Cloudflare Workers AI (Edge Ingestion Descentralizado)
 * Utiliza @cf/meta/llama-3.2-11b-vision-instruct y @cf/meta/llama-3.3-70b-instruct
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
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok && res.body) {
      console.log(`[Sovereign Router - Capa 1]: Inferencia exitosa en Cloudflare Workers AI (${modelName})`);
      return res.body;
    }

    if (res.status === 429 || res.status === 503 || res.status === 500) {
      console.warn(`[Sovereign Router - Capa 1]: HTTP ${res.status}, conmutando a Capa 2 en <150ms...`);
    }
  } catch (err) {
    console.warn("[Sovereign Router - Capa 1 Cloudflare]:", err);
  }
  return null;
}

/**
 * CAPA 2: Hugging Face Serverless Inference (Open Source Hub)
 * Conectores directos a Qwen2.5-VL y DeepSeek-R1 Distill
 */
async function tryHuggingFaceInference(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const hfToken = process.env.HF_ACCESS_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) return null;

  const candidateModels = isVision
    ? ["Qwen/Qwen2.5-VL-7B-Instruct", "meta-llama/Llama-3.2-11B-Vision-Instruct"]
    : ["deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", "meta-llama/Llama-3.3-70B-Instruct", "Qwen/Qwen2.5-72B-Instruct"];

  for (const model of candidateModels) {
    try {
      const endpoints = [
        `https://router.huggingface.co/hf-inference/v1/chat/completions`,
        `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`
      ];

      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, {
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
          signal: AbortSignal.timeout(8000)
        });

        if (res.ok && res.body) {
          console.log(`[Sovereign Router - Capa 2]: Inferencia exitosa en Hugging Face (${model})`);
          return res.body;
        }

        // Si el modelo está cargando (503) o con rate limit (429), conmutar de inmediato
        if (res.status === 503 || res.status === 429) {
          break;
        }
      }
    } catch (err) {
      console.warn(`[Sovereign Router - Capa 2 HF ${model}]: Conmutando siguiente modelo...`);
    }
  }
  return null;
}

/**
 * CAPA 3: OpenRouter Free Open Mesh (Modelos Libres de Costo :free)
 * Exclusivamente modelos abiertos comunitarios sin facturación.
 */
async function tryOpenRouterFree(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return null;

  const freeModels = isVision
    ? [
        "qwen/qwen-2.5-vl-72b-instruct:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "google/gemini-2.0-flash-lite-preview:free"
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
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router - Capa 3]: Inferencia exitosa en OpenRouter Free (${model})`);
        return res.body;
      }

      if (res.status === 429 || res.status === 503) {
        continue;
      }
    } catch (err) {
      console.warn(`[Sovereign Router - Capa 3 OpenRouter ${model}]: Conmutando...`);
    }
  }
  return null;
}

/**
 * DESPACHADOR PRINCIPAL (DISPATCHER)
 * Ejecuta la cascada soberana a través de las 4 capas abiertas en alta velocidad.
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

  console.log(`[SovereignRouter] 📥 Invocando Router Soberano (Vision: ${isVision}, Historial: ${history.length} msgs)...`);

  // 1. Intentar Capa 4: Nodo Local / VPS Propio si está configurado
  console.log("[SovereignRouter] 🔍 Capa 4: Evaluando Ollama Local / VPS Bridge...");
  let stream = await tryOllamaLocal(messages, isVision);

  // 2. Intentar Capa 1: Cloudflare Workers AI
  if (!stream) {
    console.log(`[SovereignRouter] 🔍 Capa 1: Evaluando Cloudflare Workers AI (Configurado: ${!!process.env.CLOUDFLARE_ACCOUNT_ID && !!process.env.CLOUDFLARE_API_TOKEN})...`);
    stream = await tryCloudflareWorkersAI(messages, isVision);
  }

  // 3. Intentar Capa 2: Hugging Face Serverless
  if (!stream) {
    console.log(`[SovereignRouter] 🔍 Capa 2: Evaluando Hugging Face Serverless (Token: ${!!(process.env.HF_ACCESS_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)})...`);
    stream = await tryHuggingFaceInference(messages, isVision);
  }

  // 4. Intentar Capa 3: OpenRouter Free Mesh
  if (!stream) {
    console.log(`[SovereignRouter] 🔍 Capa 3: Evaluando OpenRouter Free Mesh (Configurado: ${!!process.env.OPENROUTER_API_KEY})...`);
    stream = await tryOpenRouterFree(messages, isVision);
  }

  if (!stream) {
    console.log("[SovereignRouter] ⚠️ Ninguna capa soberana respondió o no hay tokens configurados. Conmutando a siguiente proveedor...");
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
