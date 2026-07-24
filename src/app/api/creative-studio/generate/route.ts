import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { optimizeImagePrompt } from "@/app/admin/actions/nora";

export const maxDuration = 60;

const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1024, height: 1024 },
  "3:1": { width: 1200, height: 400 },
};

async function uploadBlobToSupabase(blob: Blob, fileName: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, blob, { contentType: "image/jpeg", cacheControl: "3600", upsert: false });
  if (error) throw new Error("Error subiendo imagen a Supabase: " + error.message);
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function tryGeminiImage(prompt: string, dims: { width: number; height: number }): Promise<Blob | null> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const imageModels = [
      "gemini-2.0-flash-preview-image-generation",
      "imagen-3.0-generate-002",
    ];

    for (const modelName of imageModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await (model as any).generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["image"],
            candidateCount: 1,
          },
        });

        const candidate = result.response?.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (p: any) => p.inlineData?.mimeType?.startsWith("image/")
        );

        if (imagePart?.inlineData?.data) {
          const buffer = Buffer.from(imagePart.inlineData.data, "base64");
          return new Blob([buffer], { type: imagePart.inlineData.mimeType });
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function tryPollinationsPro(prompt: string, dims: { width: number; height: number }, seed: number): Promise<Blob> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?model=flux-pro&width=${dims.width}&height=${dims.height}&enhance=true&nologo=true&seed=${seed}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(50000) });
  if (!response.ok) throw new Error(`Pollinations respondio con ${response.status}`);
  return await response.blob();
}

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio = "16:9", seed, style } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Se requiere un prompt valido." }, { status: 400 });
    }

    const dims = RATIO_DIMENSIONS[aspectRatio] || RATIO_DIMENSIONS["16:9"];
    const finalSeed = seed ?? Math.floor(Math.random() * 1_000_000);
    const fileName = `campaigns/creative_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

    // Step 1: Optimize prompt via Nora
    let refinedPrompt = prompt;
    try {
      refinedPrompt = await optimizeImagePrompt(prompt, style);
    } catch {
      // Non-blocking
    }

    // Step 2: Try Gemini image generation (highest quality)
    let imageBlob: Blob | null = await tryGeminiImage(refinedPrompt, dims);
    let source = "gemini";

    // Step 3: Fallback to Pollinations flux-pro
    if (!imageBlob) {
      source = "pollinations-flux-pro";
      imageBlob = await tryPollinationsPro(refinedPrompt, dims, finalSeed);
    }

    // Step 4: Upload to Supabase
    const imageUrl = await uploadBlobToSupabase(imageBlob, fileName);

    return NextResponse.json({ imageUrl, source, promptUsed: refinedPrompt, seed: finalSeed });
  } catch (error: any) {
    console.error("[creative-studio/generate] Error:", error);
    return NextResponse.json({ error: "Error al generar la imagen: " + error.message }, { status: 500 });
  }
}
