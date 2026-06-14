import React from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CulturalPost } from "@/lib/types";

// Opt-out of static rendering so we get fresh data
export const dynamic = "force-dynamic";

export default async function CulturaPage() {
  const supabase = createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("cultural_posts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const culturalPosts = (posts as CulturalPost[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl md:text-6xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase title-glow">
          Espacio Cultural
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto font-light">
          Un rincón dedicado a fomentar, difundir y disfrutar del arte, la escritura y los proyectos de nuestros creadores locales y regionales.
        </p>
      </div>

      {culturalPosts.length === 0 ? (
        <div className="text-center py-20 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
          <p className="text-white/50 text-xl">Aún no hay obras publicadas. ¡Pronto habrá novedades!</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {culturalPosts.map((post) => (
            <Link key={post.id} href={`/cultura/${post.id}`} className="block break-inside-avoid group">
              <div className="glass-panel overflow-hidden border border-white/10 hover:border-[var(--color-brand-accent)]/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--color-brand-accent)]/20 rounded-2xl relative">
                
                {post.image_url ? (
                  <div className="w-full relative">
                    <img 
                      src={post.image_url} 
                      alt={post.title} 
                      className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-[var(--color-brand-accent)] transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-[var(--color-brand-accent)] font-medium text-sm tracking-wider uppercase mb-3">
                        Por {post.author_name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-[var(--color-brand-accent)] transition-colors line-clamp-3">
                      {post.title}
                    </h2>
                    <p className="text-[var(--color-brand-accent)] font-medium text-sm tracking-wider uppercase mb-4">
                      Por {post.author_name}
                    </p>
                    <p className="text-white/70 line-clamp-4 text-sm leading-relaxed mb-6 font-serif italic">
                      "{post.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}..."
                    </p>
                  </div>
                )}
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[var(--color-brand-accent)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-3xl"></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
