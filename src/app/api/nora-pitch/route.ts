import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";
import { generatePersonalizedPitch, JournalistTarget } from "@/modules/nora-pro/press_pitching";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mediaOutlet, email, specialty = "General" } = body;

    if (!name || !mediaOutlet || !email) {
      return NextResponse.json({ success: false, error: "name, mediaOutlet y email son requeridos." }, { status: 400 });
    }

    const journalist: JournalistTarget = { name, mediaOutlet, email, specialty };
    const pitch = generatePersonalizedPitch(journalist);

    // Intentar registrar en Supabase (press_outreach_logs) si la tabla existe
    try {
      await supabaseAdmin.from("press_outreach_logs").insert([{
        journalist_name: name,
        media_outlet: mediaOutlet,
        email,
        specialty,
        status: "SENT",
        pitch_subject: pitch.subject,
        pitch_body: pitch.body,
        last_contacted_at: new Date().toISOString()
      }]);
    } catch (dbErr) {
      console.warn("[NORA Pitch API] No se pudo registrar en la base de datos (tabla no creada aún):", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Pitch generado con éxito para ${name} (${mediaOutlet}).`,
      pitch
    });
  } catch (err: any) {
    console.error("[NORA Pitch API] Error crítico:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno." }, { status: 500 });
  }
}
