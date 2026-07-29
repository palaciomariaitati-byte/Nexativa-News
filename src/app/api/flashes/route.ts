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

// GET: Fetch published News Flashes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const partnerOnly = searchParams.get("partner_only") === "true";

    let query = supabaseAdmin
      .from("news_flashes")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (partnerOnly) {
      query = query.eq("partner_visible", true);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      if (error.code === "42P01") {
        return NextResponse.json({ success: true, flashes: [] }, { headers: corsHeaders });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, flashes: data || [] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Error de servidor" }, { status: 500, headers: corsHeaders });
  }
}

// POST: Save or publish a new News Flash
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title = "🔴 FLASH DE NOTICIAS NEXATIVA",
      summary = "",
      duration_seconds = 180,
      video_url = "",
      thumbnail_url = "",
      embed_url = "",
      segments = [],
      category = "general",
      partner_visible = true,
      status = "published"
    } = body;

    const { data, error } = await supabaseAdmin
      .from("news_flashes")
      .insert([{
        title,
        summary,
        duration_seconds,
        video_url,
        thumbnail_url,
        embed_url,
        segments,
        category,
        partner_visible,
        status,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("[News Flashes API] Error guardando Flash:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      message: "Flash Noticioso guardado y emitido con éxito.",
      flash: data
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Error interno de servidor" }, { status: 500, headers: corsHeaders });
  }
}
