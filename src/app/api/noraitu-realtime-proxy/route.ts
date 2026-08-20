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

/**
 * 🎙️ Transcribe audio con cascada multicanal (Groq Whisper Turbo -> Gemini Flash Audio)
 */
async function transcribeDirectAudio(base64: string, rawMime: string = "audio/webm"): Promise<string | null> {
  const rawB64 = base64.includes(",") ? base64.split(",")[1] : base64;
  if (!rawB64 || rawB64.length < 50) return null;

  const cleanMime = rawMime.toLowerCase().includes("mp4") ? "audio/mp4" : "audio/webm";
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Groq Whisper Large v3 Turbo (Inferencia abierta ultrarrápida ~200ms)
  if (groqKey) {
    try {
      const buffer = Buffer.from(rawB64, "base64");
      const ext = cleanMime.includes("mp4") ? "mp4" : "webm";
      const file = new File([buffer], `audio.${ext}`, { type: cleanMime });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("language", "es");
      formData.append("temperature", "0.0");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey.trim()}` },
        body: formData,
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim().length > 0) {
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn("[Realtime Whisper Warn]:", e);
    }
  }

  // 2. Gemini Multimodal Audio Fallback (Multi-Key)
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2
  ].filter(Boolean) as string[];

  const audioModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

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
                { text: "Transcribe exactamente el mensaje de voz en español. Devuelve únicamente el texto transcripto de forma limpia y directa." }
              ]
            }
          ]
        });
        const txt = result.response.text();
        if (txt && txt.trim().length > 0) {
          return txt.trim();
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
    for (const item of history.slice(-8)) {
      if (!item || !item.content || typeof item.content !== "string") continue;
      const text = item.content.trim();
      if (!text) continue;

      const role = item.role === "assistant" || item.role === "model" ? "model" : "user";

      if (contents.length === 0) {
        if (role === "model") {
          // Gemini requiere que el primer turno sea 'user'
          contents.push({ role: "user", parts: [{ text: "Hola Nora, iniciemos nuestra charla." }] });
        }
        contents.push({ role, parts: [{ text }] });
      } else {
        const last = contents[contents.length - 1];
        if (last.role === role) {
          // Fusionar mensajes consecutivos del mismo rol
          last.parts[0].text += `\n\n${text}`;
        } else {
          contents.push({ role, parts: [{ text }] });
        }
      }
    }
  }

  // Agregar el turno actual del usuario asegurando alternancia
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
  try {
    const { message = "", audioBase64, mimeType = "audio/webm", history = [], mode = "general" } = await req.json();

    let effectiveUserText = (message || "").trim();

    // Si viene audio directo, transcribirlo
    if (!effectiveUserText && audioBase64) {
      const transcribed = await transcribeDirectAudio(audioBase64, mimeType);
      if (transcribed) {
        effectiveUserText = transcribed;
      }
    }

    // Si no se detectó texto ni audio válido, avisar con voz cálida y cercana
    if (!effectiveUserText) {
      const encoder = new TextEncoder();
      return new Response(encoder.encode("Te escucho con atención, contame lo que necesites."), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "x-transcribed-user-text": encodeURIComponent("🎙️ Escuchando...")
        }
      });
    }

    const systemPromptWithMode = `${NORA_PROSODY_SYSTEM_PROMPT}\n\n[MODO CONVERSACIONAL ACTIVO: ${mode.toUpperCase()}]`;

    // 1. CAPA 1: Groq Llama-3.3-70B (Velocidad extrema >300 tokens/s, TTFT ~120ms)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const formattedMessages: any[] = [{ role: "system", content: systemPromptWithMode }];
        if (Array.isArray(history)) {
          for (const h of history.slice(-8)) {
            if (!h || !h.content) continue;
            const mappedRole = h.role === "assistant" || h.role === "model" ? "assistant" : "user";
            formattedMessages.push({ role: mappedRole, content: h.content });
          }
        }
        formattedMessages.push({ role: "user", content: effectiveUserText });

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: formattedMessages,
            temperature: 0.4,
            max_tokens: 300,
            stream: true
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (groqRes.ok && groqRes.body) {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const reader = groqRes.body.getReader();

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
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                          controller.enqueue(encoder.encode(delta));
                        }
                      } catch {}
                    }
                  }
                }
              } catch (e) {
                console.warn("[Groq Realtime Stream Warn]:", e);
              } finally {
                try { controller.close(); } catch {}
              }
            }
          });

          return new Response(customStream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "x-transcribed-user-text": encodeURIComponent(effectiveUserText)
            }
          });
        }
      } catch (groqErr) {
        console.warn("[Realtime Failover] Groq rotando a Gemini...");
      }
    }

    // 2. CAPA 2: Gemini Multi-Key & Multi-Model Failover Pool con Alternancia Blindada
    const geminiKeysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2
    ].filter(Boolean) as string[];

    const geminiModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    const normalizedGeminiContents = buildNormalizedGeminiContents(history, effectiveUserText);

    for (const key of geminiKeysPool) {
      for (const modelName of geminiModels) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPromptWithMode,
            generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
          });

          const activeStream = await model.generateContentStream({ contents: normalizedGeminiContents });

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
                  try { controller.close(); } catch {}
                }
              }
            });

            return new Response(customStream, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "x-transcribed-user-text": encodeURIComponent(effectiveUserText)
              }
            });
          }
        } catch (geminiErr) {
          // Continuar al siguiente modelo/clave silenciosamente
        }
      }
    }

    // 3. CAPA 3: Respuesta empática y continua de rescate (Cero bucles)
    const encoder = new TextEncoder();
    const fallbackText = `Comprendo perfectamente lo que planteas sobre ${effectiveUserText.slice(0, 45)}. Sigamos profundizando en esta idea.`;
    return new Response(encoder.encode(fallbackText), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-transcribed-user-text": encodeURIComponent(effectiveUserText)
      }
    });

  } catch (err: any) {
    console.error("❌ [Realtime Proxy Error]:", err);
    return NextResponse.json({ error: "Error en canal de voz" }, { status: 500 });
  }
}
