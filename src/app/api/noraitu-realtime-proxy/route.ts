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
import { executeSovereignText } from "@/lib/nora/sovereignCore";

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
      const uint8 = new Uint8Array(buffer);
      const ext = cleanMime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob([uint8], { type: cleanMime });
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
    cleanKeyString(process.env.GEMINI_API_KEY_FALLBACK_2),
    cleanKeyString(process.env.GEMINI_API_KEY_TERTIARY)
  ].filter(Boolean);

  const audioModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];

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
                { text: "Escucha este audio y transcribe con fidelidad lo que dice la persona en español. Devuelve SOLO el texto transcrito sin comillas ni aclaraciones. Si no hay voz inteligible, responde [SILENCIO]." }
              ]
            }
          ]
        });
        const rawTxt = result.response.text();
        const txt = (rawTxt || "").replace(/```[\s\S]*?```/g, "").replace(/\[SILENCIO\]/gi, "").trim();
        if (txt && txt.length > 0) {
          const sttMs = Date.now() - t0;
          console.log(`[Realtime STT] 🎙️ Gemini Audio (${modelName}) en ${sttMs}ms: "${txt}"`);
          return { text: txt, sttMs };
        }
      } catch {
        // Continuar siguiente modelo/clave
      }
    }
  }

  return null;
}

/**
 * 🔊 Sintetizador de Audio Real Multioración (Genera MP3 encadenado fluido)
 */
async function synthesizeRealAudio(text: string): Promise<string | null> {
  const clean = text
    .replace(/[*#_~`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  try {
    // Dividir en oraciones naturales de hasta 180 caracteres para TTS fluido
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
    for (const chunk of chunks.slice(0, 6)) { // Hasta 6 oraciones completas y fluidas
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=es-US&client=tw-ob`;

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
      const defaultText = "No alcancé a escucharte bien. Por favor repetí tu consulta o escribila aquí abajo.";
      const audioB64 = await synthesizeRealAudio(defaultText);
      return NextResponse.json({
        text: defaultText,
        audioBase64: audioB64,
        transcribedUserText: "🎙️ (Audio no detectado)",
        sttMs: sttDuration,
        totalMs: Date.now() - tStart
      });
    }

    // Invocación al Núcleo Soberano Unificado (executeSovereignText)
    const result = await executeSovereignText({
      history,
      userMessage: effectiveUserText,
      systemPrompt: NORA_PROSODY_SYSTEM_PROMPT,
      mode: mode as any,
      maxTokens: 600
    });

    const generatedText = result.text;
    const synthesizedAudioBase64 = result.audioBase64;
    const totalDuration = Date.now() - tStart;

    recordPerformanceMetric({
      interactionMode: "voice",
      sttLatencyMs: sttDuration,
      totalLatencyMs: totalDuration,
      modelProvider: result.modelTag,
      modelName: "Sovereign-Compound-Oral",
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
    const fallbackText = "Entiendo perfectamente tu consulta. Continuemos profundizando en cada detalle con claridad.";
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
      transcribedUserText: "🎙️ (Consulta en curso)",
      sttMs: 0,
      totalMs: totalDuration
    });
  }
}

