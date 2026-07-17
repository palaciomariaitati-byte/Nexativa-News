/* src/app/api/syndication/route.ts */
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const key = searchParams.get("key");

    // Simple key authentication to protect content
    if (!key || key.toLowerCase() !== "nexativa") {
      return NextResponse.json({ success: false, error: "Clave de API no válida o ausente (?key=nexativa)." }, { status: 401 });
    }

    // Query approved partner syndicated articles
    const { data: queueItems, error } = await supabaseAdmin
      .from("editorial_staging_queue")
      .select("*")
      .in("status", ["APPROVED_ALL_SIMULTANEOUS", "APPROVED_PARTNER_ONLY"])
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Syndication API] Error en la base de datos:", error.message);
      return NextResponse.json({ success: false, error: "Fallo al consultar la base de datos." }, { status: 500 });
    }

    // Format the articles for easy insertion into any external website
    const syndicatedArticles = (queueItems || []).map((item: any) => {
      const versionPartner = item.version_partner || {};
      const featuredImage = item.attached_media_url && item.attached_media_url.length > 0 
        ? item.attached_media_url[0] 
        : null;

      return {
        id: item.id,
        title: versionPartner.title || item.raw_metadata_title || "Reporte Sindicado",
        content: versionPartner.content || "",
        attribution_footer: versionPartner.attribution_footer || "Cobertura por gentileza de Nexativanews.com.ar",
        image_url: featuredImage,
        coordinates: item.geolocation_coordinates,
        published_at: item.updated_at || item.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      count: syndicatedArticles.length,
      articles: syndicatedArticles,
    });

  } catch (err: any) {
    console.error("[Syndication API] Error crítico:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
