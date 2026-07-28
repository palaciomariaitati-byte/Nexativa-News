"use client";

import { useState } from "react";
import { Play, Sparkles, Copy, Check, Video, Clock, Share2, Film, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ClipItem = {
  clip_id: number;
  title: string;
  start_time_seconds: number;
  end_time_seconds: number;
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
  summary: string;
  impact_score: number;
  category: string;
  social_caption: string;
};

type ClipperResponse = {
  video_summary: string;
  total_clips_found: number;
  clips: ClipItem[];
};

export default function NoraClipperAdminPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultData, setResultData] = useState<ClipperResponse | null>(null);
  const [activeClip, setActiveClip] = useState<ClipItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [publishedId, setPublishedId] = useState<number | null>(null);

  // Extract YouTube ID for iframe embedding
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) return;
    setIsAnalyzing(true);
    setResultData(null);
    setActiveClip(null);

    try {
      const res = await fetch("/api/nora-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl,
          videoTitle: videoTitle || "Video de Cobertura Periodística"
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResultData(json.data);
        if (json.data.clips && json.data.clips.length > 0) {
          setActiveClip(json.data.clips[0]);
        }
      } else {
        alert("Error analizando el video: " + (json.error || "Revisa el enlace enviado."));
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyCaption = (clip: ClipItem) => {
    navigator.clipboard.writeText(clip.social_caption);
    setCopiedId(clip.clip_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublishClipAsArticle = async (clip: ClipItem) => {
    setPublishingId(clip.clip_id);
    try {
      const ytId = getYouTubeId(youtubeUrl);
      const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}?start=${clip.start_time_seconds}&autoplay=1` : youtubeUrl;

      const { error } = await supabase.from("articles").insert({
        title: clip.title,
        excerpt: clip.summary,
        content: `<p><strong>${clip.title}</strong></p><p>${clip.summary}</p><br><iframe width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen></iframe><br><p><em>Clip destacado de la cobertura periodística en vivo (Nora Auto-Clipper).</em></p>`,
        status: "published",
        category: clip.category || "nacionales",
        video_url: embedUrl
      });

      if (error) {
        alert("Error al publicar la noticia: " + error.message);
      } else {
        setPublishedId(clip.clip_id);
      }
    } catch (e: any) {
      alert("Error de publicación: " + e.message);
    } finally {
      setPublishingId(null);
    }
  };

  const ytId = getYouTubeId(youtubeUrl);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-black to-slate-900 border border-red-500/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -z-0" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Nora Auto-Clipper IA Pro
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Extractor de Clips e Momentos Clave
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-3xl">
            Pega el enlace de cualquier transmisión o video de YouTube de tu evento. Nora analizará el contenido e identificará automáticamente los fragmentos de mayor impacto periodístico con marcas de tiempo exactas para publicar en redes y tu portada.
          </p>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" /> Link del Video de YouTube / Evento
            </label>
            <input 
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Título / Contexto (Opcional)
            </label>
            <input 
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Ej: Conferencia de Prensa..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!youtubeUrl.trim() || isAnalyzing}
          className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 uppercase tracking-wider text-sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Nora está analizando el video y extrayendo los mejores clips...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analizar y Extraer Clips con Nora IA
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {resultData && (
        <div className="space-y-8 animate-fadeIn">
          {/* Summary Box */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl text-amber-200 text-sm space-y-1">
            <strong className="text-amber-400 uppercase tracking-wider text-xs block">Resumen Periodístico del Evento:</strong>
            <p>{resultData.video_summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Player Column (Left 5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl sticky top-8">
                <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <Video className="w-4 h-4" /> Reproductor de Clip Seleccionado
                  </span>
                  {activeClip && (
                    <span className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                      {activeClip.start_timestamp} - {activeClip.end_timestamp}
                    </span>
                  )}
                </div>

                <div className="aspect-video bg-black flex items-center justify-center relative">
                  {ytId ? (
                    <iframe
                      key={activeClip ? activeClip.start_time_seconds : "default"}
                      src={`https://www.youtube.com/embed/${ytId}?start=${activeClip ? activeClip.start_time_seconds : 0}&autoplay=1`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-gray-500 text-xs text-center p-4">
                      Ingresa una URL válida de YouTube para previsualizar el reproductor.
                    </div>
                  )}
                </div>

                {activeClip && (
                  <div className="p-4 space-y-2 bg-white/5">
                    <h3 className="font-bold text-base text-white">{activeClip.title}</h3>
                    <p className="text-xs text-gray-400">{activeClip.summary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Clips List Column (Right 7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-red-500" />
                Clips Destacados Identificados ({resultData.total_clips_found})
              </h2>

              <div className="space-y-4">
                {resultData.clips.map((clip) => {
                  const isActive = activeClip?.clip_id === clip.clip_id;
                  const isCopied = copiedId === clip.clip_id;
                  const isPublishing = publishingId === clip.clip_id;
                  const isPublished = publishedId === clip.clip_id;

                  return (
                    <div 
                      key={clip.clip_id}
                      className={`p-5 rounded-2xl border transition-all space-y-4 ${
                        isActive 
                          ? "bg-red-950/30 border-red-500/50 shadow-xl" 
                          : "bg-black/40 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="space-y-1 flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded">
                              Clip #{clip.clip_id}
                            </span>
                            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              🔥 Impacto: {clip.impact_score}/10
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-white">{clip.title}</h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                          <Clock className="w-3.5 h-3.5 text-red-400" />
                          <span>{clip.start_timestamp} - {clip.end_timestamp}</span>
                          <span className="text-white/40">({clip.duration_seconds}s)</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-300">{clip.summary}</p>

                      {/* Social Caption Box */}
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-gray-400 font-mono space-y-1">
                        <span className="text-red-400 font-bold block uppercase tracking-wider text-[10px]">Texto para redes:</span>
                        <p>{clip.social_caption}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => setActiveClip(clip)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            isActive ? "bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-gray-200"
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Reproducir Clip
                        </button>

                        <button
                          onClick={() => handleCopyCaption(clip)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopied ? "¡Copiado!" : "Copiar Texto para Redes"}
                        </button>

                        <button
                          onClick={() => handlePublishClipAsArticle(clip)}
                          disabled={isPublishing || isPublished}
                          className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {isPublishing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPublished ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> ¡Publicado en Portada!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" /> Publicar Noticia con este Clip
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
