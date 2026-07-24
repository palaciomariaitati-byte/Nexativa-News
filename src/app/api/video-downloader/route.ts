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
    const flags = `--no-check-certificates --no-playlist --extractor-args "youtube:player_client=android,web"`;

    if (type === "audio") {
      const outputPattern = path.join(downloadDir, `audio_${timestamp}.%(ext)s`);
      const commands = [
        `yt-dlp ${flags} -f "bestaudio/best" -o "${outputPattern}" "${url}"`,
        `python -m yt_dlp ${flags} -f "bestaudio/best" -o "${outputPattern}" "${url}"`,
        `py -m yt_dlp ${flags} -f "bestaudio/best" -o "${outputPattern}" "${url}"`,
        `npx --yes @distube/yt-dlp ${flags} -f "bestaudio/best" -o "${outputPattern}" "${url}"`
      ];

      return new Promise((resolve) => {
        let cmdIdx = 0;
        const tryNextCommand = () => {
          if (cmdIdx >= commands.length) {
            resolve(NextResponse.json({
              success: false,
              error: "No se encontró yt-dlp instalado en tu sistema. Instala yt-dlp ejecutando: pip install yt-dlp en tu terminal local."
            }));
            return;
          }
          const command = commands[cmdIdx];
          console.log(`[Audio Downloader] Intento ${cmdIdx + 1}: ${command}`);
          
          exec(command, (error, stdout, stderr) => {
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
        `yt-dlp ${flags} -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`,
        `python -m yt_dlp ${flags} -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`,
        `py -m yt_dlp ${flags} -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`,
        `yt-dlp ${flags} -f "best" -o "${outputPattern}" "${url}"`,
        `python -m yt_dlp ${flags} -f "best" -o "${outputPattern}" "${url}"`
      ];

      return new Promise((resolve) => {
        let cmdIdx = 0;
        const tryNextCommand = () => {
          if (cmdIdx >= commands.length) {
            resolve(NextResponse.json({
              success: false,
              error: "No se encontró yt-dlp en tu sistema local o la URL no es accesible. Instálalo con: pip install yt-dlp"
            }));
            return;
          }
          const command = commands[cmdIdx];
          console.log(`[Video Downloader] Intento ${cmdIdx + 1}: ${command}`);

          exec(command, (error, stdout, stderr) => {
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
