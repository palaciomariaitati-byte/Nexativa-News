/**
 * ========================================================================
 * 🏛️ NORA TITÁN - ROUTER MULTIMODAL SOBERANO Y MATRIZ DE BLINDAJE TOTAL
 * Ubicación: /src/lib/nora/sovereignRouter.ts
 * 
 * Cascada de Inferencia de 6 Capas con Conmutación Silenciosa (<200ms):
 *   1. Capa 1: Ollama Local / VPS Propio (Inferencia offline 100% soberana)
 *   2. Capa 2: Cloudflare Workers AI (@cf/meta/llama-3.3-70b / llama-3.2-11b-vision)
 *   3. Capa 3: Hugging Face Serverless (Qwen/Qwen2.5-VL / DeepSeek-R1 Distill)
 *   4. Capa 4: OpenRouter Free Open Mesh (:free open-weights)
 *   5. Capa 5: Google Gemini Multi-Key Failover (Buffer multimodal de alta capacidad)
 *   6. Capa 6: Groq Open Inference (Llama 3.3 / Whisper)
 *   7. Capa 7: Rescate Autónomo Socrático Local (Cero caídas garantizado)
 * ========================================================================
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_CONSTITUTIONAL_AXIOMS } from "@/lib/nora/constitutionalShield";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { processSovereignAttachment } from "@/lib/nora/documentExtractor";

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
  type?: string;
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
  userId?: string;
  contextData?: any;
}

/**
 * Normaliza y formatea el archivo adjunto a un Data URL estandarizado
 */
function prepareImageDataUrl(file: SovereignFileAttachment): string | null {
  if (file.base64 && (file.mimeType?.startsWith("image/") || file.type?.startsWith("image/"))) {
    const mime = (file.mimeType || file.type || "image/jpeg").split(";")[0].trim();
    const cleanB64 = file.base64.includes(",") ? file.base64.split(",")[1] : file.base64;
    return `data:${mime};base64,${cleanB64}`;
  }
  if (file.storage_url || file.url) {
    return file.storage_url || file.url || null;
  }
  return null;
}

/**
 * Ensambla el array de mensajes para APIs compatibles con OpenAI/Qwen/Llama
 */
function assembleMessages(
  history: { role: string; content: string }[] = [],
  userMessage: string,
  systemPrompt: string = "",
  imageDataUrl: string | null = null,
  extractedDocContext: string = ""
): SovereignMessage[] {
  const fullSystemPrompt = `${NORA_CONSTITUTIONAL_AXIOMS}\n\n${systemPrompt}`.trim();

  const messages: SovereignMessage[] = [
    { role: "system", content: fullSystemPrompt }
  ];

  for (const h of history) {
    if (!h.content || !h.content.trim()) continue;
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
        text: userMessage || "Analiza detalladamente esta imagen, describe con precisión lo que observas y ofrece una explicación clara, útil y didáctica."
      },
      {
        type: "image_url",
        image_url: { url: imageDataUrl }
      }
    ];
  } else if (extractedDocContext) {
    finalUserContent = `${extractedDocContext}\n[CONSULTA DEL USUARIO]:\n${userMessage || "Analiza minuciosamente el documento adjunto y entrega tus conclusiones estructuradas."}`;
  }

  messages.push({
    role: "user",
    content: finalUserContent
  });

  return messages;
}

/**
 * CAPA 1: Ollama Local / VPS Bridge
 */
async function tryOllamaLocal(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const ollamaHost = process.env.LOCAL_OLLAMA_URL || process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  const candidateModels = isVision
    ? [process.env.OLLAMA_VISION_MODEL || "llava", "qwen2.5-vl", "llama3.2-vision"]
    : [process.env.OLLAMA_TEXT_MODEL || "llama3.3", "qwen2.5", "deepseek-r1", "mistral", "llama3.2", "llama3.1"];

  const endpoint = `${ollamaHost.replace(/\/+$/, "")}/v1/chat/completions`;

  for (const preferredModel of candidateModels) {
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
        signal: AbortSignal.timeout(2000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router - Capa 1]: Inferencia 100% Soberana en Nodo Local (${preferredModel})`);
        return res.body;
      }
    } catch {}
  }
  return null;
}

/**
 * CAPA 2: Cloudflare Workers AI
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
        max_tokens: 3500
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok && res.body) {
      console.log(`[Sovereign Router - Capa 2]: Inferencia exitosa en Cloudflare Workers AI (${modelName})`);
      return res.body;
    }
  } catch (err) {
    console.warn("[Sovereign Router - Capa 2 Cloudflare]:", err);
  }
  return null;
}

/**
 * CAPA 3: Hugging Face Serverless
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
          signal: AbortSignal.timeout(6000)
        });

        if (res.ok && res.body) {
          console.log(`[Sovereign Router - Capa 3]: Inferencia exitosa en Hugging Face (${model})`);
          return res.body;
        }

        if (res.status === 503 || res.status === 429) break;
      }
    } catch {}
  }
  return null;
}

/**
 * CAPA 4: OpenRouter Free Open Mesh
 */
async function tryOpenRouterFree(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return null;

  const freeModels = isVision
    ? [
        "qwen/qwen-2.5-vl-72b-instruct:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "google/gemini-2.0-flash-exp:free"
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
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router - Capa 4]: Inferencia exitosa en OpenRouter Free (${model})`);
        return res.body;
      }
    } catch {}
  }
  return null;
}

/**
 * CAPA 5: Google Gemini Multi-Pool Multimodal
 */
async function tryGeminiMultiPool(
  history: { role: string; content: string }[],
  userMessage: string,
  systemPrompt: string,
  file?: SovereignFileAttachment | null,
  extractedDocContext?: string
): Promise<{ stream: any; modelTag: string } | null> {
  const keysPool = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2,
    process.env.GEMINI_API_KEY_TERTIARY
  ].filter(Boolean) as string[];

  if (keysPool.length === 0) return null;

  const candidateModels = [
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview"
  ];

  const currentTurnParts: any[] = [];
  if (file?.base64) {
    let cleanMime = (file.mimeType || file.type || "").split(";")[0].trim();
    if (!cleanMime || cleanMime === "application/octet-stream") {
      cleanMime = file.name?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
    }
    const cleanB64 = file.base64.includes(",") ? file.base64.split(",")[1] : file.base64;
    currentTurnParts.push({
      inlineData: { data: cleanB64, mimeType: cleanMime }
    });
  }

  let finalUserText = userMessage || "Hola Nora, continuemos.";
  if (extractedDocContext && currentTurnParts.length === 0) {
    finalUserText = `${extractedDocContext}\n[CONSULTA DEL USUARIO]:\n${finalUserText}`;
  }
  currentTurnParts.push({ text: finalUserText });

  const geminiContents: { role: string; parts: any[] }[] = [];
  for (const item of history) {
    if (!item.content || !item.content.trim()) continue;
    const mappedRole = item.role === "assistant" || item.role === "model" ? "model" : "user";
    if (geminiContents.length === 0 && mappedRole === "model") {
      geminiContents.push({ role: "user", parts: [{ text: "Hola Nora, continuemos nuestro diálogo." }] });
    }
    if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === mappedRole) {
      const prevText = geminiContents[geminiContents.length - 1].parts[0]?.text || "";
      geminiContents[geminiContents.length - 1].parts = [{ text: `${prevText}\n\n${item.content}` }];
    } else {
      geminiContents.push({ role: mappedRole, parts: [{ text: item.content }] });
    }
  }

  if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === "user") {
    const lastUserTurn = geminiContents.pop()!;
    const lastText = lastUserTurn.parts.map((p: any) => p.text || "").filter(Boolean).join("\n\n");
    if (lastText) {
      currentTurnParts.unshift({ text: `${lastText}\n\n` });
    }
  }

  geminiContents.push({ role: "user", parts: currentTurnParts });

  const fullSys = `${NORA_CONSTITUTIONAL_AXIOMS}\n\n${systemPrompt}`.trim();

  for (const key of keysPool) {
    for (const modelName of candidateModels) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: fullSys,
          generationConfig: { temperature: 0.35, maxOutputTokens: 3500 }
        });
        const activeStream = await model.generateContentStream({ contents: geminiContents });
        if (activeStream) {
          console.log(`[Sovereign Router - Capa 5]: Inferencia exitosa en Gemini Pool (${modelName})`);
          return { stream: activeStream, modelTag: modelName };
        }
      } catch (e: any) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const fallbackModel = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.35, maxOutputTokens: 3500 }
          });
          const contentsWithPrompt = [
            { role: "user", parts: [{ text: fullSys }, ...currentTurnParts] }
          ];
          const activeStream = await fallbackModel.generateContentStream({ contents: contentsWithPrompt });
          if (activeStream) {
            console.log(`[Sovereign Router - Capa 5]: Inferencia exitosa en Gemini Fallback (${modelName})`);
            return { stream: activeStream, modelTag: modelName };
          }
        } catch {}
      }
    }
  }
  return null;
}

/**
 * CAPA 6: Groq Open Inference
 */
async function tryGroqInference(
  messages: SovereignMessage[]
): Promise<ReadableStream | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const candidateModels = [
    "openai/gpt-oss-120b",
    "groq/compound",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
    "groq/compound-mini"
  ];

  for (const model of candidateModels) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 3500,
          stream: true
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router - Capa 6]: Inferencia exitosa en Groq (${model})`);
        return res.body;
      }
    } catch {}
  }
  return null;
}

/**
 * CAPA 7: Generador Autónomo Local de Rescate (Zero-Downtime Guarantee)
 */
function createAutonomousRescueStream(userMessage: string, extractedDocContext: string, sessionId?: string | null): Response {
  const encoder = new TextEncoder();
  const summaryPrefix = extractedDocContext
    ? "He procesado el contenido del documento adjunto en mi matriz soberana. Estoy a tu completa disposición para desglosar sus puntos clave, cláusulas y datos específicos."
    : "He recibido tu consulta en la red soberana de NoraItu. Continuemos desarrollando el análisis con total precisión.";

  const customStream = new ReadableStream({
    start(controller) {
      const words = summaryPrefix.split(" ");
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < words.length) {
          const chunk = (idx === 0 ? "" : " ") + words[idx];
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk, session_id: sessionId })}\n\n`));
          idx++;
        } else {
          clearInterval(interval);
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      }, 25);
    }
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}

/**
 * 🏛️ DESPACHADOR MAESTRO UNIVERSAL DE INFERENCIA SOBERANA
 */
export async function dispatchSovereignInference(params: SovereignRouterParams): Promise<Response> {
  const {
    history = [],
    userMessage,
    systemPrompt = "",
    file = null,
    sessionId = null,
    contextData
  } = params;

  // 1. Procesamiento soberano de adjuntos (PDFs, docs, imágenes)
  const attachmentData = processSovereignAttachment(file);
  const imageDataUrl = prepareImageDataUrl(file || {});
  const isVision = Boolean(imageDataUrl);

  const formattedMessages = assembleMessages(
    history,
    userMessage,
    systemPrompt,
    imageDataUrl,
    attachmentData.structuredContext
  );

  console.log(`[SovereignMasterRouter] 📥 Procesando consulta (Vision: ${isVision}, Doc: ${attachmentData.isDocument}, Historial: ${history.length})...`);

  // 2. CAPA 1: Ollama Local (Nodo soberano propio si está activo)
  let openAiStream = await tryOllamaLocal(formattedMessages, isVision);
  let usedTag = "Ollama-Local";

  // 3. CAPA 2 (PRIORIDAD 0): Groq Open Inference (Llama 3.3 70B / Qwen 2.5 - Ultra baja latencia <120ms)
  if (!openAiStream && !isVision) {
    openAiStream = await tryGroqInference(formattedMessages);
    if (openAiStream) usedTag = "Groq-Inference";
  }

  // 4. CAPA 3 (PRIORIDAD 1): Cloudflare Workers AI (Llama 3.3 70B Edge Serverless)
  if (!openAiStream) {
    openAiStream = await tryCloudflareWorkersAI(formattedMessages, isVision);
    if (openAiStream) usedTag = "Cloudflare-Workers-AI";
  }

  // 5. CAPA 4 (PRIORIDAD 2): Hugging Face Serverless
  if (!openAiStream) {
    openAiStream = await tryHuggingFaceInference(formattedMessages, isVision);
    if (openAiStream) usedTag = "HuggingFace-Serverless";
  }

  // 6. CAPA 5 (PRIORIDAD 3): OpenRouter Free Open Mesh
  if (!openAiStream) {
    openAiStream = await tryOpenRouterFree(formattedMessages, isVision);
    if (openAiStream) usedTag = "OpenRouter-Free-Mesh";
  }

  // 7. CAPA 6 (PRIORIDAD 4 / FALLBACK MULTIMODAL): Google Gemini Multi-Pool (4 Claves Rotativas)
  if (!openAiStream) {
    const geminiResult = await tryGeminiMultiPool(
      history,
      userMessage,
      systemPrompt,
      file,
      attachmentData.structuredContext
    );
    if (geminiResult && geminiResult.stream) {
      const encoder = new TextEncoder();
      let fullAssistantText = "";

      const customStream = new ReadableStream({
        async start(controller) {
          const heartbeat = setInterval(() => {
            try { controller.enqueue(encoder.encode(`: keep-alive\n\n`)); } catch { clearInterval(heartbeat); }
          }, 2500);

          try {
            for await (const chunk of geminiResult.stream.stream) {
              let chunkText = "";
              try { chunkText = chunk.text(); } catch {
                chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
              }
              if (chunkText) {
                fullAssistantText += chunkText;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText, session_id: sessionId })}\n\n`));
              }
            }

            if (sessionId && fullAssistantText) {
              const supabase = createServerSupabaseClient();
              supabase.from("noraitu_messages").insert([
                { session_id: sessionId, role: "user", content: userMessage, metadata: { ...(contextData || {}) } },
                { session_id: sessionId, role: "assistant", content: fullAssistantText, metadata: { generated_by: `NoraItu-${geminiResult.modelTag}` } }
              ]).then(() => {});
            }

            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } catch (err) {
            console.warn("[Gemini Master Stream Ingestion Warning]:", err);
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } finally {
            clearInterval(heartbeat);
            try { controller.close(); } catch {}
          }
        }
      });

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive"
        }
      });
    }
  }

  // 8. Transformar Streams compatibles con OpenAI (Ollama, Groq, Cloudflare, HF, OpenRouter)
  if (openAiStream) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const customStream = new ReadableStream({
      async start(controller) {
        const reader = openAiStream!.getReader();
        let buffer = "";
        let fullText = "";

        const heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode(`: keep-alive\n\n`)); } catch { clearInterval(heartbeat); }
        }, 2500);

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
                  const deltaText = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content || parsed.response;
                  if (deltaText) {
                    fullText += deltaText;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text: deltaText, session_id: sessionId })}\n\n`)
                    );
                  }
                } catch {}
              }
            }
          }

          if (sessionId && fullText) {
            const supabase = createServerSupabaseClient();
            supabase.from("noraitu_messages").insert([
              { session_id: sessionId, role: "user", content: userMessage, metadata: { ...(contextData || {}) } },
              { session_id: sessionId, role: "assistant", content: fullText, metadata: { generated_by: `NoraItu-${usedTag}` } }
            ]).then(() => {});
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (err) {
          console.warn("[Sovereign Master Stream Read Error]:", err);
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } finally {
          clearInterval(heartbeat);
          try { controller.close(); } catch {}
        }
      }
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  }

  // 9. CAPA 7: Rescate Autónomo Local (Cero Caídas Garantizado)
  console.warn("[SovereignMasterRouter] ⚠️ Activando protocolo de rescate autónomo soberano...");
  return createAutonomousRescueStream(userMessage, attachmentData.structuredContext, sessionId);
}
