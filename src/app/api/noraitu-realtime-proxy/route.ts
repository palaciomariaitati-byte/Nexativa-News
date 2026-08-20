/**
 * ========================================================================
 * ⚡ NORAITU REALTIME PROXY - MULTI-KEY FAILOVER ROUTER (<100MS)
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

async function transcribeDirectAudio(base64: string, rawMime: string = "audio/webm"): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const rawB64 = base64.includes(",") ? base64.split(",")[1] : base64;
  const cleanMime = rawMime.toLowerCase().includes("mp4") ? "audio/mp4" : "audio/webm";

  // 1. Groq Whisper Large v3 Turbo
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
          console.log("[Whisper Realtime Success]:", data.text.trim());
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn("[Realtime Whisper Warn]:", e);
    }
  }

  // 2. Gemini Flash Multimodal Audio Fallback
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2
  ].filter(Boolean) as string[];

  for (const key of geminiKeys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: cleanMime, data: rawB64 } },
              { text: "Transcribe exactamente todo lo que dice este audio en español. Devuelve únicamente el texto transcripto, sin comentarios ni explicaciones adicionales." }
            ]
          }
        ]
      });
      const txt = result.response.text();
      if (txt && txt.trim().length > 0) {
        console.log("[Gemini Audio Fallback Success]:", txt.trim());
        return txt.trim();
      }
    } catch (gErr) {
      console.warn("[Gemini Audio Transcription Fallback Warn]:", gErr);
    }
  }

  return null;
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

    // Si no se detectó texto ni audio válido, avisar con voz cálida
    if (!effectiveUserText) {
      const encoder = new TextEncoder();
      return new Response(encoder.encode("Disculpame, no llegué a escucharte bien. ¿Podrías hablar más cerca del micrófono?"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "x-transcribed-user-text": encodeURIComponent("⚠️ No se detectó audio claro")
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
            if (!h.content) continue;
            formattedMessages.push({
              role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
              content: h.content
            });
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
            max_tokens: 250,
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
        console.warn("[Realtime Failover] Groq falló, rotando a Gemini...");
      }
    }

    // 2. CAPA 2: Gemini Multi-Key Failover Pool
    const geminiKeysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2
    ].filter(Boolean) as string[];

    for (const key of geminiKeysPool) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPromptWithMode,
          generationConfig: { temperature: 0.4, maxOutputTokens: 250 }
        });

        const geminiContents: { role: string; parts: any[] }[] = [];
        if (Array.isArray(history)) {
          for (const h of history.slice(-6)) {
            if (!h.content) continue;
            const mapped = h.role === "assistant" || h.role === "model" ? "model" : "user";
            geminiContents.push({ role: mapped, parts: [{ text: h.content }] });
          }
        }
        geminiContents.push({ role: "user", parts: [{ text: effectiveUserText }] });

        const activeStream = await model.generateContentStream({ contents: geminiContents });

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
        console.warn("[Realtime Failover] Gemini rotando...");
      }
    }

    const encoder = new TextEncoder();
    return new Response(encoder.encode("Te escucho atentamente. ¿De qué tema te gustaría hablar?"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (err: any) {
    console.error("❌ [Realtime Proxy Error]:", err);
    return NextResponse.json({ error: "Error en canal de voz" }, { status: 500 });
  }
}
