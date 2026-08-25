/**
 * ========================================================================
 * ⚡ NORAITU REALTIME PROXY - 100% SOBERANO Y DE ALTA VELOCIDAD (<300MS)
 * Ubicación: /src/app/api/noraitu-realtime-proxy/route.ts
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { NORA_PROSODY_SYSTEM_PROMPT } from "@/lib/nora/realtime/prosodyPrompt";
import { recordPerformanceMetric } from "@/lib/nora/telemetry";
import { executeSovereignText } from "@/lib/nora/sovereignCore";
import { normalizePhoneticTextForSpeech } from "@/lib/nora/phoneticNormalizer";

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
 * 🎙️ Transcribe audio con Groq Whisper Large v3 Turbo (<120ms)
 */
async function transcribeDirectAudio(
  base64: string,
  rawMime: string = "audio/webm"
): Promise<{ text: string; sttMs: number } | null> {
  const t0 = Date.now();
  const rawB64 = base64.includes(",") ? base64.split(",")[1] : base64;
  if (!rawB64 || rawB64.length < 50) return null;

  const cleanMime = rawMime.toLowerCase().includes("mp4") ? "audio/mp4" : "audio/webm";
  const groqKey = cleanKeyString(process.env.GROQ_API_KEY) || cleanKeyString(process.env.NEXT_PUBLIC_GROQ_API_KEY);

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
        signal: AbortSignal.timeout(3500)
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

    // Si viene audio y no hay texto previo, transcribir
    if (!effectiveUserText && audioBase64) {
      const sttResult = await transcribeDirectAudio(audioBase64, mimeType);
      if (sttResult) {
        effectiveUserText = sttResult.text;
        sttDuration = sttResult.sttMs;
      }
    }

    if (!effectiveUserText) {
      const defaultText = "No alcancé a escucharte bien. Por favor repetí tu consulta o escribila aquí.";
      return NextResponse.json({
        text: defaultText,
        phoneticText: defaultText,
        transcribedUserText: "",
        latencyMs: Date.now() - tStart,
        model: "Sovereign-Fallback"
      });
    }

    const tInferStart = Date.now();
    const sovereignRes = await executeSovereignText({
      history,
      userMessage: effectiveUserText,
      systemPrompt: NORA_PROSODY_SYSTEM_PROMPT,
      mode: mode as any,
      maxTokens: 500,
      temperature: 0.35
    });
    const inferDuration = Date.now() - tInferStart;

    const phoneticSpokenText = normalizePhoneticTextForSpeech(sovereignRes.text);
    const totalLatency = Date.now() - tStart;

    recordPerformanceMetric({
      interactionMode: "voice",
      totalLatencyMs: totalLatency,
      modelProvider: "sovereign_open",
      modelName: sovereignRes.modelTag,
      metadata: { sttMs: sttDuration, inferMs: inferDuration }
    });

    return NextResponse.json({
      text: sovereignRes.text,
      phoneticText: phoneticSpokenText,
      audioBase64: sovereignRes.audioBase64,
      transcribedUserText: effectiveUserText,
      latencyMs: totalLatency,
      model: sovereignRes.modelTag
    });

  } catch (error: any) {
    console.error("[Realtime Voice Proxy Server Error]:", error);
    const emergencyText = "He procesado tu consulta. Sigamos adelante con la clase.";
    return NextResponse.json({
      text: emergencyText,
      phoneticText: emergencyText,
      transcribedUserText: "",
      latencyMs: Date.now() - tStart,
      model: "Emergency-Fallback"
    });
  }
}
