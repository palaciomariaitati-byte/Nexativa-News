/* src/app/api/video-downloader/route.ts */
import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { url, type = "video" } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: "La URL es requerida." }, { status: 400 });
    }

    // 1. Check if running in local environment (development)
    const isLocal = process.env.NODE_ENV === "development" || !process.env.VERCEL;
    if (!isLocal) {
      return NextResponse.json({
        success: false,
        error: "El descargador directo desde el panel solo está disponible en el entorno local (desarrollo). En producción, descarga y sube tus archivos manualmente."
      });
    }

    // 2. Setup local output folder
    const publicDir = path.join(process.cwd(), "public");
    const downloadDir = path.join(publicDir, "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const timestamp = Date.now();

    if (type === "audio") {
      // Download best audio quality stream (m4a, webm, aac, etc.)
      const command = `python -m yt_dlp -f "bestaudio/best" --no-playlist -o "${downloadDir}/audio_${timestamp}.%(ext)s" "${url}"`;
      console.log(`[Audio Downloader] Executing: ${command}`);

      return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("[Audio Downloader] Error during download:", error, stderr);
            resolve(NextResponse.json({
              success: false,
              error: `Error al descargar el audio. Detalle: ${error.message}`
            }));
            return;
          }

          // Scan downloads directory to locate the file with its downloaded extension
          const files = fs.readdirSync(downloadDir);
          const matchedFile = files.find(f => f.startsWith(`audio_${timestamp}`));

          if (matchedFile) {
            resolve(NextResponse.json({
              success: true,
              downloadUrl: `/downloads/${matchedFile}`,
              filename: matchedFile
            }));
          } else {
            resolve(NextResponse.json({
              success: false,
              error: "El descargador de audio finalizó pero no se encontró el archivo resultante."
            }));
          }
        });
      });
    } else {
      const outputFilename = `download_${timestamp}.mp4`;
      const outputPath = path.join(downloadDir, outputFilename);
      const command = `python -m yt_dlp -f "best[ext=mp4]/best" --no-playlist -o "${outputPath}" "${url}"`;
      console.log(`[Video Downloader] Executing: ${command}`);

      return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("[Video Downloader] Error during download:", error, stderr);
            resolve(NextResponse.json({
              success: false,
              error: `Error al descargar el video. Detalle: ${error.message}`
            }));
            return;
          }

          if (fs.existsSync(outputPath)) {
            resolve(NextResponse.json({
              success: true,
              downloadUrl: `/downloads/${outputFilename}`,
              filename: outputFilename
            }));
          } else {
            resolve(NextResponse.json({
              success: false,
              error: "El descargador de video finalizó pero no se encontró el archivo resultante."
            }));
          }
        });
      });
    }

  } catch (err: any) {
    console.error("[Downloader API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
