import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { fileName, fileType, folder } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName es requerido" }, { status: 400 });
    }

    const targetFolder = folder || "corresponsales_video";
    const ext = fileName.split(".").pop() || (fileType?.includes("video") ? "mp4" : "jpg");
    const uniquePath = `${targetFolder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // Create a signed upload URL using Supabase Admin (service_role)
    const { data, error } = await supabaseAdmin.storage
      .from("uploads")
      .createSignedUploadUrl(uniquePath);

    if (error || !data) {
      console.error("[Upload-URL API] Error creando URL firmada:", error);
      // Fallback: Upload directly using supabaseAdmin on server if small, or return error
      return NextResponse.json({ error: error?.message || "Error al generar la URL de carga" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("uploads").getPublicUrl(uniquePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      path: uniquePath,
      token: data.token,
      publicUrl: publicUrlData.publicUrl
    });
  } catch (err: any) {
    console.error("[Upload-URL API] Excepción:", err);
    return NextResponse.json({ error: err.message || "Error de servidor" }, { status: 500 });
  }
}
