import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    // Verificación de seguridad de Vercel Cron (opcional pero recomendada)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Permitimos acceso sin secret en desarrollo local
      if (process.env.NODE_ENV === "production") {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const BUCKET_NAME = "media";

    // 1. Listar todos los archivos en el bucket "media"
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list("uploads", {
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "asc" },
      });

    if (listError) {
      console.error("Error al listar archivos:", listError);
      return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No hay archivos en la carpeta uploads." }, { status: 200 });
    }

    // 2. Calcular la fecha límite (hace 15 días)
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 15);

    // 3. Filtrar archivos viejos (asegurándonos de no borrar carpetas vacías/placeholders)
    const oldFiles = files.filter(file => {
      // Ignorar el objeto "emptyFolderPlaceholder" que suele estar en la raíz o carpetas si no son archivos reales
      if (!file.id || !file.created_at) return false;
      const fileDate = new Date(file.created_at);
      return fileDate < limitDate;
    });

    if (oldFiles.length === 0) {
      return NextResponse.json({ message: "No hay archivos con más de 15 días de antigüedad." }, { status: 200 });
    }

    // 4. Preparar la lista de rutas a eliminar
    const filesToRemove = oldFiles.map(file => `uploads/${file.name}`);

    // 5. Eliminar los archivos físicos de Supabase Storage
    const { data: deletedData, error: deleteError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(filesToRemove);

    if (deleteError) {
      console.error("Error al eliminar archivos:", deleteError);
      return NextResponse.json({ error: "Failed to delete old files" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `La purga automática se ejecutó exitosamente.`,
      deleted_count: filesToRemove.length,
      deleted_files: filesToRemove
    }, { status: 200 });

  } catch (error: any) {
    console.error("Critical error in cron cleanup-media:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
