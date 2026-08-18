import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ========================================================================
 * 📸 UPLOADER DE FOTOS DE INMUEBLES (ALTA VELOCIDAD Y BLINDAJE STORAGE)
 * Ubicación: /src/app/api/inmuebles/upload/route.ts
 * 
 * Sube imágenes a Supabase Storage con credenciales de administrador (Service Role),
 * evitando bloqueos de RLS o permisos anónimos en el cliente.
 * ========================================================================
 */

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      // Intentar leer si viene en JSON base64
      return NextResponse.json({ success: false, error: "Archivo no encontrado en la solicitud." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
    const fileName = `inm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `inmuebles/${fileName}`;

    // 1. Intentar subir en bucket 'uploads'
    let { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("uploads")
      .upload(filePath, buffer, {
        contentType: file.type || "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    let publicUrl = "";

    if (!uploadError && uploadData) {
      const { data: pubData } = supabaseAdmin.storage.from("uploads").getPublicUrl(filePath);
      publicUrl = pubData.publicUrl;
    } else {
      // 2. Fallback a bucket 'media'
      const { data: mediaData, error: mediaError } = await supabaseAdmin.storage
        .from("media")
        .upload(filePath, buffer, {
          contentType: file.type || "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });

      if (!mediaError && mediaData) {
        const { data: pubData } = supabaseAdmin.storage.from("media").getPublicUrl(filePath);
        publicUrl = pubData.publicUrl;
      } else {
        throw new Error(uploadError?.message || mediaError?.message || "No fue posible guardar la imagen en el almacenamiento.");
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      path: filePath,
    });

  } catch (err: any) {
    console.error("[Inmuebles Upload API Error]:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Error al subir la imagen al servidor.",
    }, { status: 500 });
  }
}
