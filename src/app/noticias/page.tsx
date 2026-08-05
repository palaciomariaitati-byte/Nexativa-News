import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Newspaper, Flame, Search, ArrowRight, ShieldCheck, Tag } from "lucide-react";

export const revalidate = 0; // Sin cache estática para refresco instantáneo

export const metadata = {
  title: "Noticias & Edición Digital | Nexativa News",
  description: "Todas las noticias de Argentina, Corrientes y Deportes en vivo.",
};

export default async function NoticiasPage() {
  const supabase = createServerSupabaseClient();

  // Obtener todas las noticias publicadas recientemente
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);

  const newsList = articles || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Header Sección Noticias */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            <span>Redacción en Vivo • Nexativa News</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Portal Digital de Noticias
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Cobertura periodística en tiempo real sobre actualidad Nacional, Corrientes & Región Litoral y Deportes.
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-8">
        {newsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((article: any, index: number) => {
              const categoryName = (article.category || "nacional").toUpperCase();
              const isMain = index === 0;

              return (
                <article
                  key={article.id}
                  className={`bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-cyan-500/40 transition-all group flex flex-col justify-between ${
                    isMain ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  <div>
                    {/* Imagen de Portada */}
                    {article.image_url ? (
                      <div className={`overflow-hidden relative bg-slate-950 ${isMain ? "h-64 sm:h-80" : "h-48"}`}>
                        <Image
                          src={article.image_url}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-300 text-[10px] font-black tracking-widest uppercase">
                          {categoryName}
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{categoryName}</span>
                      </div>
                    )}

                    {/* Contenido de la Noticia */}
                    <div className="p-6">
                      <h2 className={`font-black text-white group-hover:text-cyan-300 transition-colors leading-snug mb-3 ${isMain ? "text-xl sm:text-2xl" : "text-base"}`}>
                        {article.title}
                      </h2>

                      {article.excerpt && (
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer de Tarjeta con Link al Artículo */}
                  <div className="px-6 pb-6 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[10px]">
                      {new Date(article.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <Link
                      href={`/noticias/${article.id}`}
                      className="inline-flex items-center gap-1 text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                    >
                      <span>Leer Nota</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No hay noticias registradas aún</h3>
            <p className="text-xs text-slate-400 mb-6">
              Iniciá la sincronización automática desde el panel de administración o agregá tu primer artículo.
            </p>
            <Link
              href="/admin/news"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs"
            >
              <span>Ir al Panel Admin</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
