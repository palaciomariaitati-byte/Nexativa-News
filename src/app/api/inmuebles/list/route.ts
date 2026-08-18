import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ========================================================================
 * 📋 LISTADO DE INMUEBLES VERIFICADOS (CON GALERÍA DESEMPAQUETADA)
 * Ubicación: /src/app/api/inmuebles/list/route.ts
 * ========================================================================
 */

function unpackPropertyData(prop: any) {
  let galleryImages = prop.gallery_images;
  let latitude = prop.latitude || null;
  let longitude = prop.longitude || null;
  let mapsUrl = prop.maps_url || "";
  let cleanDescription = prop.description || "";

  // Intentar desempaquetar desde tags en description si no vienen en columnas
  if (cleanDescription) {
    // 1. Galería
    const galleryMatch = cleanDescription.match(/<!-- GALLERY_DATA:(.*?) -->/);
    if (galleryMatch && galleryMatch[1]) {
      try {
        galleryImages = JSON.parse(galleryMatch[1]);
        cleanDescription = cleanDescription.replace(/<!-- GALLERY_DATA:.*? -->/, "").trim();
      } catch {}
    }

    // 2. Geo
    const geoMatch = cleanDescription.match(/<!-- GEO_DATA:(.*?) -->/);
    if (geoMatch && geoMatch[1]) {
      try {
        const geoObj = JSON.parse(geoMatch[1]);
        latitude = geoObj.latitude ?? latitude;
        longitude = geoObj.longitude ?? longitude;
        mapsUrl = geoObj.maps_url ?? mapsUrl;
        cleanDescription = cleanDescription.replace(/<!-- GEO_DATA:.*? -->/, "").trim();
      } catch {}
    }
  }

  // Si no hay galería pero sí image_url
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
    if (prop.image_url) {
      galleryImages = [{ url: prop.image_url, roomTag: "Fachada Principal", caption: prop.title }];
    } else {
      galleryImages = [{ url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80", roomTag: "Fachada", caption: prop.title }];
    }
  }

  return {
    ...prop,
    description: cleanDescription,
    gallery_images: galleryImages,
    latitude,
    longitude,
    maps_url: mapsUrl,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const check_in = searchParams.get("check_in");
    const check_out = searchParams.get("check_out");
    const property_type = searchParams.get("property_type");
    const owner_dni = searchParams.get("owner_dni");
    const isAdmin = searchParams.get("is_admin") === "true" || searchParams.get("include_all") === "true" || Boolean(owner_dni);

    let query = supabaseAdmin
      .from("properties_for_rent")
      .select("*")
      .order("created_at", { ascending: false });

    // Si es consulta pública normal, no mostrar propiedades baneadas
    if (!isAdmin && !owner_dni) {
      query = query.not("status", "in", '("BAN_PERMANENT","SUSPENDED_NEGLIGENT")');
    }

    if (owner_dni) {
      query = query.eq("owner_dni", owner_dni.trim());
    }

    if (property_type && property_type !== "TODOS") {
      query = query.eq("property_type", property_type);
    }

    if (check_in) {
      query = query.lte("available_from", check_in);
    }
    if (check_out) {
      query = query.gte("available_to", check_out);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[Supabase List Inmuebles Warning]:", error.message);
      return NextResponse.json({ success: true, properties: [] });
    }

    const processedProperties = (data || []).map(unpackPropertyData);

    return NextResponse.json({ success: true, properties: processedProperties });

  } catch (err: any) {
    console.error("[Inmuebles List API Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
