"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CultureEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");
  const supabase = getSupabaseBrowserClient();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author_name: "",
    image_url: "",
    project_url: "",
    status: "draft",
  });

  useEffect(() => {
    if (postId) {
      async function fetchPost() {
        const { data } = await supabase.from("cultural_posts").select("*").eq("id", postId).single();
        if (data) {
          setFormData({
            title: data.title || "",
            content: data.content || "",
            author_name: data.author_name || "",
            image_url: data.image_url || "",
            project_url: data.project_url || "",
            status: data.status || "draft",
          });
        }
      }
      fetchPost();
    }
  }, [postId, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      updated_at: new Date().toISOString(),
    };

    if (postId) {
      const { error } = await supabase.from("cultural_posts").update(payload).eq("id", postId);
      if (error) alert("Error al guardar: " + error.message);
      else router.push("/admin/culture");
    } else {
      const { error } = await supabase.from("cultural_posts").insert([payload]);
      if (error) alert("Error al crear: " + error.message);
      else router.push("/admin/culture");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">
          {postId ? "Editar Obra" : "Nueva Obra Cultural"}
        </h1>
        <button onClick={() => router.push("/admin/culture")} className="text-white/50 hover:text-white uppercase tracking-widest text-sm font-bold transition-colors">
          Volver
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-black/20 rounded-xl border border-white/10 p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Título de la Obra</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="Ej: Poema del Río..."
            />
          </div>

          {/* Autor */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Autor / Artista</label>
            <input
              type="text"
              name="author_name"
              required
              value={formData.author_name}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="Nombre del artista local..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Imagen URL */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">URL de la Imagen (Portada/Obra)</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {/* Enlace de Proyecto */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Enlace del Proyecto / Redes</label>
            <input
              type="url"
              name="project_url"
              value={formData.project_url}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              placeholder="https://instagram.com/artista"
            />
          </div>
        </div>

        {/* Estado */}
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

        {/* Contenido Principal */}
        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Contenido de la Obra (Poesía, Historia, etc)</label>
          <textarea
            name="content"
            rows={15}
            required
            value={formData.content}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
            placeholder="Escribe el contenido aquí..."
          />
        </div>

        {/* Botón Guardar */}
        <div className="pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black font-bold uppercase tracking-widest py-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : (postId ? "Guardar Cambios" : "Publicar Obra")}
          </button>
        </div>

      </form>
    </div>
  );
}
