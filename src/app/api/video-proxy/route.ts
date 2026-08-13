/* src/app/api/video-proxy/route.ts */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "La URL del video es requerida (?url=...)." }, { status: 400 });
    }

    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `No se pudo descargar el video original (${response.status}).` }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Cache-Control", "public, max-age=3600");
    headers.set("Content-Length", arrayBuffer.byteLength.toString());

    return new Response(arrayBuffer, {
      status: 200,
      headers
    });
  } catch (err: any) {
    console.error("[Video Proxy API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(null, { status: 204, headers });
}
