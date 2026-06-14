import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CulturalPost } from "@/lib/types";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("cultural_posts").select("title, content, image_url").eq("id", params.id).single();
  
  if (!data) return { title: "Obra no encontrada" };
  
  // Stripping HTML tags for description
  const cleanDescription = data.content.replace(/<[^>]+>/g, '').substring(0, 160) + "...";
  
  return {
    title: data.title,
    description: cleanDescription,
    openGraph: {
      title: data.title,
      description: cleanDescription,
      images: data.image_url ? [{ url: data.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: cleanDescription,
      images: data.image_url ? [data.image_url] : [],
    }
  };
}

export default async function CulturalPostDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("cultural_posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) {
    notFound();
  }

  const post = data as CulturalPost;

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/cultura" className="inline-block text-[var(--color-brand-accent)] hover:text-white uppercase tracking-widest text-sm font-bold transition-colors mb-8">
        ← Volver al Espacio Cultural
      </Link>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
        {post.image_url && (
          <div className="w-full relative h-[400px] md:h-[500px]">
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          </div>
        )}

        <div className={`p-8 md:p-12 relative z-10 ${post.image_url ? '-mt-48' : ''}`}>
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm md:text-base">
              <span className="text-[var(--color-brand-accent)] font-bold tracking-widest uppercase px-4 py-2 bg-black/40 rounded-full border border-[var(--color-brand-accent)]/30 backdrop-blur-md">
                Obra de {post.author_name}
              </span>
              <span className="text-white/50 px-4 py-2 bg-black/40 rounded-full backdrop-blur-md">
                {new Date(post.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div 
            className="prose prose-invert prose-lg max-w-none font-serif text-white/90 leading-relaxed space-y-6"
            style={{
              fontSize: '1.125rem'
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.project_url && (
            <div className="mt-16 pt-10 border-t border-white/10 text-center">
              <p className="text-white/70 mb-4 font-light">¿Te interesó el proyecto de {post.author_name}?</p>
              <a 
                href={post.project_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-[var(--color-brand-accent)] text-black font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:scale-105 transition-transform hover:shadow-lg hover:shadow-[var(--color-brand-accent)]/30"
              >
                Visitar Proyecto o Redes
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
