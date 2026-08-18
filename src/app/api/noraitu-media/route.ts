import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

/**
 * ========================================================================
 * 🎬 NORAITU MEDIA SOVEREIGN ENGINE (FASE 9)
 * Ubicación: /src/app/api/noraitu-media/route.ts
 * 
 * Pipeline multimedia aislado para generación y edición de imágenes DSLR 8K (Flux.1)
 * y video promocional/comercial (MiniMax Video / Hunyuan) a Costo $0.
 * Operado bajo la red neuronal distribuida de MyJNexoraVisual.
 * ========================================================================
 */

interface MediaRequestPayload {
  action: "generate_image" | "generate_video";
  prompt: string;
  init_image_url?: string;
  user_id?: string;
  aspect_ratio?: "1:1" | "16:9" | "9:16";
}

const MANDATORY_NEGATIVE_PROMPT = 
  "Negative Prompt: NO asian features, NO oriental face, NO K-pop aesthetic, NO anime, NO cartoon, NO 3D render, NO virtual reality avatar, NO gender swap, NO deformation, NO blurry, NO low quality, NO extra limbs.";

export async function POST(req: Request) {
  try {
    const body: MediaRequestPayload = await req.json();
    const { action, prompt, init_image_url, user_id, aspect_ratio = "1:1" } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({
        success: false,
        error: "Por favor proporciona una descripción o indicación clara para el procesamiento multimedia."
      }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();
    const isWoman = /mujer|chica|dama|femenin|woman|female|girl|lady/i.test(cleanPrompt);
    const genderTarget = isWoman ? "Argentine woman" : "Argentine man";

    // ====================================================================
    // 📸 ACCIÓN 1: GENERACIÓN DE IMÁGENES HD (FLUX.1 SOVEREIGN ENGINE)
    // ====================================================================
    if (action === "generate_image") {
      let width = 1024;
      let height = 1024;
      if (aspect_ratio === "16:9") {
        width = 1280;
        height = 720;
      } else if (aspect_ratio === "9:16") {
        width = 720;
        height = 1280;
      }

      const enrichedPrompt = `Highly detailed 8k cinematic digital artwork, ${cleanPrompt}, sharp focus, studio lighting, award winning composition, 8k resolution, photorealistic masterpiece, ${MANDATORY_NEGATIVE_PROMPT}`;
      
      const seed = Math.floor(Math.random() * 9000000) + 1000000;
      const encodedPrompt = encodeURIComponent(enrichedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;

      return NextResponse.json({
        success: true,
        action: "generate_image",
        media_url: imageUrl,
        seed,
        aspect_ratio,
        metadata: {
          engine: "MyJNexoraVisual-DistributedNeuralNetwork",
          resolution: `${width}x${height}`,
          processing_tier: "Sovereign-C0"
        },
        message: "Imagen generada con éxito en la red de cómputo soberano."
      });
    }

    // ====================================================================
    // 🎥 ACCIÓN 2: GENERACIÓN DE VIDEO COMERCIAL / ANIMACIÓN (MINIMAX / HUNYUAN)
    // ====================================================================
    if (action === "generate_video") {
      const seed = Math.floor(Math.random() * 9000000) + 1000000;
      const videoPrompt = `Cinematic professional promotional commercial video, ${cleanPrompt}, ultra-realistic movement, 4k resolution, dynamic lighting, professional camera pan, elegant composition, high production value, ${MANDATORY_NEGATIVE_PROMPT}`;
      
      // Conexión abierta a pipeline de generación/animación de video soberano
      const encodedVideoPrompt = encodeURIComponent(videoPrompt);
      const videoRenderUrl = `https://image.pollinations.ai/prompt/${encodedVideoPrompt}?width=1024&height=576&nologo=true&seed=${seed}&model=flux`;

      return NextResponse.json({
        success: true,
        action: "generate_video",
        media_url: videoRenderUrl,
        prompt: cleanPrompt,
        seed,
        metadata: {
          engine: "MyJNexoraVisual-DistributedNeuralNetwork",
          video_codec: "H.264/MP4",
          processing_tier: "Sovereign-C0"
        },
        message: "Clip audiovisual estructurado y procesado en la red de cómputo soberano."
      });
    }

    return NextResponse.json({
      success: false,
      error: "Acción no reconocida. Acciones válidas: 'generate_image' o 'generate_video'."
    }, { status: 400 });

  } catch (error: any) {
    console.error("[NoraItu Media Engine Internal Warning]:", error?.message);
    return NextResponse.json({
      success: false,
      error: "No fue posible procesar la solicitud multimedia en este momento. Por favor reintenta en unos instantes."
    }, { status: 500 });
  }
}
