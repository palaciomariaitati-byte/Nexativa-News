import { NextResponse } from "next/server";
import { generateHito1PressKit } from "@/modules/nora-pro/press_generator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pressKit = generateHito1PressKit();
    return NextResponse.json({
      success: true,
      data: pressKit
    });
  } catch (error: any) {
    console.error("[NORA Press API] Error al generar kit de prensa:", error);
    return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 });
  }
}
