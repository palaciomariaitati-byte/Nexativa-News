/* src/app/api/video-downloader/route.ts */
import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: "La URL del video es requerida." }, { status: 400 });
    }

    // 1. Check if running in local environment (development)
    const isLocal = process.env.NODE_ENV === "development" || !process.env.VERCEL;
    if (!isLocal) {
      return NextResponse.json({
        success: false,
        error: "El descargador directo desde el panel solo está disponible en el entorno local (desarrollo). En producción, descarga y sube tu MP4 manualmente."
      });
    }

    // 2. Setup local output folder
    const publicDir = path.join(process.cwd(), "public");
    const downloadDir = path.join(publicDir, "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const outputFilename = `download_${timestamp}.mp4`;
    const outputPath = path.join(downloadDir, outputFilename);

    // 3. Call local yt-dlp python module to download the video
    // Limit format to MP4 for HTML5 canvas compatibility
    const command = `python -m yt_dlp -f "best[ext=mp4]/best" --no-playlist -o "${outputPath}" "${url}"`;

    console.log(`[Video Downloader] Executing: ${command}`);

    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("[Video Downloader] Error during download:", error, stderr);
          resolve(NextResponse.json({
            success: false,
            error: `Error al descargar el video. Verifica que la URL de YouTube/Twitch sea correcta. Detalle: ${error.message}`
          }));
          return;
        }

        console.log("[Video Downloader] Download finished successfully:", stdout);

        // Verify that the file was actually written
        if (fs.existsSync(outputPath)) {
          resolve(NextResponse.json({
            success: true,
            downloadUrl: `/downloads/${outputFilename}`,
            filename: outputFilename
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            error: "El descargador terminó pero el archivo final MP4 no se encontró en el disco."
          }));
        }
      });
    });

  } catch (err: any) {
    console.error("[Video Downloader API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
