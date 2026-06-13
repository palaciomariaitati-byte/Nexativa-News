"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import NoraAssistant from "@/components/NoraAssistant";

export default function NewsEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");
  const supabase = getSupabaseBrowserClient();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    image_url: "",
    external_url: "",
    category: "nacional",
    status: "draft",
  });

  useEffect(() => {
    if (articleId) {
      async function fetchArticle() {
        const { data } = await supabase.from("articles").select("*").eq("id", articleId).single();
        if (data) {
          setFormData({
            title: data.title || "",
            excerpt: data.excerpt || "",
            content: data.content || "",
            image_url: data.image_url || "",
            external_url: data.external_url || "",
            category: data.category || "nacional",
            status: data.status || "draft",
          });
        }
      }
      fetchArticle();
    }
  }, [articleId, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      ...formData,
      author_id: session?.user.id,
      updated_at: new Date().toISOString(),
    };

    if (articleId) {
      // Update
      const { error } = await supabase.from("articles").update(payload).eq("id", articleId);
      if (error) alert("Error al guardar: " + error.message);
      else router.push("/admin/news");
    } else {
      // Insert
      const { error } = await supabase.from("articles").insert([payload]);
      if (error) alert("Error al crear: " + error.message);
      else router.push("/admin/news");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">
          {articleId ? "Editar Noticia" : "Nueva Noticia"}
        </h1>
        <button onClick={() => router.push("/admin/news")} className="text-white/50 hover:text-white uppercase tracking-widest text-sm font-bold transition-colors">
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSave} className="lg:col-span-2 bg-black/20 rounded-xl border border-white/10 p-6 space-y-6">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Título</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="Escribe un título llamativo..."
            />
          </div>

          {/* Resumen / Excerpt */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Resumen (Subtítulo)</label>
            <textarea
              name="excerpt"
              rows={2}
              value={formData.excerpt}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="Breve descripción de la noticia..."
            />
          </div>

          {/* Categoría y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Categoría</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              >
                <option value="nacional">Nacional</option>
                <option value="internacional">Internacional</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Estado</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              >
                <option value="draft">Borrador (Oculto)</option>
                <option value="published">Publicado (Visible)</option>
              </select>
            </div>
          </div>

          {/* Imagen URL */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">URL de la Imagen Principal</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {/* Enlace Externo (Opcional) */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Enlace Externo (Nota Original)</label>
            <input
              type="url"
              name="external_url"
              value={formData.external_url}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="https://canal.com/noticia-completa"
            />
          </div>

          {/* Contenido Principal */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Contenido Completo</label>
            <textarea
              name="content"
              rows={15}
              required
              value={formData.content}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="Escribe el cuerpo de la noticia aquí..."
            />
          </div>

          {/* Botón Guardar */}
          <div className="pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black font-bold uppercase tracking-widest py-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : (articleId ? "Guardar Cambios" : "Publicar Noticia")}
            </button>
          </div>

        </form>

        {/* Panel Lateral: Nora AI */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <NoraAssistant title={formData.title} content={formData.content} />
          </div>
        </div>
      </div>
    </div>
  );
}
