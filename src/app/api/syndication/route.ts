/* src/app/api/syndication/route.ts */
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";
import { parseCoordinates, getClosestLocation } from "@/lib/location-db";
import { generateArticles } from "@/app/corresponsal/route";

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

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = request.headers.get("x-api-key") || searchParams.get("key");
    const validKey = process.env.SYNDICATION_API_KEY || "nexativa";

    if (!key || key !== validKey) {
      return NextResponse.json({ success: false, error: "Clave de API no válida o ausente." }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      content, 
      geolocation_coordinates = "-27.5853,-56.6853", 
      attached_media_url = [], 
      operator_id = "external_partner",
      corresponsal_name = "Ituzaingó Portal"
    } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Los campos 'title' y 'content' son requeridos." }, { status: 400 });
    }

    // Process geolocation coordinates to get nearest municipal point reference
    const coords = parseCoordinates(geolocation_coordinates);
    const closestLoc = getClosestLocation(coords.lat, coords.lng);
    const locationContext = closestLoc 
      ? `Ubicación aproximada detectada: Cerca de ${closestLoc.name}. Referencia municipal: ${closestLoc.description}.`
      : `Ubicación aproximada: Coordenadas ${geolocation_coordinates}.`;

    // Generate articles using the shared Gemini copywriting engine
    let versionNexativa = null;
    let versionPartner = null;
    let status = "PENDING_REVIEW";
    let transcriptionText = content;

    try {
      const copies = await generateArticles(content, locationContext, corresponsal_name);
      versionNexativa = copies.version_nexativa;
      versionPartner = copies.version_partner;
    } catch (err: any) {
      console.error("[Syndication API] Falló redacción automática con IA:", err);
      status = "AUDIO_ERROR_MANUAL_REVIEW_REQUIRED";
      transcriptionText = `[ERROR DE PROCESAMIENTO: Falló la redacción cognitiva. Detalle: ${err.message || err}]`;
      
      versionNexativa = {
        title: `[BORRADOR PENDIENTE] ${title}`,
        excerpt: "Error de procesamiento automático al recibir nota externa.",
        content: `<p>Borrador enviado externamente: ${content}</p>`,
        tags: ["Revisión", "Sindicación", "Nota Externa", "Ituzaingó"]
      };

      versionPartner = {
        title: `[PENDIENTE DE REVISIÓN] ${title}`,
        content: `<p>Contenido en espera de edición manual por fallos en redacción automática.</p>`
      };
    }

    // Insert the prepared staging item into database
    const { data: insertedData, error: dbError } = await supabaseAdmin
      .from("editorial_staging_queue")
      .insert([{
        operator_id,
        raw_metadata_title: title,
        geolocation_coordinates,
        attached_media_url: Array.isArray(attached_media_url) ? attached_media_url : [attached_media_url],
        audio_url: null,
        status,
        transcription: transcriptionText,
        version_nexativa,
        version_partner,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select("id")
      .single();

    if (dbError) {
      console.error("[Syndication API] Error guardando nota externa en la base de datos:", dbError.message);
      return NextResponse.json({ success: false, error: "Fallo al guardar en la base de datos." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Nota recibida y enviada a la cola de revisión de Nexativa con éxito.",
      id: insertedData?.id
    });

  } catch (err: any) {
    console.error("[Syndication API] Error crítico en POST:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
