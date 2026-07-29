import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
        return NextResponse.json({ success: true, flashes: [] });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, flashes: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Error de servidor" }, { status: 500 });
  }
}

// POST: Save or publish a new News Flash
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      summary,
      duration_seconds = 180,
      video_url,
      thumbnail_url,
      embed_url,
      segments = [],
      category = "nacional",
      partner_visible = true,
      status = "published"
    } = body;

    if (!title || !video_url) {
      return NextResponse.json({ success: false, error: "El título y la URL del video son requeridos." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("news_flashes")
      .insert([{
        title,
        summary: summary || title,
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
      console.error("[News Flashes API] Error guardando flash:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, flash: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Error interno de servidor" }, { status: 500 });
  }
}
