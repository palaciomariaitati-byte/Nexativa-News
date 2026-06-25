import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ClassicRadioPlayer from "./ClassicRadioPlayer";

export const metadata = {
  title: "Edición Clásica | Nexativa News",
  description: "Versión de lectura tradicional estilo periódico antiguo.",
};

export const revalidate = 0; // Disable static caching

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

export default async function ClassicNewspaperPage() {
  const supabase = createServerSupabaseClient();

  // Fetch articles
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch sponsors
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .eq("is_active", true);

  // Fetch radio stream URL
  const { data: settingData } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "radio_stream_url")
    .single();
    
  const radioUrl = settingData?.value || "https://stream.zeno.fm/gnyb99k8zzruv"; // Default fallback if missing

  const mainArticle = articles?.[0];
  const sideArticles = articles?.slice(1, 4);
  const bottomArticles = articles?.slice(4);

  return (
    <div className="min-h-screen bg-[#f4ebd0] text-[#2c241b] font-serif selection:bg-[#2c241b] selection:text-[#f4ebd0]">
      {/* Barra de navegación superior rústica */}
      <div className="w-full border-b-2 border-[#2c241b] py-2 px-4 flex justify-between items-center text-sm font-bold uppercase tracking-widest sticky top-0 bg-[#f4ebd0] z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-4 h-4" />
          Volver a Versión Moderna
        </Link>
        <div className="hidden sm:block">
          Ituzaingó, Corrientes - {new Date().toLocaleDateString("es-AR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-4">
          <button className="hover:opacity-70" aria-label="Aumentar fuente" id="btn-zoom-in">[ A+ ]</button>
          <button className="hover:opacity-70" aria-label="Disminuir fuente" id="btn-zoom-out">[ A- ]</button>
        </div>
      </div>

      {/* Cabecera Principal del Periódico */}
      <header className="max-w-6xl mx-auto px-4 py-8 text-center border-b-4 border-double border-[#2c241b] mb-8 relative mt-16 sm:mt-0 flex flex-col items-center">
        <div className="mb-6 sm:absolute sm:top-8 sm:right-4 sm:mb-0 z-10 sm:scale-100 origin-top-right">
           {/* Reproductor de Radio Vintage */}
           <ClassicRadioPlayer streamUrl={radioUrl} />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          NEXATIVA NEWS
        </h1>
        <div className="flex justify-between items-center border-y border-[#2c241b] py-1 text-xs md:text-sm font-bold uppercase tracking-widest mt-6">
          <span>Edición Especial</span>
          <span>Director: Nexativa</span>
          <span>Precio: Invaluable</span>
        </div>
      </header>

      {/* Cuerpo del Periódico */}
      <main className="max-w-6xl mx-auto px-4 pb-20">
        {mainArticle && (
          <article className="mb-12 border-b-2 border-[#2c241b] pb-12">
            <h2 className="text-4xl md:text-6xl font-black leading-none mb-6 text-center uppercase">
              <Link href={`/noticias/${mainArticle.id}`} className="hover:underline decoration-4 underline-offset-8">
                {mainArticle.title}
              </Link>
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              {getDisplayImage(mainArticle) && (
                <div className="w-full md:w-2/3 shrink-0">
                  <img 
                    src={getDisplayImage(mainArticle)} 
                    alt={mainArticle.title}
                    className="w-full h-auto border-4 border-double border-[#2c241b] grayscale contrast-125 sepia-[.3]"
                  />
                  <p className="text-xs italic text-right mt-2 font-bold">Registro fotográfico del suceso.</p>
                </div>
              )}
              <div className="text-lg md:text-xl text-justify leading-relaxed columns-1 md:columns-2 gap-8 w-full">
                <p className="first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2">
                  {mainArticle.excerpt || "Lea la nota completa en nuestro portal o haciendo clic en el titular."}
                </p>
                <div 
                  className="mt-4 line-clamp-[12]"
                  dangerouslySetInnerHTML={{ __html: mainArticle.content || "" }}
                />
              </div>
            </div>
          </article>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sideArticles?.map((article, i) => (
            <article key={article.id} className={`flex flex-col ${i !== 2 ? 'md:border-r border-[#2c241b] md:pr-8' : ''}`}>
              <h3 className="text-2xl font-black leading-tight mb-4 uppercase">
                <Link href={`/noticias/${article.id}`} className="hover:underline decoration-2 underline-offset-4">
                  {article.title}
                </Link>
              </h3>
              {getDisplayImage(article) && (
                <img 
                  src={getDisplayImage(article)} 
                  alt={article.title}
                  className="w-full h-48 object-cover mb-4 border border-[#2c241b] grayscale contrast-125 sepia-[.3]"
                />
              )}
              <p className="text-justify text-base leading-relaxed">
                {article.excerpt}
              </p>
            </article>
          ))}
        </div>

        {/* Publicidad Vintage */}
        {sponsors && sponsors.length > 0 ? (
          <div className="my-12 p-8 border-4 border-double border-[#2c241b] text-center bg-[#eae0c4]">
            <h4 className="text-sm uppercase tracking-widest font-bold mb-6">- Avisos Clasificados -</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {sponsors.map((sponsor) => (
                <a 
                  key={sponsor.id} 
                  href={sponsor.website_url || sponsor.instagram_url || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="border-2 border-dashed border-[#2c241b] p-4 flex flex-col items-center justify-center hover:bg-[#d8cba8] transition-colors"
                >
                  {sponsor.logo_url && (
                    <img src={sponsor.logo_url} alt={sponsor.name} className="h-16 object-contain mb-4 grayscale contrast-125 sepia-[.3]" />
                  )}
                  <p className="font-black uppercase tracking-tighter text-xl">{sponsor.name}</p>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="my-12 p-8 border-4 border-double border-[#2c241b] text-center bg-[#eae0c4]">
            <h4 className="text-sm uppercase tracking-widest font-bold mb-4">- Avisos Clasificados -</h4>
            <p className="text-3xl font-black uppercase tracking-tighter italic">Espacio Disponible</p>
            <p className="text-lg mt-2">Su empresa podría estar anunciándose aquí.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 border-t-2 border-[#2c241b] pt-8">
          {bottomArticles?.map((article) => (
            <article key={article.id} className="flex flex-col">
              <h4 className="text-lg font-bold leading-tight mb-2">
                <Link href={`/noticias/${article.id}`} className="hover:underline">
                  {article.title}
                </Link>
              </h4>
              <p className="text-sm text-justify line-clamp-4">{article.excerpt}</p>
            </article>
          ))}
        </div>
      </main>
      
      <footer className="text-center py-6 border-t-2 border-[#2c241b] text-xs font-bold uppercase tracking-widest mt-12">
        <p>Editado e Impreso por Nexativa News — Año 2026</p>
      </footer>
    </div>
  );
}
