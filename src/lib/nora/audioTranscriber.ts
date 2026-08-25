/**
 * ========================================================================
 * 🎙️ NORAITU AUDIO TRANSCRIBER SOBERANO (WHISPER LARGE V3 TURBO - <120MS)
 * Ubicación: /src/lib/nora/audioTranscriber.ts
 * ========================================================================
 */

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
 * Transcribe un archivo o grabación de audio a texto (<120ms)
 */
export async function transcribeAudioWithWhisper(audio: AudioInput): Promise<string | null> {
  const rawB64 = audio.base64?.includes(",") ? audio.base64.split(",")[1] : audio.base64;
  if (!rawB64 || rawB64.length < 50) return null;

  const mime = audio.mimeType || audio.type || "audio/webm";
  const cleanMime = mime.toLowerCase().includes("mp4") ? "audio/mp4" : "audio/webm";

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
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim().length > 0) {
          console.log(`[Audio Transcriber] 🎙️ Whisper éxito: "${data.text.trim()}"`);
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn("[Whisper Transcriber Warn]:", e);
    }
  }

  return null;
}
