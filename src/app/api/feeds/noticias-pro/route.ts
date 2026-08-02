import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";
import { SocialDistributor, NewsArticle } from "@/modules/nora-pro/social_distributor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const format = searchParams.get("format") || "xml"; // xml | json

    // Query approved articles or press releases
    const { data: queueItems, error } = await supabaseAdmin
      .from("editorial_staging_queue")
      .select("*")
      .in("status", ["APPROVED_ALL_SIMULTANEOUS", "APPROVED_PARTNER_ONLY", "PUBLISHED"])
      .order("updated_at", { ascending: false })
      .limit(limit);

    let articles: NewsArticle[] = [];

    if (!error && queueItems && queueItems.length > 0) {
      articles = queueItems.map((item: any) => {
        const version = item.version_nexativa || item.version_partner || {};
        return {
          id: item.id,
          title: version.title || item.raw_metadata_title || "Reporte Nexativa",
          summary: version.excerpt || (version.content ? version.content.replace(/<[^>]+>/g, "").slice(0, 200) : "Sin extracto"),
          url: `https://nexativanews.com.ar/cultura/${item.id}`,
          tags: version.tags || ["Nexativa", "Noticias", "Prensa"],
          publishedAt: new Date(item.updated_at || item.created_at || Date.now()),
        };
      });
    } else {
      // Fallback demo article for RSS testing if staging is empty
      articles = [
        {
          id: "estudio-nexativa-2026",
          title: "Estudio Nexativa: Crece un 42% la demanda de servicios profesionales independientes en Argentina",
          summary: "Un informe exclusivo del Barómetro Digital Nexativa revela el auge de la contratación local B2B y servicios de proximidad en el mercado actual.",
          url: "https://nexativanews.com.ar/prensa/estudio-servicios-2026",
          tags: ["Nexativa", "Prensa", "Marketplace", "Tendencias", "Economia"],
          publishedAt: new Date(),
        }
      ];
    }

    const distributor = new SocialDistributor();
    
    if (format === "json") {
      return NextResponse.json({
        success: true,
        count: articles.length,
        articles,
      });
    }

    const rssXml = distributor.generateRssFeed(articles);
    return new Response(rssXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=300, stale-while-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[Feeds API] Error al generar RSS:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno." }, { status: 500 });
  }
}
