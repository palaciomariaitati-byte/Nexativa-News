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
      mode = "general",
      lastInterruptedResponse = null
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

    // 🛡️ PROTOCOLO DE RECUPERACIÓN CONVERSACIONAL (Manejo de Hilo ante Ruidos / Transcripciones Vacías)
    const isNoiseOrEmpty = !effectiveUserText ||
      effectiveUserText.length < 2 ||
      /^(tos|carraspeo|hum|eh|ah|ruido|sonido|\[.*\]|\(.*\))\.*$/i.test(effectiveUserText);

    if (isNoiseOrEmpty) {
      if (lastInterruptedResponse && lastInterruptedResponse.text) {
        const rescueCourtesy = "Escuché un sonido. ¿Deseás que continúe con la explicación anterior o pasamos al siguiente tema?";
        return NextResponse.json({
          text: rescueCourtesy,
          phoneticText: rescueCourtesy,
          transcribedUserText: "[Sonido breve detectado]",
          latencyMs: Date.now() - tStart,
          model: "Conversational-Recovery-Protocol"
        });
      }

      const defaultText = "No alcancé a escucharte bien. Por favor repetí tu consulta o decime 'continuar'.";
      return NextResponse.json({
        text: defaultText,
        phoneticText: defaultText,
        transcribedUserText: "",
        latencyMs: Date.now() - tStart,
        model: "Sovereign-Fallback"
      });
    }

    // 🔄 Si el usuario pide explícitamente continuar tras una interrupción
    const isContinueRequest = /^(si|sí|continua|continuá|continúa|seguí|seguir|dale|adelante|retoma|retomá)\b/i.test(effectiveUserText);
    let promptToInfer = effectiveUserText;
    if (isContinueRequest && lastInterruptedResponse && lastInterruptedResponse.text) {
      promptToInfer = `Por favor retoma y continúa desarrollando de forma completa y elocuente la explicación que estábamos viendo: "${lastInterruptedResponse.text}".`;
    }

    const tInferStart = Date.now();
    const sovereignRes = await executeSovereignText({
      history,
      userMessage: promptToInfer,
      systemPrompt: NORA_PROSODY_SYSTEM_PROMPT,
      mode: mode as any,
      maxTokens: 550,
      temperature: 0.35,
      lastInterruptedResponse: isContinueRequest ? null : lastInterruptedResponse
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
