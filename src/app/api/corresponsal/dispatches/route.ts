import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const { data, error } = await supabaseAdmin
      .from("editorial_staging_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const dispatches = (data || []).map((item) => {
      const partner = item.version_partner || {};
      const nexativa = item.version_nexativa || {};
      const title = partner.title || nexativa.title || item.raw_metadata_title || "Despacho de Exteriores";
      const content = partner.content || nexativa.content || item.transcription || "";
      const excerpt = nexativa.excerpt || (content ? content.replace(/<[^>]*>?/gm, "").substring(0, 160) + "..." : "");
      const images = Array.isArray(item.attached_media_url) ? item.attached_media_url : [];
      const primaryImage = images.length > 0 ? images[0] : null;

      return {
        id: item.id,
        title,
        content,
        excerpt,
        images,
        primary_image: primaryImage,
        audio_url: item.audio_url,
        coordinates: item.geolocation_coordinates,
        status: item.status,
        created_at: item.created_at
      };
    });

    return NextResponse.json(
      { success: true, count: dispatches.length, dispatches },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
