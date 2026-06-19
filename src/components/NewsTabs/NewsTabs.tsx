"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Article, NewsCategory } from "@/lib/types";
import { NEWS_TAB_LABELS } from "@/lib/types";

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

  // ----- Fetch helper (runs only on tab change, NOT on every render) -----
  const fetchArticles = useCallback(async (category: NewsCategory) => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: dbError } = await supabase
      .from("articles")
      .select("id, title, excerpt, image_url, category, created_at, external_url")
      .eq("category", category)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20);

    if (dbError) throw dbError;
    return (data ?? []) as Article[];
  }, []);

  // ----- Tab switch handler -----
  const handleTabChange = useCallback(
    async (label: string) => {
      if (label === activeTab) return; // already active

      setActiveTab(label);
      setError(null);

      // Serve from cache if available
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
        setError("Error al cargar las noticias. Intenta nuevamente.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, fetchArticles]
  );

  // ----- Sync when initialArticles change (e.g. page revalidation) -----
  useEffect(() => {
    cacheRef.current[initialTab] = initialArticles;
    if (activeTab === initialTab) {
       
      setArticles(initialArticles);
    }
  }, [initialArticles, initialTab, activeTab]);

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="glass-panel overflow-hidden">
      {/* ---- Tab bar ---- */}
      <div className="flex border-b border-white/10 bg-black/20">
        {tabLabels.map((label) => (
          <button
            key={label}
            id={`news-tab-${label.toLowerCase()}`}
            onClick={() => handleTabChange(label)}
            className={`
              flex-1 px-4 py-2.5 text-sm font-semibold tracking-wide
              transition-all duration-200 cursor-pointer
              ${
                activeTab === label
                  ? "bg-[var(--color-brand-accent)] text-black border-b-2 border-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- Content ---- */}
      <div className="p-3 min-h-[180px]">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-px bg-white/5 mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="w-10 h-10 text-red-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5"
              />
            </svg>
            <p className="text-sm text-gray-400 font-medium">
              No hay noticias disponibles en esta categoría
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Vuelve pronto para nuevas publicaciones
            </p>
          </div>
        )}

        {/* Article list */}
        {!loading && !error && articles.length > 0 && (
          <ul className="space-y-2">
            {articles.map((article) => {
              const content = (
                <>
                  <h4 className="font-bold text-sm text-gray-200 group-hover:text-[var(--color-brand-accent)] transition-colors leading-snug">
                    {article.title}
                  </h4>
                  {article.excerpt && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                  {article.created_at && (
                    <time className="text-[11px] text-gray-500 mt-2 block">
                      {new Date(article.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </>
              );

              return (
                <li
                  key={article.id}
                  className="group px-3 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
                >
                  {(article as any).external_url ? (
                    <a href={(article as any).external_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      {content}
                    </a>
                  ) : (
                    <div>{content}</div>
                  )}
                  {/* Legal Notice Ley 11.723 */}
                  <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-500">
                    <p className="mb-1 leading-tight">
                      <strong>Aviso Legal:</strong> Esta nota fue procesada y adaptada regionalmente por nuestro sistema editorial autónomo bajo el <strong>Derecho de Cita (Ley 11.723)</strong>.
                    </p>
                    <a href="https://wa.me/5493786414533" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white underline">
                      Reportar Error o Solicitar Rectificación
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
