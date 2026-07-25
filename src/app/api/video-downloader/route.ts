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
      const outputPattern = path.join(downloadDir, `audio_${timestamp}.%(ext)s`);
      const commands = [
        `python -m yt_dlp --no-check-certificates --no-playlist -f "bestaudio/best" -o "${outputPattern}" "${url}"`,
        `yt-dlp --no-check-certificates --no-playlist -f "bestaudio/best" -o "${outputPattern}" "${url}"`,
        `py -m yt_dlp --no-check-certificates --no-playlist -f "bestaudio/best" -o "${outputPattern}" "${url}"`
      ];

      return new Promise((resolve) => {
        let cmdIdx = 0;
        let lastErr = "";
        const tryNextCommand = () => {
          if (cmdIdx >= commands.length) {
            resolve(NextResponse.json({
              success: false,
              error: lastErr || "No se pudo procesar la URL de YouTube. Verifica que la URL sea pública."
            }));
            return;
          }
          const command = commands[cmdIdx];
          console.log(`[Audio Downloader] Executing (${cmdIdx + 1}): ${command}`);
          
          exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
              lastErr = stderr || error.message;
            }
            const files = fs.readdirSync(downloadDir);
            const matchedFile = files.find(f => f.startsWith(`audio_${timestamp}`));

            if (matchedFile) {
              resolve(NextResponse.json({
                success: true,
                downloadUrl: `/downloads/${matchedFile}`,
                filename: matchedFile
              }));
            } else {
              cmdIdx++;
              tryNextCommand();
            }
          });
        };
        tryNextCommand();
      });
    } else {
      const outputFilename = `download_${timestamp}.mp4`;
      const outputPath = path.join(downloadDir, outputFilename);
      const outputPattern = path.join(downloadDir, `download_${timestamp}.%(ext)s`);

      const commands = [
        `python -m yt_dlp --no-check-certificates --no-playlist -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`,
        `yt-dlp --no-check-certificates --no-playlist -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`,
        `python -m yt_dlp --no-check-certificates --no-playlist -f "best" -o "${outputPattern}" "${url}"`,
        `yt-dlp --no-check-certificates --no-playlist -f "best" -o "${outputPattern}" "${url}"`
      ];

      return new Promise((resolve) => {
        let cmdIdx = 0;
        let lastErr = "";
        const tryNextCommand = () => {
          if (cmdIdx >= commands.length) {
            resolve(NextResponse.json({
              success: false,
              error: lastErr || "Error al descargar el video de YouTube. Verifica que la URL sea pública."
            }));
            return;
          }
          const command = commands[cmdIdx];
          console.log(`[Video Downloader] Executing (${cmdIdx + 1}): ${command}`);

          exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
              lastErr = stderr || error.message;
            }
            const files = fs.readdirSync(downloadDir);
            const matchedFile = files.find(f => f.startsWith(`download_${timestamp}`));

            if (matchedFile) {
              resolve(NextResponse.json({
                success: true,
                downloadUrl: `/downloads/${matchedFile}`,
                filename: matchedFile
              }));
            } else {
              cmdIdx++;
              tryNextCommand();
            }
          });
        };
        tryNextCommand();
      });
    }

  } catch (err: any) {
    console.error("[Downloader API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
