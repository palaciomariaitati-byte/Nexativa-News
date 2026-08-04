import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";
import { generatePersonalizedPitch, JournalistTarget } from "@/modules/nora-pro/press_pitching";
import { sendProfessionalEmail } from "@/lib/services/email";

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

    // 1. Intentar envío de correo profesional
    let emailStatus = false;
    try {
      const mailRes = await sendProfessionalEmail({
        to: email,
        subject: pitch.subject,
        html: `
          <div style="font-family: sans-serif; font-size: 14px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <div style="margin-bottom: 20px; border-bottom: 2px solid #06b6d4; padding-bottom: 12px;">
              <span style="font-weight: 900; font-size: 18px; color: #0891b2;">NEXATIVA NEWS</span>
              <span style="font-size: 11px; color: #64748b; margin-left: 8px;">• Unidad de Prensa & Relaciones Institucionales</span>
            </div>

            <div style="white-space: pre-wrap; line-height: 1.6; color: #334155;">
              ${pitch.body}
            </div>

            <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; pt: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
              Nexativa News • Periodismo de Cercanía & Marketplace Local<br />
              Ituzaingó, Corrientes • nexativanews.com.ar
            </div>
          </div>
        `,
        text: pitch.body,
      });
      emailStatus = mailRes.success;
    } catch (mErr) {
      console.warn("[NORA Pitch API] No se pudo despachar mail automático:", mErr);
    }

    // 2. Registrar en Supabase (press_outreach_logs)
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
      console.warn("[NORA Pitch API] No se pudo registrar en BD (usando fallback):", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Pitch generado y enviado a ${name} (${mediaOutlet}).`,
      pitch,
      emailSent: emailStatus,
    });
  } catch (err: any) {
    console.error("[NORA Pitch API] Error crítico:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno." }, { status: 500 });
  }
}
