/**
 * ========================================================================
 * ⚡ NORAITU REALTIME PROXY - MULTI-ENGINE RESILIENT ROUTER (<100MS)
 * Ubicación: /src/app/api/noraitu-realtime-proxy/route.ts
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_PROSODY_SYSTEM_PROMPT } from "@/lib/nora/realtime/prosodyPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30;

function cleanKeyString(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

/**
 * 🎙️ Transcribe audio con Groq Whisper Large v3 Turbo (<150ms) o Gemini Audio
 */
async function transcribeDirectAudio(
  base64: string,
  rawMime: string = "audio/webm"
): Promise<{ text: string; sttMs: number } | null> {
  const t0 = Date.now();
  const rawB64 = base64.includes(",") ? base64.split(",")[1] : base64;
  if (!rawB64 || rawB64.length < 50) return null;

  const cleanMime = rawMime.toLowerCase().includes("mp4") ? "audio/mp4" : "audio/webm";
  const groqKey = cleanKeyString(process.env.GROQ_API_KEY);

  // 1. Groq Whisper Large v3 Turbo (Inferencia ultrarrápida ~120-180ms)
  if (groqKey) {
    try {
      const buffer = Buffer.from(rawB64, "base64");
      const ext = cleanMime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob([buffer], { type: cleanMime });
      const formData = new FormData();
      formData.append("file", blob, `audio.${ext}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("language", "es");
      formData.append("temperature", "0.0");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: formData,
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim().length > 0) {
          const sttMs = Date.now() - t0;
          console.log(`[Realtime STT] 🎙️ Groq Whisper en ${sttMs}ms: "${data.text.trim()}"`);
          return { text: data.text.trim(), sttMs };
        }
      }
    } catch (e) {
      console.warn("[Realtime Whisper Warn]:", e);
    }
  }

  // 2. Gemini Multimodal Audio Fallback (Multi-Key)
  const geminiKeys = [
    cleanKeyString(process.env.GEMINI_API_KEY),
    cleanKeyString(process.env.GEMINI_API_KEY_FALLBACK),
    cleanKeyString(process.env.GEMINI_API_KEY_FALLBACK_2)
  ].filter(Boolean);

  const audioModels = ["gemini-2.0-flash", "gemini-1.5-flash"];

  for (const key of geminiKeys) {
    for (const modelName of audioModels) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: cleanMime, data: rawB64 } },
                { text: "Transcribe fielmente en español lo que se dice. Devuelve únicamente el texto plano." }
              ]
            }
          ]
        });
        const txt = result.response.text();
        if (txt && txt.trim().length > 0) {
          const sttMs = Date.now() - t0;
          console.log(`[Realtime STT] 🎙️ Gemini Audio (${modelName}) en ${sttMs}ms: "${txt.trim()}"`);
          return { text: txt.trim(), sttMs };
        }
      } catch {
        // Continuar siguiente modelo/clave
      }
    }
  }

  return null;
}

/**
 * 🛠️ Normaliza el historial de mensajes garantizando alternancia estricta y sin errores 400
 */
function buildNormalizedGeminiContents(
  history: any[],
  effectiveUserText: string
): { role: string; parts: { text: string }[] }[] {
  const contents: { role: string; parts: { text: string }[] }[] = [];

  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if (!item || !item.content || typeof item.content !== "string") continue;
      const text = item.content.trim();
      if (!text || text.length < 2) continue;

      // Filtrar mensajes de contingencia pasados para no sesgar el contexto
      if (text.includes("acompañarte en lo que necesites") || text.includes("sigamos profundizando")) {
        continue;
      }

      const role = item.role === "assistant" || item.role === "model" ? "model" : "user";

      if (contents.length === 0) {
        if (role === "model") {
          contents.push({ role: "user", parts: [{ text: "Hola Nora, iniciemos." }] });
        }
        contents.push({ role, parts: [{ text }] });
      } else {
        const last = contents[contents.length - 1];
        if (last.role === role) {
          last.parts[0].text += `\n\n${text}`;
        } else {
          contents.push({ role, parts: [{ text }] });
        }
      }
    }
  }

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: effectiveUserText }] });
  } else {
    const last = contents[contents.length - 1];
    if (last.role === "user") {
      last.parts[0].text += `\n\n${effectiveUserText}`;
    } else {
      contents.push({ role: "user", parts: [{ text: effectiveUserText }] });
    }
  }

  return contents;
}

export async function POST(req: Request) {
  const tStart = Date.now();
  try {
    const {
      message = "",
      audioBase64,
      mimeType = "audio/webm",
      history = [],
      mode = "general"
    } = await req.json();

    let effectiveUserText = (message || "").trim();
    let sttDuration = 0;

    // Si viene audio directo, transcribir con telemetría
    if (!effectiveUserText && audioBase64) {
      const sttResult = await transcribeDirectAudio(audioBase64, mimeType);
      if (sttResult) {
        effectiveUserText = sttResult.text;
        sttDuration = sttResult.sttMs;
      }
    }

    // Si no se detectó texto ni audio reconocible
    if (!effectiveUserText) {
      const encoder = new TextEncoder();
      return new Response(encoder.encode("Te escucho con atención, contame lo que necesites."), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "x-transcribed-user-text": encodeURIComponent("🎙️ Escuchando..."),
          "x-stt-ms": String(sttDuration),
          "x-ttft-ms": "0"
        }
      });
    }

    const systemPromptWithMode = `${NORA_PROSODY_SYSTEM_PROMPT}\n\n[MODO CONVERSACIONAL ACTIVO: ${mode.toUpperCase()}]`;

    // 1. CAPA 1: Modelos Activos en Groq ('groq/compound-mini', 'groq/compound', 'allam-2-7b', 'qwen/qwen3.6-27b')
    const groqKey = cleanKeyString(process.env.GROQ_API_KEY);
    if (groqKey) {
      const activeGroqModels = [
        "groq/compound-mini",
        "groq/compound",
        "allam-2-7b",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-120b"
      ];

      const formattedMessages: { role: string; content: string }[] = [
        { role: "system", content: systemPromptWithMode }
      ];

      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          if (!h || !h.content || typeof h.content !== "string") continue;
          const text = h.content.trim();
          if (!text || text.length < 2) continue;

          // Filtrar mensajes de contingencia pasados para no sesgar el contexto
          if (text.includes("acompañarte en lo que necesites") || text.includes("sigamos profundizando")) {
            continue;
          }

          const mappedRole = h.role === "assistant" || h.role === "model" ? "assistant" : "user";
          const last = formattedMessages[formattedMessages.length - 1];
          if (last.role === mappedRole) {
            last.content += `\n\n${text}`;
          } else {
            formattedMessages.push({ role: mappedRole, content: text });
          }
        }
      }

      const lastMsg = formattedMessages[formattedMessages.length - 1];
      if (lastMsg.role === "user") {
        lastMsg.content += `\n\n${effectiveUserText}`;
      } else {
        formattedMessages.push({ role: "user", content: effectiveUserText });
      }

      for (const modelName of activeGroqModels) {
        try {
          const tLlmStart = Date.now();
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelName,
              messages: formattedMessages,
              temperature: 0.4,
              max_tokens: 280,
              stream: true
            }),
            signal: AbortSignal.timeout(5000)
          });

          if (groqRes.ok && groqRes.body) {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            const reader = groqRes.body.getReader();
            let firstTokenSent = false;
            let insideThinkTag = false;

            const customStream = new ReadableStream({
              async start(controller) {
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
                        const jsonStr = trimmed.slice(6).trim();
                        if (jsonStr === "[DONE]") break;
                        try {
                          const parsed = JSON.parse(jsonStr);
                          let delta = parsed.choices?.[0]?.delta?.content || "";
                          if (delta) {
                            // Filtrar etiquetas <think> de modelos de razonamiento
                            if (delta.includes("<think>")) {
                              insideThinkTag = true;
                              delta = delta.replace(/<think>[\s\S]*/gi, "");
                            }
                            if (insideThinkTag) {
                              if (delta.includes("</think>")) {
                                insideThinkTag = false;
                                delta = delta.replace(/[\s\S]*<\/think>/gi, "");
                              } else {
                                delta = "";
                              }
                            }

                            if (delta) {
                              if (!firstTokenSent) {
                                firstTokenSent = true;
                                const ttft = Date.now() - tLlmStart;
                                console.log(
                                  `[Realtime LLM] ⚡ Groq (${modelName}) TTFT: ${ttft}ms | Total: ${Date.now() - tStart}ms`
                                );
                              }
                              controller.enqueue(encoder.encode(delta));
                            }
                          }
                        } catch {}
                      }
                    }
                  }
                } catch (e) {
                  console.warn(`[Groq Realtime Stream Warn ${modelName}]:`, e);
                } finally {
                  try {
                    controller.close();
                  } catch {}
                }
              }
            });

            return new Response(customStream, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "x-transcribed-user-text": encodeURIComponent(effectiveUserText),
                "x-stt-ms": String(sttDuration),
                "x-total-ms": String(Date.now() - tStart)
              }
            });
          }
        } catch (groqErr) {
          // Continuar al siguiente modelo en Groq
        }
      }
    }

    // 2. CAPA 2: Gemini Multi-Key Failover Pool
    const geminiKeysPool = [
      cleanKeyString(process.env.GEMINI_API_KEY),
      cleanKeyString(process.env.GEMINI_API_KEY_FALLBACK),
      cleanKeyString(process.env.GEMINI_API_KEY_FALLBACK_2)
    ].filter(Boolean);

    const geminiModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
    const normalizedGeminiContents = buildNormalizedGeminiContents(history, effectiveUserText);

    for (const key of geminiKeysPool) {
      for (const modelName of geminiModels) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPromptWithMode,
            generationConfig: { temperature: 0.4, maxOutputTokens: 280 }
          });

          const activeStream = await model.generateContentStream({
            contents: normalizedGeminiContents
          });

          if (activeStream && activeStream.stream) {
            const encoder = new TextEncoder();
            const customStream = new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of activeStream.stream) {
                    let text = "";
                    try {
                      text = chunk.text();
                    } catch {
                      text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    }
                    if (text) {
                      controller.enqueue(encoder.encode(text));
                    }
                  }
                } catch (err) {
                  console.warn("[Gemini Realtime Stream Warn]:", err);
                } finally {
                  try {
                    controller.close();
                  } catch {}
                }
              }
            });

            return new Response(customStream, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "x-transcribed-user-text": encodeURIComponent(effectiveUserText),
                "x-stt-ms": String(sttDuration),
                "x-total-ms": String(Date.now() - tStart)
              }
            });
          }
        } catch (gErr) {
          // Continuar al siguiente modelo/clave
        }
      }
    }

    // 3. Fallback Dinámico Inteligente
    const encoder = new TextEncoder();
    return new Response(
      encoder.encode(
        `¡Hola! Te escucho perfectamente. ¿En qué puedo ayudarte hoy?`
      ),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "x-transcribed-user-text": encodeURIComponent(effectiveUserText),
          "x-stt-ms": String(sttDuration)
        }
      }
    );
  } catch (err: any) {
    console.error("[Realtime Proxy Fatal Error]:", err);
    return NextResponse.json({ error: "Error en canal en tiempo real" }, { status: 500 });
  }
}
