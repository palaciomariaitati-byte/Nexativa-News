import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ClassicRadioPlayer from "../../ClassicRadioPlayer";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper to extract fallback image from content if main media is video
const getDisplayImage = (article: any) => {
  const isVideo = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('youtube.com') || url.includes('youtu.be');
  };
  if (article.image_url && !isVideo(article.image_url)) {
    return article.image_url;
  }
  const imgMatch = article.content?.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
};

export default async function ClassicArticleDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  // Fetch article
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!article) {
    notFound();
  }

  // Fetch sponsors
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*");

  // Fetch radio stream URL
  const { data: settingData } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "radio_url")
    .maybeSingle();
    
  const radioUrl = settingData?.value || "https://stream.zeno.fm/gnyb99k8zzruv";

  const headerSponsor = sponsors && sponsors.length > 0 ? sponsors[0] : null;
  const footerSponsor = sponsors && sponsors.length > 1 ? sponsors[1] : (sponsors && sponsors.length > 0 ? sponsors[0] : null);

  return (
    <div className="min-h-screen bg-[#f4ebd0] text-[#2c241b] font-serif selection:bg-[#2c241b] selection:text-[#f4ebd0]">
      
      {/* Barra de navegación superior rústica */}
      <div className="w-full border-b-2 border-[#2c241b] py-2 px-4 flex justify-between items-center text-sm font-bold uppercase tracking-widest sticky top-0 bg-[#f4ebd0] z-50">
        <Link href="/clasico" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-4 h-4" />
          Volver a Portada Clásica
        </Link>
        <div className="hidden sm:block">
          Ituzaingó, Corrientes — {new Date(article.created_at).toLocaleDateString("es-AR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-4">
          <button className="hover:opacity-70" aria-label="Aumentar fuente" id="btn-zoom-in">[ A+ ]</button>
          <button className="hover:opacity-70" aria-label="Disminuir fuente" id="btn-zoom-out">[ A- ]</button>
        </div>
      </div>

      {/* Cabecera del Periódico */}
      <header className="max-w-4xl mx-auto px-4 py-8 text-center border-b-4 border-double border-[#2c241b] mb-8 relative mt-16 sm:mt-0 flex flex-col items-center">
        <div className="mb-6 sm:absolute sm:top-8 sm:right-4 sm:mb-0 z-10 sm:scale-100 origin-top-right">
           <ClassicRadioPlayer streamUrl={radioUrl} />
        </div>
        <Link href="/clasico">
          <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter hover:opacity-85" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            NEXATIVA NEWS
          </h1>
        </Link>
        <div className="text-xs uppercase tracking-widest font-bold text-gray-700">
          Edición Clásica — Nota de Prensa
        </div>
      </header>

      {/* Patrocinador de Cabecera */}
      {headerSponsor && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="border-2 border-[#2c241b] p-3 text-center bg-[#eae0c4] flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-widest font-bold border border-[#2c241b] px-2 py-0.5">Espacio Patrocinado</span>
            <a 
              href={headerSponsor.website_url || headerSponsor.instagram_url || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-6 hover:opacity-80 transition-opacity"
            >
              {headerSponsor.banner_url ? (
                <img src={headerSponsor.banner_url} alt={headerSponsor.name} className="h-12 md:h-16 object-contain grayscale contrast-125 sepia-[.3]" />
              ) : (
                <p className="font-black uppercase tracking-tighter text-xl italic">{headerSponsor.name} {headerSponsor.slogan ? `— ${headerSponsor.slogan}` : ""}</p>
              )}
            </a>
            <span className="text-xs font-serif italic text-gray-700 hidden md:block">Auspicia esta nota.</span>
          </div>
        </div>
      )}

      {/* Detalle de la Noticia */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <article className="mb-12">
          
          {/* Título de la Nota */}
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4 uppercase text-center">
            {article.title}
          </h2>
          
          <div className="text-center text-xs md:text-sm font-bold uppercase tracking-wider border-y border-[#2c241b] py-2 mb-8">
            Publicado el {new Date(article.created_at).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
            {article.category && ` | Categoría: ${article.category}`}
          </div>

          {/* Imagen de la Nota */}
          {getDisplayImage(article) && (
            <div className="w-full mb-8">
              <img 
                src={getDisplayImage(article)} 
                alt={article.title}
                className="w-full h-auto max-h-[500px] object-cover border-4 border-double border-[#2c241b] grayscale contrast-125 sepia-[.3] mx-auto"
              />
              <p className="text-xs italic text-right mt-2 font-bold">Ilustración gráfica de la corresponsalía.</p>
            </div>
          )}

          {/* Copete / Excerpt */}
          {article.excerpt && (
            <p className="text-xl md:text-2xl font-bold text-justify leading-relaxed mb-6 italic border-l-4 border-[#2c241b] pl-4">
              {article.excerpt}
            </p>
          )}

          {/* Cuerpo del Artículo en Doble Columna Rústica */}
          <div 
            className="text-justify text-lg leading-relaxed columns-1 md:columns-2 gap-10 font-serif drop-cap"
            dangerouslySetInnerHTML={{ __html: article.content || "" }}
          />

        </article>

        {/* Patrocinador de Cierre */}
        {footerSponsor && (
          <div className="border-2 border-[#2c241b] p-3 text-center bg-[#eae0c4] mt-12 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-widest font-bold border border-[#2c241b] px-2 py-0.5">Espacio Patrocinado</span>
            <a 
              href={footerSponsor.website_url || footerSponsor.instagram_url || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              {footerSponsor.banner_url ? (
                <img src={footerSponsor.banner_url} alt={footerSponsor.name} className="h-10 md:h-12 object-contain grayscale contrast-125 sepia-[.3]" />
              ) : (
                <p className="font-black uppercase tracking-tighter text-lg italic">{footerSponsor.name} {footerSponsor.slogan ? `— ${footerSponsor.slogan}` : ""}</p>
              )}
            </a>
            <span className="text-xs font-serif italic text-gray-700 hidden md:block">¡Gracias por apoyarnos!</span>
          </div>
        )}

      </main>

      <footer className="text-center py-6 border-t-2 border-[#2c241b] text-xs font-bold uppercase tracking-widest mt-12">
        <p>Editado e Impreso por Nexativa News — Año 2026</p>
      </footer>

    </div>
  );
}
