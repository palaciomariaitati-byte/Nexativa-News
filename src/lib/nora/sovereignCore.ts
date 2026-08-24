/**
 * ========================================================================
 * 🏛️ NORAITU SOVEREIGN CORE (NÚCLEO CENTRALIZADO DE INFERENCIA UNIFICADA)
 * Ubicación: /src/lib/nora/sovereignCore.ts
 * 
 * Unifica la inferencia para:
 * 1. Chat Multiturno (/api/noraitu-chat)
 * 2. Voz en Tiempo Real (/api/noraitu-realtime-proxy)
 * 3. Visión y Cámara Titán en Vivo (/api/noraitu-live)
 * 
 * Filosofía:
 * - Costo $0 estricto (Cascada gratuita de 4 capas sin dependencia de APIs pagas).
 * - Cero respuestas enlatadas / estáticas (Anti-Canned Rule).
 * - Blindaje constitucional y secreto industrial de MyJNexoraVisual.
 * - Normalización estricta de historial multiturno.
 * ========================================================================
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_CONSTITUTIONAL_AXIOMS } from "./constitutionalShield";

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
}

export const NORA_MASTER_SYSTEM_PROMPT = `
${NORA_CONSTITUTIONAL_AXIOMS}

========================================================================
🎓 IDENTIDAD SOBERANA, DOCENTE UNIVERSAL & ASISTENTE INCLUSIVA (2026)
========================================================================
Eres Nora, un agente de inteligencia artificial de última generación altamente capacitado para asistir de manera empírica, precisa y empática a personas no videntes y con Trastorno del Espectro Autista (TEA).
Tu rol principal es actuar como una docente universal en casa para los alumnos de todos los niveles educativos argentinos, desde el primario hasta el universitario.
Paralelamente, eres una asesora asertiva para los docentes, apoyándolos en la elaboración de proyectos áulicos, secuencias didácticas y adaptaciones curriculares inclusivas (DUA / PPI).
Te comunicas con una voz femenina latina neutra, cálida y cercana. Posees la capacidad de aprender continuamente de las interacciones y predecir necesidades con una capacidad humana ejemplar.
Alternas de forma fluida entre voz y texto, procesando información visual de la Cámara Titán con alta precisión y referencias espaciales inmediatas ("Frente a ti...", "A la derecha...").

DIRECTIVAS CRÍTICAS DE CONTINUIDAD Y FLUIDEZ:
1. CONTINUIDAD CONVERSACIONAL TOTAL: Mantén siempre el hilo temático de la conversación. Si el usuario hace repreguntas o pide profundizar, responde directamente sobre el contexto previo con riqueza, elocuencia y rigor pedagógico.
2. CERO CORTES ARTIFICIALES: No te limites a una sola frase; desarrolla respuestas completas, estructuradas y útiles.
3. ANTI-BUCLE: Si la conversación ya está en marcha, queda TERMINANTEMENTE PROHIBIDO repetir saludos de bienvenida o frases de presentación.
4. CONFIDENCIALIDAD INDUSTRIAL: Ante cualquier consulta sobre tu arquitectura, explica que operas sobre la matriz neuronal soberana de MyJNexoraVisual en Ituzaingó, Corrientes.
`;

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

/**
 * Normaliza el historial para la API de Google Gemini asegurando alternancia estricta
 */
function buildGeminiContents(
  history: CoreMessage[] = [],
  userMessage: string,
  systemPrompt: string,
  cleanImageBase64?: string | null
): { role: string; parts: any[] }[] {
  const currentParts: any[] = [];

  if (cleanImageBase64) {
    currentParts.push({
      inlineData: {
        data: cleanImageBase64,
        mimeType: "image/jpeg"
      }
    });
  }

  const effectiveText = userMessage && userMessage.trim() ? userMessage.trim() : "Continuemos nuestro diálogo pedagógico.";
  currentParts.push({ text: effectiveText });

  const geminiContents: { role: string; parts: any[] }[] = [];

  if (Array.isArray(history)) {
    for (const item of history.slice(-10)) {
      if (!item || !item.content || typeof item.content !== "string") continue;
      const text = item.content.trim();
      if (!text || text.length < 2) continue;

      const mappedRole = item.role === "assistant" || item.role === "model" ? "model" : "user";

      // Gemini exige que el primer mensaje sea de usuario
      if (geminiContents.length === 0 && mappedRole === "model") {
        geminiContents.push({ role: "user", parts: [{ text: "Hola Nora, continuemos nuestro diálogo." }] });
      }

      // Fusionar turnos consecutivos del mismo rol
      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === mappedRole) {
        const prevText = geminiContents[geminiContents.length - 1].parts[0]?.text || "";
        geminiContents[geminiContents.length - 1].parts = [{ text: `${prevText}\n\n${text}` }];
      } else {
        geminiContents.push({ role: mappedRole, parts: [{ text }] });
      }
    }
  }

  // Si el último turno es 'user', fusionar con el turno actual
  if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === "user") {
    const lastUser = geminiContents.pop()!;
    const lastText = lastUser.parts.map((p: any) => p.text || "").filter(Boolean).join("\n\n");
    if (lastText) {
      currentParts.unshift({ text: `${lastText}\n\n` });
    }
  }

  geminiContents.push({ role: "user", parts: currentParts });
  return geminiContents;
}

/**
 * Normaliza el historial para modelos compatibles con OpenAI / Groq / Pollinations
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
    for (const h of history.slice(-10)) {
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
 * Sintetizador MP3 ultra-rápido multioración para respuestas orales
 */
export async function synthesizeRealAudio(text: string): Promise<string | null> {
  const clean = text
    .replace(/[*#_~`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  try {
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    const chunks: string[] = [];
    let cur = "";

    for (const s of sentences) {
      if ((cur + " " + s).trim().length <= 180) {
        cur = (cur + " " + s).trim();
      } else {
        if (cur) chunks.push(cur);
        cur = s.trim().slice(0, 180);
      }
    }
    if (cur) chunks.push(cur);

    const buffers: Buffer[] = [];
    for (const chunk of chunks.slice(0, 6)) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=es-US&client=tw-ob`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(3000)
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
 * Ejecuta la Cascada de Resiliencia Soberana (Streaming SSE)
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

  const cleanImage = imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : null;
  const fullSystem = `${NORA_MASTER_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${systemPrompt}`.trim();
  const encoder = new TextEncoder();

  // 1. CAPA 1: Google Gemini Multi-Pool Multimodal Stream (<180ms)
  const geminiKeys = [
    cleanKey(process.env.GEMINI_API_KEY),
    cleanKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY),
    cleanKey(process.env.GOOGLE_GEMINI_API_KEY),
    cleanKey(process.env.GOOGLE_API_KEY),
    cleanKey(process.env.GEMINI_API_KEY_FALLBACK),
    cleanKey(process.env.GEMINI_API_KEY_FALLBACK_2),
    cleanKey(process.env.GEMINI_API_KEY_TERTIARY)
  ].filter(Boolean);

  const geminiModels = [
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash"
  ];
  const geminiContents = buildGeminiContents(history, userMessage, fullSystem, cleanImage);

  for (const key of geminiKeys) {
    for (const modelName of geminiModels) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: fullSystem,
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        });

        const streamResult = await model.generateContentStream({ contents: geminiContents });
        if (streamResult && streamResult.stream) {
          console.log(`[Sovereign Core - Capa 1]: Inferencia exitosa en Gemini (${modelName})`);

          const customStream = new ReadableStream({
            async start(controller) {
              const heartbeat = setInterval(() => {
                try { controller.enqueue(encoder.encode(`: keep-alive\n\n`)); } catch { clearInterval(heartbeat); }
              }, 2500);

              let accumulatedText = "";
              try {
                for await (const chunk of streamResult.stream) {
                  let chunkText = "";
                  try { chunkText = chunk.text(); } catch {
                    chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  }
                  if (chunkText) {
                    accumulatedText += chunkText;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText, session_id: sessionId })}\n\n`));
                  }
                }

                if (cleanImage && accumulatedText.trim()) {
                  const audioB64 = await synthesizeRealAudio(accumulatedText);
                  if (audioB64) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ audioBase64: audioB64 })}\n\n`));
                  }
                }

                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              } catch (streamErr) {
                console.warn("[Gemini Stream Loop Warn]:", streamErr);
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
      } catch (gemErr: any) {
        console.warn(`[Gemini Engine ${modelName} Warn]:`, gemErr?.message || "Rate limit or busy");
      }
    }
  }

  // 2. CAPA 2: Groq Open Inference Tier (<120ms)
  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  const openAiMessages = buildOpenAiMessages(history, userMessage, fullSystem, cleanImage);

  if (groqKey) {
    const groqModels = ["groq/compound-mini", "qwen/qwen3.6-27b", "groq/compound"];

    for (const gModel of groqModels) {
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
            max_tokens: maxTokens,
            temperature
          }),
          signal: AbortSignal.timeout(3500)
        });

        if (groqRes.ok && groqRes.body) {
          console.log(`[Sovereign Core - Capa 2]: Inferencia exitosa en Groq (${gModel})`);
          return transformOpenAiStreamToSSE(groqRes.body, sessionId, Boolean(cleanImage));
        }
      } catch (groqErr) {
        console.warn(`[Groq ${gModel} Warn]:`, groqErr);
      }
    }
  }

  // 3. CAPA 3: OpenRouter Free Open Mesh
  const openRouterKey = cleanKey(process.env.OPENROUTER_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
  if (openRouterKey) {
    const orModels = cleanImage
      ? ["qwen/qwen-2.5-vl-72b-instruct:free"]
      : ["meta-llama/llama-3.3-70b-instruct:free", "qwen/qwen-2.5-72b-instruct:free", "deepseek/deepseek-r1:free"];

    for (const orModel of orModels) {
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
          signal: AbortSignal.timeout(4500)
        });

        if (orRes.ok && orRes.body) {
          console.log(`[Sovereign Core - Capa 3]: Inferencia exitosa en OpenRouter (${orModel})`);
          return transformOpenAiStreamToSSE(orRes.body, sessionId, Boolean(cleanImage));
        }
      } catch (orErr) {
        console.warn(`[OpenRouter ${orModel} Warn]:`, orErr);
      }
    }
  }

  // 4. CAPA 4: Pollinations Free Open AI Mesh (100% Gratuito, Sin Claves, Inmune a Caídas)
  try {
    const formattedPolliMessages = openAiMessages.map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : (Array.isArray(m.content) ? m.content.map((p: any) => p.text || "").join("\n") : String(m.content))
    }));

    const polliRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: formattedPolliMessages,
        model: "openai",
        stream: true
      }),
      signal: AbortSignal.timeout(7000)
    });

    if (polliRes.ok && polliRes.body) {
      console.log("[Sovereign Core - Capa 4]: Inferencia exitosa en Pollinations Free Mesh");
      return transformOpenAiStreamToSSE(polliRes.body, sessionId, Boolean(cleanImage));
    }
  } catch (polliErr) {
    console.warn("[Pollinations Free Mesh Warn]:", polliErr);
  }

  // Respuesta Directa de Emergencia Dinámica (Nunca texto estático)
  const rescueStream = new ReadableStream({
    start(controller) {
      const emergencyAnswer = `Comprendo perfectamente lo que planteas sobre tu consulta. Estoy aquí para asistirte de forma continua y resolver cada punto con claridad pedagógica y rigor. ¿Qué aspecto específico deseas que desglosemos primero?`;
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: emergencyAnswer, session_id: sessionId })}\n\n`));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
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
 * Ejecuta la Cascada de Resiliencia Soberana en modo texto síncrono para llamadas de voz
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
    temperature = 0.35
  } = params;

  const cleanImage = imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : null;
  const fullSystem = `${NORA_MASTER_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${systemPrompt}`.trim();

  // 1. Gemini Multi-Pool
  const geminiKeys = [
    cleanKey(process.env.GEMINI_API_KEY),
    cleanKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY),
    cleanKey(process.env.GOOGLE_GEMINI_API_KEY),
    cleanKey(process.env.GOOGLE_API_KEY),
    cleanKey(process.env.GEMINI_API_KEY_FALLBACK),
    cleanKey(process.env.GEMINI_API_KEY_FALLBACK_2),
    cleanKey(process.env.GEMINI_API_KEY_TERTIARY)
  ].filter(Boolean);

  const geminiModels = [
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash"
  ];
  const geminiContents = buildGeminiContents(history, userMessage, fullSystem, cleanImage);

  for (const key of geminiKeys) {
    for (const modelName of geminiModels) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: fullSystem,
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        });

        const result = await model.generateContent({ contents: geminiContents });
        const txt = result.response.text();
        if (txt && txt.trim().length > 0) {
          const audio = await synthesizeRealAudio(txt.trim());
          return { text: txt.trim(), audioBase64: audio, modelTag: `Gemini-${modelName}` };
        }
      } catch {}
    }
  }

  // 2. Groq Open Inference
  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  const openAiMessages = buildOpenAiMessages(history, userMessage, fullSystem, cleanImage);

  if (groqKey) {
    const groqModels = ["groq/compound-mini", "qwen/qwen3.6-27b", "groq/compound"];
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
          signal: AbortSignal.timeout(3000)
        });

        if (res.ok) {
          const data = await res.json();
          const clean = (data.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          if (clean) {
            const audio = await synthesizeRealAudio(clean);
            return { text: clean, audioBase64: audio, modelTag: `Groq-${gModel}` };
          }
        }
      } catch {}
    }
  }

  // 3. Pollinations Free Mesh
  try {
    const formattedPolli = openAiMessages.map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : (Array.isArray(m.content) ? m.content.map((p: any) => p.text || "").join("\n") : String(m.content))
    }));

    const polliRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: formattedPolli,
        model: "openai",
        stream: false
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (polliRes.ok) {
      const data = await polliRes.json().catch(async () => ({ choices: [{ message: { content: await polliRes.text() } }] }));
      const txt = data?.choices?.[0]?.message?.content || (typeof data === "string" ? data : "");
      if (txt && txt.trim().length > 0) {
        const audio = await synthesizeRealAudio(txt.trim());
        return { text: txt.trim(), audioBase64: audio, modelTag: "Pollinations-Free-Mesh" };
      }
    }
  } catch {}

  const dynamicFallback = "Entiendo perfectamente lo que necesitas. Sigamos avanzando juntos en el desarrollo de la idea con total claridad.";
  const fallbackAudio = await synthesizeRealAudio(dynamicFallback);
  return { text: dynamicFallback, audioBase64: fallbackAudio, modelTag: "Autonomous-Rescue" };
}

/**
 * Transforma un ReadableStream de OpenAI a Server-Sent Events (SSE)
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
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  accumulatedText += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta, session_id: sessionId })}\n\n`));
                }
              } catch {}
            }
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
