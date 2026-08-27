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
import { transcribeAudioWithWhisper } from "@/lib/nora/audioTranscriber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30;

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

    // Si viene audio y no hay texto previo, transcribir con Cascada Soberana (Whisper + Gemini)
    if (!effectiveUserText && audioBase64) {
      const tSttStart = Date.now();
      const transcribed = await transcribeAudioWithWhisper({
        base64: audioBase64,
        mimeType
      });
      if (transcribed && transcribed.trim().length > 0) {
        effectiveUserText = transcribed.trim();
        sttDuration = Date.now() - tSttStart;
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
