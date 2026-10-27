import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request) {
  const host = request.headers.get("host") || "www.nexativanews.com.ar";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const pluginInfo = {
    name: "Nora Periodismo Pro - Cadena 4 & Nexativa",
    slug: "nora-live-exteriores",
    plugin: "nora-live-exteriores/nora-live-exteriores.php",
    version: "2.1.0",
    author: "MyJNexoraVisual & Nexativa News",
    author_profile: "https://www.nexativanews.com.ar",
    requires: "5.6",
    tested: "6.7",
    requires_php: "7.4",
    last_updated: "2026-10-27 22:00:00",
    package: `${baseUrl}/nora-live-exteriores.zip`,
    download_url: `${baseUrl}/nora-live-exteriores.zip`,
    homepage: "https://cadena4.com.ar",
    sections: {
      description: "Suite completa de periodismo con IA: Nora Live Editor, Auto-Clipper Pro, Flashes Noticiosos de 1-5 min y Móvil de Exteriores PWA para Cadena 4.",
      installation: "Instalar vía el panel de administración de WordPress o mediante actualización automática en un clic.",
      changelog: "<h4>2.1.0</h4><ul><li>Soporte de Auto-Actualizaciones automáticas remotas desde Nexativa News.</li><li>Motor de publicación dual: REST API + admin-ajax.php para garantizar 100% de éxito al publicar.</li><li>Biblioteca de Clips Almacenados en Nexativa con publicación directa a WordPress.</li><li>Soporte de video iframe y miniaturas destacadas.</li><li>Suite de Periodismo completa con Live Editor, Auto-Clipper y Móvil PWA.</li></ul>"
    },
    banners: {
      low: `${baseUrl}/banner-nexativa.jpg`,
      high: `${baseUrl}/banner-nexativa.jpg`
    }
  };

  return NextResponse.json(pluginInfo, { headers: corsHeaders });
}
