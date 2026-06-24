import React from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = createServerSupabaseClient();
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, image_url")
    .eq("id", id)
    .single();

  if (!article) {
    return {
      title: "Noticia no encontrada | Nexativa News",
    };
  }

  return {
    title: `${article.title} | Nexativa News`,
    description: article.excerpt || "Lee la noticia completa en Nexativa News.",
    openGraph: {
      title: article.title,
      description: article.excerpt || "",
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = createServerSupabaseClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !article) {
    notFound();
  }

  const videoUrl = article.video_url;
  const isDirectVideo = videoUrl?.match(/\.(mp4|webm|ogg)$/i) || article.image_url?.match(/\.(mp4|webm|ogg)$/i);
  const isYouTube = videoUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  const youtubeId = isYouTube ? isYouTube[1] : null;

  const actualImageUrl = article.image_url;

  return (
    <div className="min-h-screen pb-20">
      {/* Cabecera / Media */}
      <div className="w-full h-[50vh] md:h-[60vh] relative border-b border-[var(--color-brand-accent)] shadow-[0_0_30px_rgba(212,175,55,0.15)] bg-black overflow-hidden">
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1`}
            className="w-full h-full object-cover pointer-events-auto z-10 relative"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isDirectVideo ? (
          <video
            src={videoUrl || article.image_url || undefined}
            autoPlay
            muted
            loop
            controls
            className="w-full h-full object-cover pointer-events-auto z-10 relative"
          />
        ) : actualImageUrl ? (
          <>
            {/* Capa 1: Fondo Difuminado (Blur) para llenar la pantalla en PC */}
            <div 
              className="absolute inset-0 w-full h-full bg-center bg-cover blur-3xl opacity-50 scale-110"
              style={{ backgroundImage: `url(${actualImageUrl})` }}
            />
            {/* Capa 2: Imagen Original Completa al Frente sin recortes */}
            <img
              src={actualImageUrl}
              alt={article.title}
              className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
            />
          </>
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center relative z-10">
            <span className="text-[var(--color-brand-accent)] text-4xl font-serif font-bold uppercase tracking-widest opacity-30">
              Nexativa News
            </span>
          </div>
        )}
        
        {/* Gradiente Oscuro en la base para que el texto sea legible (SIEMPRE ENCIMA) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-20 pointer-events-none" />
        
        {/* Contenido en la Cabecera */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:px-24 z-30">
          <Link
            href="/#noticias"
            className="inline-flex items-center gap-2 text-white/70 hover:text-[var(--color-brand-accent)] transition-colors mb-6 uppercase tracking-widest text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-[var(--color-brand-accent)] text-black px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest">
              {article.category || "General"}
            </span>
            <time className="text-white/60 text-xs font-medium tracking-wider">
              {new Date(article.created_at).toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4 drop-shadow-lg">
            {article.title}
          </h1>
          
          {article.excerpt && (
            <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed max-w-4xl drop-shadow-md border-l-2 border-[var(--color-brand-accent)] pl-4">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Cuerpo de la Noticia */}
      <main className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        <div 
          className="prose prose-invert prose-lg md:prose-xl max-w-none 
          prose-headings:font-serif prose-headings:text-[var(--color-brand-accent)] 
          prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-[var(--color-brand-accent)] 
          prose-strong:text-white prose-blockquote:border-[var(--color-brand-accent)] prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Cierre y Aviso Legal */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-[var(--color-brand-accent)] flex items-center justify-center bg-black/50 overflow-hidden">
             <span className="text-[var(--color-brand-accent)] font-serif font-bold text-xl">NX</span>
          </div>
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">
            Redacción Nexativa News
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8 max-w-2xl w-full text-left">
            <h4 className="text-[var(--color-brand-accent)] font-bold uppercase tracking-wider text-xs mb-2">
              Aviso Legal - Derecho de Cita (Ley 11.723)
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              El presente material periodístico es de producción propia o ha sido curado y procesado de forma autónoma respetando los lineamientos del Derecho de Cita. Si consideras que existe un error involuntario o deseas ejercer el derecho de rectificación, por favor{" "}
              <a href="https://wa.me/5493786414533" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white underline">
                comunícate con nuestra redacción
              </a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
