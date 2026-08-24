/**
 * ========================================================================
 * 👁️ NORAITU LIVE - AUDITORÍA VISUAL Y CÁMARA TITÁN EN TIEMPO REAL
 * Ubicación: /src/app/api/noraitu-live/route.ts
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { executeSovereignStream } from "@/lib/nora/sovereignCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { imageBase64, userPrompt = "", mode = "visual" } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Frame de imagen requerido para Cámara Titán." }, { status: 400 });
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const queryDirective = userPrompt && userPrompt.trim()
      ? `[CONSULTA DEL USUARIO EN VIVO]: "${userPrompt.trim()}". Responde de inmediato con base en la captura de la Cámara Titán.`
      : `Describe con precisión pedagógica y referencias espaciales inmediatas ("Frente a ti...", "A la derecha...") qué estás observando en esta toma en vivo de la Cámara Titán.`;

    return await executeSovereignStream({
      userMessage: queryDirective,
      imageBase64: cleanBase64,
      mode: (mode || "visual") as any,
      maxTokens: 400,
      temperature: 0.25
    });
  } catch (error: any) {
    console.error("❌ [Titán Live Route Error]:", error);
    return NextResponse.json({ error: "Error en el pipeline visual de Cámara Titán." }, { status: 500 });
  }
}
