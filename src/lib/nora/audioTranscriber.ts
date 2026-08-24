/**
 * ========================================================================
 * 🎙️ NORAITU AUDIO TRANSCRIBER SOBERANO (WHISPER + GEMINI AUDIO MULTI-KEY)
 * Ubicación: /src/lib/nora/audioTranscriber.ts
 * ========================================================================
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

export interface AudioInput {
  base64: string;
  mimeType?: string;
  type?: string;
  name?: string;
}

/**
 * Transcribe un archivo o grabación de audio a texto (<200ms)
 */
export async function transcribeAudioWithWhisper(audio: AudioInput): Promise<string | null> {
  const rawB64 = audio.base64?.includes(",") ? audio.base64.split(",")[1] : audio.base64;
  if (!rawB64 || rawB64.length < 50) return null;

  const mime = audio.mimeType || audio.type || "audio/webm";
  const cleanMime = mime.toLowerCase().includes("mp4") ? "audio/mp4" : "audio/webm";

  // 1. CAPA 1: Groq Whisper Large v3 Turbo (Inferencia ultrarrápida ~120ms)
  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
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
        signal: AbortSignal.timeout(4500)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim().length > 0) {
          console.log(`[Audio Transcriber] 🎙️ Groq Whisper éxito: "${data.text.trim()}"`);
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn("[Groq Whisper Transcriber Warn]:", e);
    }
  }

  // 2. CAPA 2: Gemini Multimodal Audio (Multi-Key)
  const geminiKeys = [
    cleanKey(process.env.GEMINI_API_KEY),
    cleanKey(process.env.GEMINI_API_KEY_FALLBACK),
    cleanKey(process.env.GEMINI_API_KEY_FALLBACK_2),
    cleanKey(process.env.GEMINI_API_KEY_TERTIARY)
  ].filter(Boolean);

  const audioModels = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.5-flash"];

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
                { text: "Transcribe fielmente lo que dice la persona en español. Devuelve ÚNICAMENTE el texto hablado exacto, sin comillas, sin introducciones ni notas." }
              ]
            }
          ]
        });

        const txt = result.response.text().trim();
        if (txt && txt.length > 0) {
          console.log(`[Audio Transcriber] 🎙️ Gemini Audio (${modelName}) éxito: "${txt}"`);
          return txt;
        }
      } catch (gemErr) {
        console.warn(`[Gemini Audio ${modelName} Warn]:`, gemErr);
      }
    }
  }

  return null;
}
