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
  const { searchParams } = new URL(request.url);
  const requestedSlug = searchParams.get("slug") || "nora-live-exteriores";
  const slug = requestedSlug.includes("nora-periodismo") ? "nora-periodismo" : "nora-live-exteriores";
  const pluginFile = `${slug}/${slug}.php`;
  const zipFile = `${slug}.zip`;

  const host = request.headers.get("host") || "www.nexativanews.com.ar";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cdnPackageUrl = `https://xeheuscrttrbfnojwwqt.supabase.co/storage/v1/object/public/uploads/plugins/${slug}.zip`;

  const pluginInfo = {
    name: "Nora Periodismo Pro - Cadena 4 & Nexativa",
    slug: slug,
    plugin: pluginFile,
    version: "2.2.0",
    author: "MyJNexoraVisual & Nexativa News",
    author_profile: "https://www.nexativanews.com.ar",
    requires: "5.6",
    tested: "6.7",
    requires_php: "7.4",
    last_updated: "2026-10-27 22:30:00",
    package: cdnPackageUrl,
    download_url: cdnPackageUrl,
    homepage: "https://cadena4.com.ar",
    sections: {
      description: "Suite completa de periodismo con IA: Nora Live Editor, Auto-Clipper Pro, Flashes Noticiosos de 1-5 min y Móvil de Exteriores PWA para Cadena 4.",
      installation: "Instalar vía el panel de administración de WordPress o mediante actualización automática en un clic.",
      changelog: "<h4>2.2.0</h4><ul><li>Auto-actualización automática desatendida vía CDN permanente de alta disponibilidad.</li><li>Motor de redacción en vivo instantáneo de Nora con detección automática de borradores.</li><li>Subida de imágenes con vista previa inmediata y asignación de foto destacada.</li><li>Reproductor limpio para Flashes y clips de hasta 5 minutos sin barra de 2 horas.</li><li>Bandeja en tiempo real de despachos desde la PWA móvil.</li></ul>"
    },
    banners: {
      low: `${baseUrl}/banner-nexativa.jpg`,
      high: `${baseUrl}/banner-nexativa.jpg`
    }
  };

  return NextResponse.json(pluginInfo, { headers: corsHeaders });
}
