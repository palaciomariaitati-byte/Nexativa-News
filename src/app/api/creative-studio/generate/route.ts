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
      "gemini-3.1-flash-image",
      "gemini-2.5-flash-image",
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

async function tryPollinationsFlux(prompt: string, dims: { width: number; height: number }, seed: number): Promise<{ blob: Blob; directUrl: string }> {
  const encoded = encodeURIComponent(prompt);
  const directUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=${dims.width}&height=${dims.height}&nologo=true&seed=${seed}`;
  const response = await fetch(directUrl, { signal: AbortSignal.timeout(35000) });
  if (!response.ok) throw new Error(`Pollinations respondió con estado ${response.status}`);
  const blob = await response.blob();
  return { blob, directUrl };
}

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio = "9:16", seed, style } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Se requiere un brief o prompt válido." }, { status: 400 });
    }

    const dims = RATIO_DIMENSIONS[aspectRatio] || RATIO_DIMENSIONS["9:16"];
    const finalSeed = seed ?? Math.floor(Math.random() * 1_000_000);
    const fileName = `campaigns/flyer_3d_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

    // Paso 1: Optimizar prompt comercial via Nora
    let refinedPrompt = prompt;
    try {
      refinedPrompt = await optimizeImagePrompt(prompt, style);
    } catch {
      // Non-blocking
    }

    let imageUrl = "";
    let source = "pollinations-flux-3d";

    // Paso 2: Generar imagen fotorrealista 3D
    try {
      const { blob, directUrl } = await tryPollinationsFlux(refinedPrompt, dims, finalSeed);
      try {
        imageUrl = await uploadBlobToSupabase(blob, fileName);
      } catch (uploadErr) {
        console.warn("[creative-studio/generate] Advertencia subiendo a Supabase, usando URL directa:", uploadErr);
        imageUrl = directUrl;
      }
    } catch (pollErr: any) {
      console.warn("[creative-studio/generate] Fallback secundario directo:", pollErr);
      const encoded = encodeURIComponent(refinedPrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=${dims.width}&height=${dims.height}&nologo=true&seed=${finalSeed}`;
    }

    return NextResponse.json({ 
      imageUrl, 
      source, 
      promptUsed: refinedPrompt, 
      seed: finalSeed,
      aspectRatio 
    });
  } catch (error: any) {
    console.error("[creative-studio/generate] Error crítico:", error);
    return NextResponse.json({ error: "Error al generar la pieza publicitaria: " + error.message }, { status: 500 });
  }
}
