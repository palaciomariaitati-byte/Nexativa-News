import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 120; // Hasta 2 minutos para renderizado de video MP4

async function uploadBufferToSupabase(buffer: Buffer, fileName: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, buffer, { contentType: "video/mp4", cacheControl: "3600", upsert: true });
  if (error) throw new Error("Error subiendo video a Supabase: " + error.message);
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio = "16:9", seed = Math.floor(Math.random() * 1000000) } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Se requiere un prompt publicitario válido para el video." }, { status: 400 });
    }

    console.log(`[CREATIVE VIDEO API] 🎬 Iniciando generación de Video Faux-CGI con prompt: "${prompt.substring(0, 100)}..."`);

    // 1. Intento principal con Hugging Face Inference API Token (Wan 2.1 Video)
    const hfToken = process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN;
    let videoBuffer: Buffer | null = null;
    let source = "wan-2.1-gpu";

    if (hfToken) {
      try {
        const hfRes = await fetch("https://api-inference.huggingface.co/models/Wan-AI/Wan2.1-T2V-1.4B", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfToken}`,
            "Content-Type": "application/json",
            "X-Wait-For-Model": "true"
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { num_frames: 81, fps: 16 }
          })
        });

        if (hfRes.ok) {
          const arrayBuf = await hfRes.arrayBuffer();
          videoBuffer = Buffer.from(arrayBuf);
        }
      } catch (hfErr) {
        console.warn("[CREATIVE VIDEO API] HF Wan 2.1 ocupado o no disponible:", hfErr);
      }
    }

    // 2. Fallback de Alta Disponibilidad $0 (Pollinations AI Video Engine)
    if (!videoBuffer) {
      source = "pollinations-video-engine";
      const encodedPrompt = encodeURIComponent(prompt);
      const videoFetchUrl = `https://video.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&nologo=true`;
      
      console.log("[CREATIVE VIDEO API] Conectando con motor de video Pollinations:", videoFetchUrl);
      const pollRes = await fetch(videoFetchUrl, { signal: AbortSignal.timeout(90000) });
      
      if (!pollRes.ok) {
        throw new Error(`El motor de video libre devolvió estado ${pollRes.status}`);
      }
      
      const arrayBuf = await pollRes.arrayBuffer();
      videoBuffer = Buffer.from(arrayBuf);
    }

    if (!videoBuffer || videoBuffer.length === 0) {
      throw new Error("No se pudo obtener un archivo de video válido.");
    }

    // 3. Subir el video .mp4 a Supabase Storage
    const fileName = `campaigns/video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp4`;
    const videoUrl = await uploadBufferToSupabase(videoBuffer, fileName);

    console.log(`[CREATIVE VIDEO API] ✅ Video generado y subido con éxito: ${videoUrl}`);

    return NextResponse.json({
      videoUrl,
      source,
      promptUsed: prompt,
      seed
    });

  } catch (error: any) {
    console.error("[CREATIVE VIDEO API ERROR]:", error);
    return NextResponse.json({ error: "Fallo en la creación del spot de video: " + error.message }, { status: 500 });
  }
}
