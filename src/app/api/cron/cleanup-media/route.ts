import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET_NAME, DeleteObjectCommand, ListObjectsV2Command } from "@/lib/storage/cloudflareR2";

export const maxDuration = 60; // 60s max execution time

const MAX_STORAGE_BYTES = 350 * 1024 * 1024; // 350 MB Límite Preventivo de Seguridad (Capacidad Max)
const SAFE_TARGET_BYTES = 200 * 1024 * 1024; // 200 MB Umbral de Retorno Seguro

export async function GET(request: Request) {
  try {
    // 1. Verificación de seguridad mediante CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === "production") {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    console.log("[Cleanup Media Cron] 🧹 Iniciando depuración inteligente con política dual (7 días + FIFO por Capacidad)...");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let purgedR2Count = 0;
    let purgedSupabaseCount = 0;
    let capacityPurgedCount = 0;

    // 2. Depuración en Cloudflare R2 (si está configurado)
    if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
      try {
        const listCmd = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: "surreal_videos/",
        });
        const r2Objects = await r2Client.send(listCmd);

        if (r2Objects.Contents && r2Objects.Contents.length > 0) {
          for (const item of r2Objects.Contents) {
            if (item.Key && item.LastModified && item.LastModified < sevenDaysAgo) {
              await r2Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: item.Key,
              }));
              purgedR2Count++;
            }
          }
        }
      } catch (r2Err: any) {
        console.warn("[Cleanup Media Cron] Aviso en R2 cleanup:", r2Err.message);
      }
    }

    // 3. Depuración en Supabase Storage (Política Dual: 7 días + Purga FIFO por Capacidad)
    try {
      const supabase = createServerSupabaseClient();
      const { data: files, error: listErr } = await supabase.storage
        .from("media")
        .list("surreal_videos", { limit: 500, sortBy: { column: "created_at", order: "asc" } });

      if (!listErr && files && files.length > 0) {
        const oldFilePaths: string[] = [];
        const remainingFiles: Array<{ name: string; size: number; date: Date }> = [];

        // FASE A: Filtrar archivos mayores a 7 días
        for (const file of files) {
          const dateStr = file.created_at || file.updated_at || new Date().toISOString();
          const fileDate = new Date(dateStr);
          const fileSize = file.metadata?.size || 10 * 1024 * 1024; // 10MB est. por defecto

          if (fileDate < sevenDaysAgo) {
            oldFilePaths.push(`surreal_videos/${file.name}`);
          } else {
            remainingFiles.push({ name: file.name, size: fileSize, date: fileDate });
          }
        }

        // FASE B: Purga FIFO por Capacidad si el peso total supera el umbral de 350 MB
        let currentTotalBytes = remainingFiles.reduce((sum, f) => sum + f.size, 0);

        if (currentTotalBytes > MAX_STORAGE_BYTES) {
          console.warn(`[Cleanup Media Cron] ⚠️ Capacidad excedida (${(currentTotalBytes / 1024 / 1024).toFixed(1)} MB > 350 MB). Iniciando purga FIFO del más antiguo al más reciente...`);

          // Ordenar del más antiguo al más reciente (FIFO)
          remainingFiles.sort((a, b) => a.date.getTime() - b.date.getTime());

          for (const file of remainingFiles) {
            if (currentTotalBytes <= SAFE_TARGET_BYTES) break;
            oldFilePaths.push(`surreal_videos/${file.name}`);
            currentTotalBytes -= file.size;
            capacityPurgedCount++;
          }
        }

        // Ejecutar eliminación en batch
        if (oldFilePaths.length > 0) {
          const { error: deleteErr } = await supabase.storage
            .from("media")
            .remove(oldFilePaths);

          if (!deleteErr) {
            purgedSupabaseCount = oldFilePaths.length;
            console.log(`[Cleanup Media Cron] 🗑️ Eliminados ${purgedSupabaseCount} archivos en total (${capacityPurgedCount} purgados preventivamente por capacidad).`);
          }
        }
      }
    } catch (sbErr: any) {
      console.warn("[Cleanup Media Cron] Aviso en Supabase Storage cleanup:", sbErr.message);
    }

    console.log(`[Cleanup Media Cron] ✅ Depuración inteligente completada. Supabase borrados: ${purgedSupabaseCount}`);

    return NextResponse.json({
      success: true,
      message: `Depuración inteligente completada con política dual.`,
      purged: {
        r2: purgedR2Count,
        supabase: purgedSupabaseCount,
        capacityTriggered: capacityPurgedCount
      },
      thresholds: {
        maxStorageMb: 350,
        safeTargetMb: 200
      }
    });
  } catch (err: any) {
    console.error("[Cleanup Media Cron Critical Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
