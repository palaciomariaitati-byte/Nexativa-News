"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Article, NewsCategory } from "@/lib/types";
import { NEWS_TAB_LABELS } from "@/lib/types";

// ----------------------------------------------------------------
// Helper sanitize text
// ----------------------------------------------------------------
function sanitizeExcerpt(raw: string | null): string {
  if (!raw) return "";
  let text = raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Remover cualquier etiqueta HTML
  text = text.replace(/<[^>]+>/g, "").trim();

  // Remover URLs pegadas en la descripción
  text = text.replace(/https?:\/\/\S+/gi, "").trim();

  return text;
}

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface NewsTabsProps {
  /** Pre-fetched articles for the initial tab (server-rendered). */
  initialArticles: Article[];
  /** Which tab was pre-fetched on the server. */
  initialTab?: string;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function NewsTabs({
  initialArticles,
  initialTab = "Nacional",
}: NewsTabsProps) {
  const tabLabels = Object.keys(NEWS_TAB_LABELS);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache to avoid re-fetching tabs the user has already visited.
  const cacheRef = useRef<Record<string, Article[]>>({
    [initialTab]: initialArticles,
  });

  // ----- Fetch helper (Estricto por categoría elegida y fecha actual) -----
  const fetchArticles = useCallback(async (category: NewsCategory) => {
    const supabase = getSupabaseBrowserClient();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error: dbError } = await supabase
      .from("articles")
      .select("id, title, excerpt, image_url, category, created_at, external_url")
      .eq("status", "published")
      .eq("category", category) // Búsqueda ESTRICTA por rubro
      .gte("created_at", twoDaysAgo) // POLÍTICA ESTRICTA DE NOTICIAS DE HOY / ÚLTIMAS 48H
      .order("created_at", { ascending: false })
      .limit(20);

    if (dbError) throw dbError;
    return (data ?? []) as unknown as Article[];
  }, []);

  // ----- Tab switch handler -----
  const handleTabChange = useCallback(
    async (label: string) => {
      if (label === activeTab) return; // ya activo

      setActiveTab(label);
      setError(null);

      // Si ya está en caché, usarlo
      if (cacheRef.current[label]) {
        setArticles(cacheRef.current[label]);
        return;
      }

      const category = NEWS_TAB_LABELS[label];
      setLoading(true);

      try {
        const data = await fetchArticles(category);
        cacheRef.current[label] = data;
        setArticles(data);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Error al cargar las noticias de esta categoría.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, fetchArticles]
  );

  useEffect(() => {
    cacheRef.current[initialTab] = initialArticles;
    if (activeTab === initialTab) {
      setArticles(initialArticles);
    }
  }, [initialArticles, initialTab, activeTab]);

  return (
    <div className="glass-panel overflow-hidden">
      {/* ---- Tab bar ---- */}
      <div className="flex border-b border-white/10 bg-black/20 overflow-x-auto">
        {tabLabels.map((label) => (
          <button
            key={label}
            id={`news-tab-${label.toLowerCase()}`}
            onClick={() => handleTabChange(label)}
            className={`
              flex-1 px-4 py-3 text-xs sm:text-sm font-bold tracking-wide uppercase whitespace-nowrap
              transition-all duration-200 cursor-pointer
              ${
                activeTab === label
                  ? "bg-[var(--color-brand-accent)] text-black border-b-2 border-white shadow-sm font-black"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- Content ---- */}
      <div className="p-4 min-h-[220px]">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-24 h-24 bg-white/10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-red-400 font-bold">{error}</p>
          </div>
        )}

        {/* Empty state por categoría */}
        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="p-3 bg-white/5 rounded-full text-gray-500 mb-1">
              📰
            </div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              No hay publicaciones recientes en {activeTab}
            </p>
            <p className="text-[11px] text-gray-500 max-w-xs">
              Sincronizá el bot de ingesta o agregá una fuente RSS del rubro {activeTab} en Ajustes.
            </p>
          </div>
        )}

        {/* Lista Estricta de Noticias (Máximo 4 Destacadas por Segmento para no saturar la Portada) */}
        {!loading && !error && articles.length > 0 && (
          <div className="space-y-4">
            <ul className="space-y-4">
              {articles.slice(0, 4).map((article) => {
                const cleanSummary = sanitizeExcerpt(article.excerpt);

                const content = (
                  <div className="flex gap-4 items-start group">
                    {article.image_url && (
                      <img 
                        src={article.image_url} 
                        alt="" 
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
                        }}
                        className="w-24 h-24 sm:w-32 sm:h-28 object-cover rounded-xl border border-white/10 shrink-0 group-hover:scale-105 transition-transform duration-300" 
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm sm:text-base text-gray-100 group-hover:text-[var(--color-brand-accent)] transition-colors leading-snug">
                        {article.title}
                      </h4>

                      {cleanSummary && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed font-light">
                          {cleanSummary}
                        </p>
                      )}

                      {article.created_at && (
                        <time className="text-[10px] text-cyan-400 font-mono mt-2 block">
                          📅 {new Date(article.created_at).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </time>
                      )}
                    </div>
                  </div>
                );

                return (
                  <li key={article.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    {article.external_url ? (
                      <a
                        href={article.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:no-underline"
                      >
                        {content}
                      </a>
                    ) : (
                      <a href={`/noticias/${article.id}`} className="block hover:no-underline">
                        {content}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Enlace al Portal Completo de Noticias */}
            <div className="pt-4 border-t border-white/10 text-center">
              <a
                href="/news"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-accent)] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-lg shadow-amber-500/10"
              >
                📰 Explorar Todas las Noticias en el Portal Completo ({articles.length}+) →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legal Transparente */}
      <div className="px-4 py-2 bg-black/40 border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-between">
        <span>Aviso Legal: Notas adaptadas regionalmente bajo el Derecho de Citas (Ley 11.723).</span>
      </div>
    </div>
  );
}
