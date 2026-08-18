import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ========================================================================
 * 🛡️ ALTA DE INMUEBLES & CALENDARIO ANTI-ESTAFAS (BLINDADO)
 * Ubicación: /src/app/api/inmuebles/registro/route.ts
 * ========================================================================
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      property_type,
      address,
      city = "Ituzaingó",
      province = "Corrientes",
      capacity_guests = 2,
      price_per_night,
      currency = "ARS",
      description = "",
      owner_name,
      owner_dni,
      owner_phone,
      owner_email = "",
      available_from,
      available_to,
      anti_fraud_accepted,
      image_url = "",
      gallery_images = [],
      latitude = null,
      longitude = null,
      maps_url = "",
    } = body;

    // Determinar la foto de portada principal
    let primaryImage = image_url ? image_url.trim() : "";
    if (!primaryImage && Array.isArray(gallery_images) && gallery_images.length > 0) {
      primaryImage = gallery_images[0].url || "";
    }
    if (!primaryImage) {
      primaryImage = "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80";
    }

    // 1. Validaciones de presencia de campos obligatorios
    if (!title || !property_type || !address || !price_per_night) {
      return NextResponse.json(
        { success: false, error: "Faltan datos básicos del inmueble (Título, Tipo, Dirección, Precio)." },
        { status: 400 }
      );
    }

    if (!owner_name || !owner_dni || !owner_phone) {
      return NextResponse.json(
        { success: false, error: "Es obligatorio identificar al propietario con Nombre, DNI/CUIT y WhatsApp (Protocolo Anti-Estafas)." },
        { status: 400 }
      );
    }

    if (!available_from || !available_to) {
      return NextResponse.json(
        { success: false, error: "Debes seleccionar las fechas de Inicio y Fin de disponibilidad en el calendario." },
        { status: 400 }
      );
    }

    // 2. Validación estricta de coherencia de fechas en el Calendario
    const fromDate = new Date(available_from);
    const toDate = new Date(available_to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Formato de fechas inválido en el calendario." },
        { status: 400 }
      );
    }

    if (toDate < fromDate) {
      return NextResponse.json(
        { success: false, error: "Inconsistencia de fechas: La fecha final de disponibilidad debe ser posterior o igual a la fecha inicial." },
        { status: 400 }
      );
    }

    // 3. Verificación de aceptación explícita de cláusulas jurídicas
    if (!anti_fraud_accepted) {
      return NextResponse.json(
        {
          success: false,
          error: "Es requisito legal innegociable aceptar la Declaración Jurada y las Políticas de Sanción para registrar un inmueble.",
        },
        { status: 400 }
      );
    }

    // 4. Empaquetar galería completa y metadatos GPS dentro de la descripción para máxima compatibilidad
    let enrichedDescription = description ? description.trim() : "";
    
    // Inyectar tags de galería y geo si existen
    if (Array.isArray(gallery_images) && gallery_images.length > 0) {
      enrichedDescription += `\n\n<!-- GALLERY_DATA:${JSON.stringify(gallery_images)} -->`;
    }
    if (latitude || longitude || maps_url) {
      enrichedDescription += `\n\n<!-- GEO_DATA:${JSON.stringify({ latitude, longitude, maps_url })} -->`;
    }

    // 5. Inserción garantizada en Base de Datos Supabase (Postgres)
    const basePayload: any = {
      title: title.trim(),
      property_type: property_type.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      capacity_guests: Number(capacity_guests) || 2,
      price_per_night: Number(price_per_night),
      currency: currency.trim() || "ARS",
      description: enrichedDescription,
      owner_name: owner_name.trim(),
      owner_dni: owner_dni.trim(),
      owner_phone: owner_phone.trim(),
      owner_email: owner_email.trim(),
      available_from,
      available_to,
      anti_fraud_accepted: true,
      status: "ACTIVE",
      image_url: primaryImage,
      updated_at: new Date().toISOString(),
    };

    // Intentar primero inserción en properties_for_rent
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("properties_for_rent")
      .insert([basePayload])
      .select()
      .single();

    if (insertError) {
      console.error("[CRITICAL: Supabase insert error on properties_for_rent]:", insertError);
      return NextResponse.json({
        success: false,
        error: `Error al guardar en base de datos: ${insertError.message}`,
      }, { status: 500 });
    }

    console.log(`[Inmuebles] 🏠 Propiedad publicada exitosamente en Supabase: ID=${insertedData.id} - ${insertedData.title}`);

    return NextResponse.json({
      success: true,
      property: {
        ...insertedData,
        gallery_images: Array.isArray(gallery_images) && gallery_images.length > 0 ? gallery_images : [{ url: primaryImage, roomTag: "Fachada", caption: title }],
        latitude,
        longitude,
        maps_url,
      },
      message: "¡Inmueble registrado con éxito! Tu publicación ya se encuentra activa y visible en el portal y panel de control.",
    });

  } catch (err: any) {
    console.error("Error en POST /api/inmuebles/registro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error interno del servidor al procesar el alta del inmueble." },
      { status: 500 }
    );
  }
}
