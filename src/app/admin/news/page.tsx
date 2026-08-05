"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { Check, Copy, ExternalLink, Share2, X } from "lucide-react";

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverId, setCoverId] = useState<string | null>(null);

  // Estado del Modal Asistente de Publicación Rápida a Redes
  const [shareModalData, setShareModalData] = useState<{
    open: boolean;
    title: string;
    copy: string;
    imageUrl: string;
    newsUrl: string;
    loading: boolean;
  }>({
    open: false,
    title: "",
    copy: "",
    imageUrl: "",
    newsUrl: "",
    loading: false,
  });

  const [copiedText, setCopiedText] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);

    const { data: coverSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "main_cover_article_id")
      .maybeSingle();

    if (coverSetting && coverSetting.value) {
      setCoverId(coverSetting.value);
    }

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles:", error);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const { error } = await supabase.from("articles").update({ status: newStatus }).eq("id", id);

    if (error) alert("Error al cambiar estado: " + error.message);
    else fetchArticles();
  };

  const handleSetCover = async (id: string) => {
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "main_cover_article_id", value: id });

    if (error) {
      alert("Error al fijar portada: " + error.message);
    } else {
      setCoverId(id);
      alert("¡Noticia fijada como Portada Principal de la edición clásica!");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta noticia?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) alert("Error al borrar: " + error.message);
    else fetchArticles();
  };

  // Abrir Modal Asistente de Redes Sociales con Copy Generado por Nora AI
  const handleOpenShareModal = async (article: any) => {
    setShareModalData({
      open: true,
      title: article.title,
      copy: `📲 ¡ÚLTIMO MOMENTO EN ITUZAINGÓ! 🌿\n\n${article.title}\n\n${article.excerpt || ''}\n\n👉 Leé la nota completa en https://www.nexativanews.com.ar/noticias/${article.id}\n\n#Ituzaingó #Corrientes #NexativaNews`,
      imageUrl: article.image_url || '',
      newsUrl: `https://www.nexativanews.com.ar/noticias/${article.id}`,
      loading: true,
    });
    setCopiedText(false);

    try {
      const res = await fetch("/api/social-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, type: "news" }),
      });
      const result = await res.json();

      if (result.social_copy) {
        setShareModalData((prev) => ({
          ...prev,
          copy: result.social_copy,
          loading: false,
        }));
      } else {
        setShareModalData((prev) => ({ ...prev, loading: false }));
      }
    } catch (e) {
      setShareModalData((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCopyCopy = () => {
    navigator.clipboard.writeText(shareModalData.copy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Prensa & Noticias</h1>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={async () => {
              setLoading(true);
              const res = await fetch("/api/admin/auto-classify");
              const data = await res.json();
              if (data.success) {
                alert(data.message);
                fetchArticles();
              } else {
                alert("Error al clasificar: " + (data.message || data.error));
              }
              setLoading(false);
            }}
            className="bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-1.5"
          >
            🎯 Auto-Clasificar por Rubro
          </button>

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
            className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-1.5"
          >
            Sincronizar Ahora
          </button>
          <Link href="/admin/news/editor" className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors">
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
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenShareModal(article)}
                        className="bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/50 text-pink-300 px-2.5 py-1 rounded text-xs uppercase tracking-wider font-bold transition-colors inline-flex items-center gap-1"
                        title="Abrir Asistente de Publicación en Redes"
                      >
                        <Share2 className="w-3 h-3" /> Redes
                      </button>

                      {coverId === article.id ? (
                        <span className="text-yellow-400 font-bold text-xs uppercase tracking-wider bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">★ Portada</span>
                      ) : (
                        <button 
                          onClick={() => handleSetCover(article.id)} 
                          className="text-gray-400 hover:text-yellow-400 transition-colors text-xs uppercase tracking-wider font-bold"
                          title="Fijar como noticia de portada en la edición clásica"
                        >
                          ☆ Portada
                        </button>
                      )}

                      <a 
                        href={article.external_url && article.external_url.trim() !== "" ? article.external_url : `/noticias/${article.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:text-blue-300 transition-colors text-xs uppercase tracking-wider font-bold"
                      >
                        Ver
                      </a>
                      <Link href={`/admin/news/editor?id=${article.id}`} className="text-[var(--color-brand-accent)] hover:text-white transition-colors text-xs uppercase tracking-wider font-bold">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(article.id)} className="text-red-400 hover:text-red-300 transition-colors text-xs uppercase tracking-wider font-bold">
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

      {/* ---- MODAL ASISTENTE DE PUBLICACIÓN RÁPIDA A REDES (INSTAGRAM / FACEBOOK / WHATSAPP) ---- */}
      {shareModalData.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-pink-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShareModalData((prev) => ({ ...prev, open: false }))}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-pink-400">
              <Share2 className="w-5 h-5" />
              <h3 className="text-lg font-bold uppercase tracking-wider">Asistente de Publicación en Redes (Nora AI)</h3>
            </div>

            {/* Preview de la foto */}
            {shareModalData.imageUrl && (
              <div className="relative h-44 rounded-xl overflow-hidden border border-white/10">
                <img src={shareModalData.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <p className="text-white text-xs font-bold line-clamp-1">{shareModalData.title}</p>
                </div>
              </div>
            )}

            {/* Texto copy de Nora AI */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Copy para Instagram / Facebook / X:
                </label>
                {shareModalData.loading && (
                  <span className="text-[10px] text-pink-400 animate-pulse font-bold">🧠 Nora redactando copy...</span>
                )}
              </div>
              <textarea
                readOnly
                value={shareModalData.copy}
                rows={5}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-gray-200 focus:outline-none"
              />
            </div>

            {/* Botones de Acción Rápida */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleCopyCopy}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${
                  copiedText
                    ? "bg-emerald-600 text-white"
                    : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg"
                }`}
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4" /> ¡Texto Copiado al Portapapeles!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar Texto de Nora & Hashtags
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-pink-500/50 hover:bg-pink-600/50 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-pink-400" /> Abrir Instagram
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareModalData.copy)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/50 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
