"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CulturalPost } from "@/lib/types";

export default function AdminCulturePage() {
  const [posts, setPosts] = useState<CulturalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cultural_posts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setPosts(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este proyecto/obra? Esta acción no se puede deshacer.")) {
      const { error } = await supabase.from("cultural_posts").delete().eq("id", id);
      if (!error) {
        setPosts(posts.filter(p => p.id !== id));
      } else {
        alert("Error al eliminar la obra.");
      }
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const { error } = await supabase.from("cultural_posts").update({ status: newStatus }).eq("id", id);
    if (!error) {
      fetchPosts(); // Refetch to update UI
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Espacio Cultural</h1>
        <Link href="/admin/culture/editor" className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors">
          + Nueva Obra
        </Link>
      </div>

      <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/50">Cargando espacio cultural...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-white/50">No hay obras o proyectos publicados. ¡Sube el primero!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Título</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Autor / Artista</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Estado</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Fecha</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-white truncate max-w-xs">{post.title}</p>
                    </td>
                    <td className="p-4 text-sm text-white/80">{post.author_name}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleStatusToggle(post.id, post.status)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${post.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}
                      >
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                      </button>
                    </td>
                    <td className="p-4 text-sm text-white/50">
                      {new Date(post.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <Link href={`/admin/culture/editor?id=${post.id}`} className="text-[var(--color-brand-accent)] hover:text-white transition-colors text-sm uppercase tracking-wider font-bold">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase tracking-wider font-bold">
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
