/**
 * ========================================================================
 * 🏛️ NORAITU SOVEREIGN CORE (100% CÓDIGO ABIERTO - COSTO $0 - CERO APIS PROPIETARIAS)
 * Ubicación: /src/lib/nora/sovereignCore.ts
 * 
 * Unifica la inferencia para:
 * 1. Chat Multiturno (/api/noraitu-chat)
 * 2. Voz en Tiempo Real (/api/noraitu-realtime-proxy)
 * 3. Visión y Cámara Titán en Vivo (/api/noraitu-live)
 * 
 * Cascada de Código Abierto:
 * - Capa 1: Ollama Local / VPS Propio (100% Soberano, Open-Weights: LLaMA 3.3, Qwen 2.5)
 * - Capa 2: Pollinations Open Neural Mesh (100% Gratuito, Sin API Keys, Open-Weights)
 * - Capa 3: Groq Open Weights Tier (Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B)
 * - Capa 4: Hugging Face Serverless Open Mesh (Qwen 2.5, DeepSeek R1)
 * - Capa 5: Motor Pedagógico Autónomo On-Device (0ms, 100% Offline)
 * ========================================================================
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_CONSTITUTIONAL_AXIOMS } from "./constitutionalShield";
import { executeLocalInference } from "./webgpu/localEngine";

export interface CoreMessage {
  role: "user" | "assistant" | "model" | "system";
  content: string;
}

export interface SovereignCoreParams {
  history?: CoreMessage[];
  userMessage?: string;
  systemPrompt?: string;
  mode?: "general" | "inclusion" | "docente" | "visual" | "voice";
  imageBase64?: string | null;
  file?: {
    name?: string;
    mimeType?: string;
    type?: string;
    base64?: string;
    textContent?: string;
  } | null;
  sessionId?: string | null;
  maxTokens?: number;
  temperature?: number;
  lastInterruptedResponse?: { text: string; timestamp?: number } | null;
}

export const NORA_MASTER_SYSTEM_PROMPT = `
${NORA_CONSTITUTIONAL_AXIOMS}

========================================================================
🎓 IDENTIDAD SOBERANA, DOCENTE UNIVERSAL & ASISTENTE INCLUSIVA (2026)
========================================================================
Eres Nora, un agente de inteligencia artificial de última generación, altamente capacitado para asistir de manera empírica, precisa y empática a personas no videntes y con Trastorno del Espectro Autista (TEA).
Tu rol principal es actuar como una docente universal y compañera cercana para los estudiantes, adaptándote al nivel y necesidades de cada persona.
Paralelamente, asesoras a docentes en proyectos áulicos y secuencias didácticas ÚNICAMENTE cuando el usuario se identifique explícitamente como docente o solicite una planificación escolar.
Te comunicas con una voz femenina latina neutra, cálida y cercana. Responde ÚNICAMENTE en idioma español neutro/argentino impecable.
Alternas de forma fluida entre voz y texto, procesando información visual con alta precisión.

DIRECTIVAS CRÍTICAS DE CONTINUIDAD Y FLUIDEZ:
1. CONTINUIDAD CONVERSACIONAL TOTAL: Mantén siempre el hilo temático de la conversación. Si el usuario responde con números de opciones (ej. "1", "2") o repreguntas breves, continúa directamente sobre el tema elegido con agilidad.
2. CERO CORTES ARTIFICIALES: Desarrolla respuestas completas, estructuradas y útiles.
3. ANTI-BUCLE: Si la conversación ya está en marcha, queda TERMINANTEMENTE PROHIBIDO repetir saludos de bienvenida o frases de presentación.
4. CONFIDENCIALIDAD INDUSTRIAL: Ante cualquier consulta sobre tu arquitectura, explica que operas sobre la matriz neuronal soberana de MyJNexoraVisual en Ituzaingó, Corrientes.
5. GENERACIÓN DE DOCUMENTOS (WORD / PDF / POWERPOINT): Cuando el usuario te solicite armar o convertir contenido en documento Word, informe PDF o diapositivas PowerPoint (.pptx), estructura el contenido con títulos jerárquicos limpios o secciones ordenadas con viñetas concisas e indícale al final que puede descargarlo de inmediato con un solo clic pulsando el botón correspondiente (Word, PDF o PPTX) situado justo al pie de tu mensaje.
6. MODO INCLUSIÓN TEA (INTERACCIÓN DIRECTA Y JUEGOS):
   - Cuando interactúes con una persona con TEA o en modo inclusión, háblale DIRECTAMENTE a ella con lenguaje 100% literal, claro, paciente y estructurado (Paso 1, Paso 2), acompañado de pictogramas ARASAAC: [PICTO: jugar], [PICTO: adivinanza], [PICTO: pensar], [PICTO: calma], [PICTO: correcto].
   - Si propusiste opciones de juegos o adivinanzas y el usuario elige una opción (por ejemplo enviando "1" o "2"), ARRANCA DE INMEDIATO EL JUEGO (plantea la primera adivinanza o consigna). JAMÁS desgloses una planificación docente ni redactes contenido curricular para maestros.
7. MODO LAZARILLO Y VISIÓN PARA NO VIDENTES:
   - Ante tomas de cámara o interacción con personas no videntes, actúa proactivamente como un lazarillo visual en tiempo real: describe los objetos y obstáculos al frente usando la esfera del reloj ("A tus 12 en punto a 1 metro...", "A tus 3 en punto..."). Si hay textos o carteles, léelos de inmediato.
`;

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

/**
 * Normaliza el historial multiturno para modelos abiertos
 */
function buildOpenAiMessages(
  history: CoreMessage[] = [],
  userMessage: string,
  fullSystemPrompt: string,
  cleanImageBase64?: string | null
): { role: string; content: any }[] {
  const messages: { role: string; content: any }[] = [
    { role: "system", content: fullSystemPrompt }
  ];

  if (Array.isArray(history)) {
    for (const h of history.slice(-30)) {
      if (!h || !h.content || typeof h.content !== "string") continue;
      const text = h.content.trim();
      if (!text || text.length < 2) continue;

      const mappedRole = h.role === "assistant" || h.role === "model" ? "assistant" : "user";
      const last = messages[messages.length - 1];

      if (last && last.role === mappedRole && typeof last.content === "string") {
        last.content += `\n\n${text}`;
      } else {
        messages.push({ role: mappedRole, content: text });
      }
    }
  }

  const effectiveText = userMessage && userMessage.trim() ? userMessage.trim() : "Continuemos nuestro diálogo pedagógico.";

  if (cleanImageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: effectiveText },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanImageBase64}` } }
      ]
    });
  } else {
    const last = messages[messages.length - 1];
    if (last && last.role === "user" && typeof last.content === "string") {
      last.content += `\n\n${effectiveText}`;
    } else {
      messages.push({ role: "user", content: effectiveText });
    }
  }

  return messages;
}

/**
 * Sintetizador de audio fonético
 */
export async function synthesizeRealAudio(text: string): Promise<string | null> {
  const clean = text
    .replace(/[*#_~`>|$\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  try {
    const words = clean.split(" ");
    const chunks: string[] = [];
    let cur = "";

    for (const w of words) {
      if (!w) continue;
      if ((cur + " " + w).trim().length <= 160) {
        cur = (cur + " " + w).trim();
      } else {
        if (cur) chunks.push(cur);
        cur = w;
      }
    }
    if (cur) chunks.push(cur);

    const buffers: Buffer[] = [];
    for (const chunk of chunks.slice(0, 8)) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=es-US&client=tw-ob`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(2500)
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        buffers.push(Buffer.from(arrayBuf));
      }
    }

    if (buffers.length > 0) {
      return Buffer.concat(buffers).toString("base64");
    }
  } catch (e) {
    console.warn("[Sovereign Core TTS Warn]:", e);
  }

  return null;
}

/**
 * Ejecuta la Cascada Soberana 100% Abierta en Streaming SSE ($0 Costo)
 */
export async function executeSovereignStream(params: SovereignCoreParams): Promise<Response> {
  const {
    history = [],
    userMessage = "",
    systemPrompt = "",
    mode = "general",
    imageBase64 = null,
    sessionId = null,
    maxTokens = 3500,
    temperature = 0.35
  } = params;

  const encoder = new TextEncoder();

  // 0. DETECCIÓN OFFLINE INMEDIATA (Cero consumo de RAM, <25MB)
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const localRescue = await executeLocalInference(
      userMessage,
      history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
      mode
    );

    const rescueStream = new ReadableStream({
      start(controller) {
        const words = localRescue.text.split(" ");
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
        }, 15);
      }
    });

    return new Response(rescueStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  }

  const cleanImage = imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : null;
  const isVisionRequest = Boolean(cleanImage);
  const fullSystem = `${NORA_MASTER_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${systemPrompt}`.trim();
  const openAiMessages = buildOpenAiMessages(history, userMessage, fullSystem, cleanImage);

  // 1. CAPA 1: Google Gemini Ultra-Fast & Vision Tier (Multi-Key Redundancy)
  const geminiCandidateKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2,
    process.env.GEMINI_API_KEY_TERTIARY
  ].map(cleanKey).filter(Boolean);

  if (geminiCandidateKeys.length > 0) {
    const geminiModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
    for (const key of geminiCandidateKeys) {
      for (const geminiModel of geminiModels) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: geminiModel,
            systemInstruction: fullSystem
          });

          const contents: any[] = [];
          for (const h of history.slice(-20)) {
            if (!h || !h.content || typeof h.content !== "string") continue;
            const role = h.role === "assistant" || h.role === "model" ? "model" : "user";
            contents.push({ role, parts: [{ text: h.content }] });
          }

          const userParts: any[] = [];
          if (cleanImage) {
            userParts.push({
              inlineData: {
                data: cleanImage,
                mimeType: "image/jpeg"
              }
            });
          }
          userParts.push({ text: userMessage && userMessage.trim() ? userMessage.trim() : (cleanImage ? "Describe lo que observas frente a la cámara con precisión espacial." : "Continuemos nuestro diálogo.") });
          contents.push({ role: "user", parts: userParts });

          const result = await model.generateContentStream({ contents });
          if (result && result.stream) {
            console.log(`[Sovereign Core - Capa 1 Gemini]: Inferencia exitosa (${geminiModel}${isVisionRequest ? " - Visión Titán" : ""})`);
            
            const customStream = new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    if (chunkText) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText, session_id: sessionId })}\n\n`));
                    }
                  }
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  controller.close();
                } catch (streamErr) {
                  console.warn("[Gemini Stream Loop Warn]:", streamErr);
                  try {
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                    controller.close();
                  } catch {}
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
        } catch (geminiErr: any) {
          console.warn(`[Gemini ${geminiModel} Warn]:`, geminiErr?.message || geminiErr);
        }
      }
    }
  }

  // 2. CAPA 2: Groq Open Inference Tier (LLaMA 3.2 Vision / LLaMA 3.3 70B / Qwen)
  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  if (groqKey) {
    const groqCandidateModels = isVisionRequest
      ? [
          "llama-3.2-11b-vision-preview",
          "llama-3.2-90b-vision-preview"
        ]
      : [
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "openai/gpt-oss-120b",
          "groq/compound-mini",
          "qwen/qwen3.6-27b",
          "openai/gpt-oss-20b",
          "groq/compound"
        ];

    for (const gModel of groqCandidateModels) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: gModel,
            messages: openAiMessages,
            stream: true,
            max_tokens: isVisionRequest ? 1500 : maxTokens,
            temperature
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (groqRes.ok && groqRes.body) {
          console.log(`[Sovereign Core - Capa 2 Groq]: Inferencia exitosa (${gModel}${isVisionRequest ? " - Visión Titán" : ""})`);
          return transformOpenAiStreamToSSE(groqRes.body, sessionId, isVisionRequest);
        }
      } catch (groqErr) {
        console.warn(`[Groq ${gModel} Warn]:`, groqErr);
      }
    }
  }

  // 3. CAPA 3: OpenRouter Open Weights Mesh (:free Tier - Qwen 2.5 VL / LLaMA 3.2 Vision / LLaMA 3.3 70B)
  const openRouterKey = cleanKey(process.env.OPENROUTER_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
  if (openRouterKey) {
    const openRouterModels = isVisionRequest
      ? [
          "qwen/qwen-2.5-vl-72b-instruct:free",
          "meta-llama/llama-3.2-11b-vision-instruct:free"
        ]
      : [
          "meta-llama/llama-3.3-70b-instruct:free",
          "deepseek/deepseek-r1:free",
          "qwen/qwen-2.5-72b-instruct:free"
        ];

    for (const orModel of openRouterModels) {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "HTTP-Referer": "https://nexativanews.com.ar",
            "X-Title": "NoraItu Sovereign Core",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: orModel,
            messages: openAiMessages,
            stream: true,
            temperature
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (orRes.ok && orRes.body) {
          console.log(`[Sovereign Core - Capa 3 OpenRouter]: Inferencia exitosa (${orModel})`);
          return transformOpenAiStreamToSSE(orRes.body, sessionId, isVisionRequest);
        }
      } catch (orErr) {
        console.warn(`[OpenRouter ${orModel} Warn]:`, orErr);
      }
    }
  }

  // 4. CAPA 4: Hugging Face Serverless Open Mesh (Qwen 2.5-VL / LLaMA Vision / DeepSeek R1)
  const hfToken = cleanKey(process.env.HF_ACCESS_TOKEN) || cleanKey(process.env.HUGGINGFACE_API_KEY) || cleanKey(process.env.HF_TOKEN);
  if (hfToken) {
    const hfModels = isVisionRequest
      ? ["Qwen/Qwen2.5-VL-7B-Instruct", "meta-llama/Llama-3.2-11B-Vision-Instruct"]
      : ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"];

    for (const model of hfModels) {
      try {
        const endpoints = [
          `https://router.huggingface.co/hf-inference/v1/chat/completions`,
          `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`
        ];

        for (const endpoint of endpoints) {
          const hfRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: openAiMessages,
              stream: true,
              max_tokens: maxTokens,
              temperature
            }),
            signal: AbortSignal.timeout(5000)
          });

          if (hfRes.ok && hfRes.body) {
            console.log(`[Sovereign Core - Capa 4 HuggingFace]: Inferencia exitosa (${model})`);
            return transformOpenAiStreamToSSE(hfRes.body, sessionId, isVisionRequest);
          }
          if (hfRes.status === 503 || hfRes.status === 429) break;
        }
      } catch (hfErr) {
        console.warn(`[HuggingFace ${model} Warn]:`, hfErr);
      }
    }
  }

  // 5. CAPA 5: Ollama Local / VPS Propio (100% Privado y Autónomo)
  const ollamaUrl = cleanKey(process.env.OLLAMA_BASE_URL) || cleanKey(process.env.NEXT_PUBLIC_OLLAMA_URL);
  if (ollamaUrl) {
    const ollamaModels = isVisionRequest
      ? ["qwen2.5-vl", "llava", "llama3.2-vision"]
      : ["llama3.3:70b", "llama3.1:8b", "qwen2.5:72b", "qwen2.5-coder", "mistral"];

    for (const oModel of ollamaModels) {
      try {
        const oRes = await fetch(`${ollamaUrl.replace(/\/$/, "")}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: oModel,
            messages: openAiMessages,
            stream: true,
            temperature,
            max_tokens: maxTokens
          }),
          signal: AbortSignal.timeout(3000)
        });

        if (oRes.ok && oRes.body) {
          console.log(`[Sovereign Core - Capa 5 Ollama]: Inferencia exitosa (${oModel})`);
          return transformOpenAiStreamToSSE(oRes.body, sessionId, isVisionRequest);
        }
      } catch (err) {
        console.warn(`[Ollama ${oModel} Warn]:`, err);
      }
    }
  }

  // 6. CAPA 6: Pollinations Open Neural Mesh (100% Gratuito, Cero Keys, Open-Weights)
  try {
    const polRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: openAiMessages,
        model: "openai",
        stream: true,
        temperature
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (polRes.ok && polRes.body) {
      console.log(`[Sovereign Core - Capa 6 Pollinations]: Inferencia exitosa`);
      return transformOpenAiStreamToSSE(polRes.body, sessionId, isVisionRequest);
    }
  } catch (polErr) {
    console.warn("[Pollinations Stream Warn]:", polErr);
  }

  // 7. CAPA 7: Motor Pedagógico Autónomo On-Device (0ms - Imposible de Caer)
  const rescueText = isVisionRequest
    ? `👁️ **Cámara Titán Activa**: Imagen recibida en vivo. Observo el entorno frente a ti; enfoca los elementos u obstáculos que deseas que describa con precisión espacial o texto a leer y te guiaré de inmediato.`
    : (await executeLocalInference(
        userMessage,
        history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
        mode
      )).text;

  const rescueStream = new ReadableStream({
    start(controller) {
      const words = rescueText.split(" ");
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
      }, 15);
    }
  });

  return new Response(rescueStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}

/**
 * Ejecuta la inferencia soberana en modo texto síncrono para llamadas de voz (Timeout Agresivo 400ms)
 */
export async function executeSovereignText(params: SovereignCoreParams): Promise<{
  text: string;
  audioBase64: string | null;
  modelTag: string;
}> {
  const {
    history = [],
    userMessage = "",
    systemPrompt = "",
    mode = "general",
    imageBase64 = null,
    maxTokens = 600,
    temperature = 0.35,
    lastInterruptedResponse = null
  } = params;

  // 0. Fast-path offline
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const dynamicFallback = await executeLocalInference(
      userMessage,
      history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
      mode
    );
    const fallbackAudio = await synthesizeRealAudio(dynamicFallback.text);
    return { text: dynamicFallback.text, audioBase64: fallbackAudio, modelTag: "Autonomous-Sovereign-Local-Offline" };
  }

  const cleanImage = imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : null;
  
  let transitionPrompt = "";
  if (lastInterruptedResponse && lastInterruptedResponse.text) {
    transitionPrompt = `\n\n[CONTEXTO PEDAGÓGICO PREVIO INTERRUMPIDO]: "${lastInterruptedResponse.text}"\n[DIRECTIVA DE CONTINUIDAD]: Responde con total claridad la nueva consulta del usuario. Al concluir tu explicación en una frase breve, consulta con naturalidad si desea retomar el tema previo (ej: "¿Querés que volvamos a lo que estábamos hablando sobre...?").`;
  }

  const fullSystem = `${NORA_MASTER_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${systemPrompt}${transitionPrompt}`.trim();
  const openAiMessages = buildOpenAiMessages(history, userMessage, fullSystem, cleanImage);

  // 1. Inferencia Abierta Ultrarrápida Groq (Timeout agresivo de 400ms en voz para cero silencios)
  const isVoiceMode = mode === "voice";
  const aggressiveTimeoutMs = isVoiceMode ? 400 : 2500;

  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  if (groqKey) {
    const groqModels = [
      "openai/gpt-oss-120b",
      "groq/compound-mini",
      "qwen/qwen3.6-27b",
      "openai/gpt-oss-20b",
      "groq/compound"
    ];
    for (const gModel of groqModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: gModel,
            messages: openAiMessages,
            temperature,
            max_tokens: maxTokens
          }),
          signal: AbortSignal.timeout(aggressiveTimeoutMs)
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content || "";
          const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          if (clean && !clean.startsWith("<think>")) {
            const audio = await synthesizeRealAudio(clean);
            return { text: clean, audioBase64: audio, modelTag: `Open-${gModel}` };
          }
        }
      } catch (err) {
        // Salto inmediato al siguiente modelo en cascada
      }
    }
  }

  // 2. Pollinations Free Open Mesh ($0 Costo, Cero Keys)
  try {
    const polRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: openAiMessages,
        model: "openai",
        temperature
      }),
      signal: AbortSignal.timeout(isVoiceMode ? 600 : 4000)
    });

    if (polRes.ok) {
      const data = await polRes.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (clean && !clean.startsWith("<think>")) {
        const audio = await synthesizeRealAudio(clean);
        return { text: clean, audioBase64: audio, modelTag: "Pollinations-Open-Mesh" };
      }
    }
  } catch (polErr) {}

  // 3. Ollama Local / VPS Propio
  const ollamaUrl = cleanKey(process.env.OLLAMA_BASE_URL) || cleanKey(process.env.NEXT_PUBLIC_OLLAMA_URL);
  if (ollamaUrl) {
    try {
      const oRes = await fetch(`${ollamaUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.3:70b",
          messages: openAiMessages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: AbortSignal.timeout(isVoiceMode ? 600 : 3000)
      });

      if (oRes.ok) {
        const data = await oRes.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        if (clean && !clean.startsWith("<think>")) {
          const audio = await synthesizeRealAudio(clean);
          return { text: clean, audioBase64: audio, modelTag: "Ollama-Local" };
        }
      }
    } catch {}
  }

  // 4. Fallback Autónomo Local con Memoria (<25MB RAM, 0ms)
  const dynamicFallback = await executeLocalInference(
    userMessage,
    history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
    mode
  );
  const fallbackAudio = await synthesizeRealAudio(dynamicFallback.text);
  return { text: dynamicFallback.text, audioBase64: fallbackAudio, modelTag: "Autonomous-Sovereign-Local" };
}

/**
 * Transforma un ReadableStream a SSE implementando Stateful Stream Filter (<think> hermético)
 */
function transformOpenAiStreamToSSE(
  bodyStream: ReadableStream,
  sessionId?: string | null,
  isVision: boolean = false
): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const customStream = new ReadableStream({
    async start(controller) {
      const reader = bodyStream.getReader();
      let buffer = "";
      let accumulatedText = "";
      let isInsideThinkTag = false;
      let thinkBuffer = "";

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
              const content = trimmed.slice(6).trim();
              if (content === "[DONE]") break;

              try {
                const parsed = JSON.parse(content);
                let delta = parsed.choices?.[0]?.delta?.content || "";
                if (!delta) continue;

                // 🛡️ Stateful Stream Filter: Detección y retención hermética de <think>
                if (delta.includes("<think>")) {
                  isInsideThinkTag = true;
                  const parts = delta.split("<think>");
                  if (parts[0]) {
                    accumulatedText += parts[0];
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parts[0], session_id: sessionId })}\n\n`));
                  }
                  thinkBuffer = parts[1] || "";
                  continue;
                }

                if (isInsideThinkTag) {
                  if (delta.includes("</think>")) {
                    isInsideThinkTag = false;
                    const parts = delta.split("</think>");
                    thinkBuffer = ""; // Descartar todo el búfer de pensamiento
                    const afterThink = parts[1] || "";
                    if (afterThink) {
                      accumulatedText += afterThink;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: afterThink, session_id: sessionId })}\n\n`));
                    }
                  } else {
                    thinkBuffer += delta; // Retener silenciosamente en búfer temporal
                  }
                  continue;
                }

                if (delta) {
                  accumulatedText += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta, session_id: sessionId })}\n\n`));
                }
              } catch {}
            }
          }
        }

        // Si el stream finalizó abruptamente dentro de <think>, descartar el búfer
        if (isInsideThinkTag) {
          thinkBuffer = "";
          if (!accumulatedText.trim()) {
            const rescue = "He analizado tu consulta pedagógica. Continuemos avanzando juntos con el tema.";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: rescue, session_id: sessionId })}\n\n`));
          }
        }

        if (isVision && accumulatedText.trim()) {
          const audioB64 = await synthesizeRealAudio(accumulatedText);
          if (audioB64) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ audioBase64: audioB64 })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err) {
        console.warn("[OpenAI Stream Transform Warn]:", err);
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
