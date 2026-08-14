/**
 * src/app/api/creative-studio/render-pro-video/route.ts
 * API Endpoint en Nexativa News para disparar el renderizado en Nexora Video Studio.
 */

import { NextRequest, NextResponse } from "next/server";
import { nexoraVideoClient } from "@/lib/nexora/videoClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageUrl,
      title,
      subtitle,
      brandName,
      clientLogoUrl,
      accentColor = "#ec4899",
      ctaText = "¡Contáctanos por WhatsApp!",
      format = "vertical",
    } = body;

    if (!imageUrl || !title) {
      return NextResponse.json(
        { error: "Se requieren 'imageUrl' y 'title' obligatorios." },
        { status: 400 }
      );
    }

    // Llamar al microservicio Nexora Video Studio
    const result = await nexoraVideoClient.renderSpot({
      imageUrl,
      title,
      subtitle,
      brandName,
      clientLogoUrl,
      accentColor,
      ctaText,
      format,
    });

    if (!result.success || !result.videoUrl) {
      return NextResponse.json(
        { error: result.error || "El microservicio Nexora Video Studio no pudo completar el renderizado." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      fileName: result.fileName,
      format: result.format,
      message: "¡Spot cinematográfico MP4 1080p renderizado con éxito por Nexora Studio!",
    });
  } catch (error: any) {
    console.error("[API Render Pro Video] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al procesar el spot de video." },
      { status: 500 }
    );
  }
}
