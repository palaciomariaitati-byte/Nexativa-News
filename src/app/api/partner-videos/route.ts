import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET: Fetch incoming partner videos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const { data, error } = await supabaseAdmin
      .from("partner_videos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ success: true, videos: [] }, { headers: corsHeaders });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, videos: data || [] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Error de servidor" }, { status: 500, headers: corsHeaders });
  }
}

// POST: Submit a video coverage from partner plugin or web
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      partner_name = "Socio Exteriores / Cadena 4",
      title = "Cobertura Periodística Entrante",
      video_url,
      notes = ""
    } = body;

    if (!video_url) {
      return NextResponse.json({ success: false, error: "La URL o archivo de video es requerido." }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabaseAdmin
      .from("partner_videos")
      .insert([{
        partner_name,
        title,
        video_url,
        notes,
        status: "pending",
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("[Partner Videos API] Error registrando video de socio:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      message: "Video recibido exitosamente en Estudio Nexativa para procesamiento con Nora IA.",
      video: data
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Error interno de servidor" }, { status: 500, headers: corsHeaders });
  }
}
