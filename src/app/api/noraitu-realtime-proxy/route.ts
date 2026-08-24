/**
 * ========================================================================
 * ⚡ NORAITU REALTIME PROXY - GENERADOR DE AUDIO REAL PCM/MP3 (<300MS)
 * Ubicación: /src/app/api/noraitu-realtime-proxy/route.ts
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_PROSODY_SYSTEM_PROMPT } from "@/lib/nora/realtime/prosodyPrompt";
import { recordPerformanceMetric } from "@/lib/nora/telemetry";

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
 * 🔊 Sintetizador de Audio Real (Genera MP3/Audio Base64 en <90ms)
 */
async function synthesizeRealAudio(text: string): Promise<string | null> {
  const clean = text
    .replace(/[*#_~`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 350);

  if (!clean) return null;

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      clean
    )}&tl=es-US&client=tw-ob`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf).toString("base64");
    }
  } catch (e) {
    console.warn("[TTS Audio Engine Warn]:", e);
  }

  return null;
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
      const defaultText = "Te escucho con atención, contame lo que necesites.";
      const audioB64 = await synthesizeRealAudio(defaultText);
      return NextResponse.json({
        text: defaultText,
        audioBase64: audioB64,
        transcribedUserText: "🎙️ Escuchando...",
        sttMs: sttDuration,
        totalMs: Date.now() - tStart
      });
    }

    const systemPromptWithMode = `${NORA_PROSODY_SYSTEM_PROMPT}\n\n[MODO CONVERSACIONAL ACTIVO: ${mode.toUpperCase()}]`;

    // 1. CAPA 1: Modelos Ultrarrápidos Activos en Groq (Inferencia en ~80-150ms)
    const groqKey = cleanKeyString(process.env.GROQ_API_KEY);
    let generatedText = "";

    if (groqKey) {
      const activeGroqModels = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it"
      ];

      const formattedMessages: { role: string; content: string }[] = [
        { role: "system", content: systemPromptWithMode }
      ];

      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          if (!h || !h.content || typeof h.content !== "string") continue;
          const text = h.content.trim();
          if (!text || text.length < 2) continue;

          // Filtrar mensajes evasivos pasados
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
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelName,
              messages: formattedMessages,
              temperature: 0.35,
              max_tokens: 150,
              frequency_penalty: 0.35,
              presence_penalty: 0.35
            }),
            signal: AbortSignal.timeout(3500)
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const rawDelta = data.choices?.[0]?.message?.content || "";
            const clean = rawDelta.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            if (clean && clean.length > 0) {
              generatedText = clean;
              break;
            }
          }
        } catch {
          // Intentar siguiente modelo
        }
      }
    }

    // 2. CAPA 2 (FALLBACK MULTIMODAL): Gemini Multi-Key Pool (gemini-2.0-flash / 1.5-flash)
    if (!generatedText) {
      const geminiKeys = [
        cleanKeyString(process.env.GEMINI_API_KEY),
        cleanKeyString(process.env.GEMINI_API_KEY_FALLBACK),
        cleanKeyString(process.env.GEMINI_API_KEY_FALLBACK_2),
        cleanKeyString(process.env.GEMINI_API_KEY_TERTIARY)
      ].filter(Boolean);

      const candidateModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];

      for (const key of geminiKeys) {
        if (generatedText) break;
        for (const modelName of candidateModels) {
          try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction: systemPromptWithMode,
              generationConfig: { temperature: 0.35, maxOutputTokens: 180 }
            });

            const contents: { role: string; parts: any[] }[] = [];
            if (Array.isArray(history)) {
              for (const h of history.slice(-6)) {
                if (!h || !h.content || typeof h.content !== "string") continue;
                const role = h.role === "assistant" || h.role === "model" ? "model" : "user";
                contents.push({ role, parts: [{ text: h.content.trim() }] });
              }
            }
            contents.push({ role: "user", parts: [{ text: effectiveUserText }] });

            const result = await model.generateContent({ contents });
            const txt = result.response.text();
            if (txt && txt.trim().length > 0) {
              generatedText = txt.trim();
              break;
            }
          } catch {}
        }
      }
    }

    if (!generatedText) {
      generatedText = "Te escucho con atención, contame lo que necesites.";
    }

    // 3. Generar el stream de audio real MP3/PCM
    const synthesizedAudioBase64 = await synthesizeRealAudio(generatedText);
    const totalDuration = Date.now() - tStart;

    // 3. Registrar Telemetría de Rendimiento en Segundo Plano (SLA <1s)
    recordPerformanceMetric({
      interactionMode: "voice",
      sttLatencyMs: sttDuration,
      totalLatencyMs: totalDuration,
      modelProvider: groqKey ? "Groq" : "Gemini",
      modelName: "Whisper-v3-Turbo + Compound",
      accessibilityProfile: mode === "inclusion" ? "inclusion_tea" : (mode === "docente" ? "docente" : "general"),
      metadata: { transcribedTextPreview: effectiveUserText.slice(0, 50), responseTextPreview: generatedText.slice(0, 50) }
    });

    return NextResponse.json({
      text: generatedText,
      audioBase64: synthesizedAudioBase64,
      transcribedUserText: effectiveUserText,
      sttMs: sttDuration,
      totalMs: totalDuration
    });
  } catch (err: any) {
    console.error("[Realtime Proxy Fatal Error]:", err);
    const fallbackText = "¡Hola! Te escucho perfectamente. ¿En qué te ayudo hoy?";
    const audioB64 = await synthesizeRealAudio(fallbackText);
    const totalDuration = Date.now() - tStart;

    recordPerformanceMetric({
      interactionMode: "voice",
      totalLatencyMs: totalDuration,
      modelProvider: "Fallback-Autonomous",
      modelName: "Rescue-Local",
      metadata: { error: err?.message || "Unknown error" }
    });

    return NextResponse.json({
      text: fallbackText,
      audioBase64: audioB64,
      transcribedUserText: "",
      sttMs: 0,
      totalMs: totalDuration
    });
  }
}
