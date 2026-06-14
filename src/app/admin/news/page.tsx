"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Article } from "@/lib/types";

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  async function fetchArticles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setArticles(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchArticles();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer.")) {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (!error) {
        setArticles(articles.filter(a => a.id !== id));
      } else {
        alert("Error al eliminar la noticia.");
      }
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const { error } = await supabase.from("articles").update({ status: newStatus }).eq("id", id);
    if (!error) {
      fetchArticles(); // Refetch to update UI
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Prensa & Noticias</h1>
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              setLoading(true);
              const res = await fetch("/api/cron/auto-fetch");
              const data = await res.json();
              if (data.success) {
                alert(data.message);
                fetchArticles();
              } else {
                alert("Error al sincronizar: " + (data.message || data.error));
              }
              setLoading(false);
            }}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors flex items-center gap-2"
          >
            Sincronizar Ahora
          </button>
          <Link href="/admin/news/editor" className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors">
            + Nueva Noticia
          </Link>
        </div>
      </div>

      <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/50">Cargando noticias...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-white/50">No hay noticias publicadas. ¡Crea la primera!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Título</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Categoría</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Estado</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Fecha</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-white truncate max-w-xs">{article.title}</p>
                    </td>
                    <td className="p-4 uppercase text-xs">{article.category || "N/A"}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleStatusToggle(article.id, article.status)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${article.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}
                      >
                        {article.status === 'published' ? 'Publicado' : 'Borrador'}
                      </button>
                    </td>
                    <td className="p-4 text-sm text-white/50">
                      {new Date(article.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <Link href={`/admin/news/editor?id=${article.id}`} className="text-[var(--color-brand-accent)] hover:text-white transition-colors text-sm uppercase tracking-wider font-bold">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(article.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase tracking-wider font-bold">
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
