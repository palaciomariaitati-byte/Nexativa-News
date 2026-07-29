"use client";

import { useState } from "react";
import { Play, Sparkles, Copy, Check, Video, Clock, Share2, Film, Loader2, ArrowRight, Zap, Radio } from "lucide-react";
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

type SuggestedFlash = {
  title: string;
  summary: string;
  target_duration_seconds: number;
  clip_ids: number[];
};

type ClipperResponse = {
  video_summary: string;
  total_clips_found: number;
  suggested_news_flash?: SuggestedFlash;
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

  // Flash de Noticias assembly state
  const [selectedFlashClipIds, setSelectedFlashClipIds] = useState<number[]>([]);
  const [flashTitle, setFlashTitle] = useState("");
  const [isPublishingFlash, setIsPublishingFlash] = useState(false);
  const [flashSuccessMsg, setFlashSuccessMsg] = useState<string | null>(null);

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
    setSelectedFlashClipIds([]);
    setFlashSuccessMsg(null);

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
          // Default select top 2-3 clips for Flash
          const defaultFlashIds = json.data.suggested_news_flash?.clip_ids || json.data.clips.slice(0, 3).map((c: ClipItem) => c.clip_id);
          setSelectedFlashClipIds(defaultFlashIds);
          setFlashTitle(json.data.suggested_news_flash?.title || `🔴 FLASH DE NOTICIAS: ${videoTitle || "Resumen Periodístico"}`);
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

  const handleToggleFlashClip = (clipId: number) => {
    if (selectedFlashClipIds.includes(clipId)) {
      setSelectedFlashClipIds(selectedFlashClipIds.filter(id => id !== clipId));
    } else {
      setSelectedFlashClipIds([...selectedFlashClipIds, clipId]);
    }
  };

  const selectedClipsList = (resultData?.clips || []).filter(c => selectedFlashClipIds.includes(c.clip_id));
  const cumulativeDurationSeconds = selectedClipsList.reduce((acc, c) => acc + c.duration_seconds, 0);

  const handlePublishNewsFlash = async () => {
    if (selectedClipsList.length === 0) {
      alert("Por favor selecciona al menos 1 recorte para ensamblar el Flash de Noticias.");
      return;
    }

    setIsPublishingFlash(true);
    setFlashSuccessMsg(null);

    try {
      const ytId = getYouTubeId(youtubeUrl);
      const firstClip = selectedClipsList[0];
      const lastClip = selectedClipsList[selectedClipsList.length - 1];
      const startSec = firstClip.start_time_seconds;
      const endSec = lastClip.end_time_seconds;

      const embedUrl = ytId
        ? `https://www.youtube.com/embed/${ytId}?start=${startSec}&end=${endSec}&autoplay=1`
        : youtubeUrl;
      const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

      const combinedSummary = selectedClipsList.map(c => `• ${c.title}: ${c.summary}`).join("\n");

      const res = await fetch("/api/flashes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: flashTitle.trim() || "🔴 Flash de Noticias Nexativa",
          summary: combinedSummary,
          duration_seconds: cumulativeDurationSeconds,
          video_url: youtubeUrl,
          thumbnail_url: thumbnailUrl,
          embed_url: embedUrl,
          segments: selectedClipsList,
          category: firstClip.category || "nacional",
          partner_visible: true,
          status: "published"
        })
      });

      const json = await res.json();
      if (json.success) {
        setFlashSuccessMsg("🎉 ¡Flash de Noticias (1-5 min) publicado con éxito! Ya está disponible en el panel principal y para portales de socios.");
      } else {
        alert("Error al publicar Flash: " + json.error);
      }
    } catch (e: any) {
      alert("Error al conectar con la API de Flashes: " + e.message);
    } finally {
      setIsPublishingFlash(false);
    }
  };

  const handlePublishClipAsArticle = async (clip: ClipItem) => {
    setPublishingId(clip.clip_id);
    try {
      const ytId = getYouTubeId(youtubeUrl);
      const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}?start=${clip.start_time_seconds}&end=${clip.end_time_seconds}&autoplay=1` : youtubeUrl;
      const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

      let cat = (clip.category || "nacional").toLowerCase();
      if (cat.includes("local") || cat.includes("corrientes") || cat.includes("provinc")) cat = "local";
      else if (cat.includes("inter") || cat.includes("mund")) cat = "internacional";
      else cat = "nacional";

      const { error } = await supabase.from("articles").insert({
        title: clip.title,
        excerpt: clip.summary,
        content: `<p><strong>${clip.title}</strong></p><p>${clip.summary}</p><br><iframe width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen></iframe><br><p><em>Clip destacado de la cobertura periodística en vivo (Nora Auto-Clipper).</em></p>`,
        status: "published",
        category: cat,
        image_url: thumbnailUrl,
        video_url: embedUrl
      });

      if (error) {
        alert("Error al publicar la noticia: " + error.message);
      } else {
        setPublishedId(clip.clip_id);
        alert("🎉 ¡Clip publicado exitosamente en la portada de Nexativa News! (Categoría: " + cat.toUpperCase() + ")");
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
            <Sparkles className="w-3.5 h-3.5" /> Nora Auto-Clipper & Producer IA Pro
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Extractor de Clips & Noticiero Flash (1 a 5 min)
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-3xl">
            Pega el enlace de cualquier transmisión o video de YouTube. Nora analizará el contenido, identificará los recortes de mayor impacto periodístico y te permitirá **ensamblar un Flash de Noticias (1-5 min)** listo para emitir en el panel principal y portales socios.
          </p>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" /> Link del Video de YouTube / Cobertura
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
              Título / Referencia del Evento
            </label>
            <input 
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Ej: Conferencia de Prensa / Acto"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !youtubeUrl.trim()}
          className="w-full md:w-auto bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Analizando Video & Momentos Clave con Nora...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Decodificar Clips & Producir Flash Noticioso
            </>
          )}
        </button>
      </div>

      {/* Results View */}
      {resultData && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Bar Summary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Resumen Ejecutivo del Evento</span>
              <p className="text-white text-base mt-1 font-medium">{resultData.video_summary}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-center flex-shrink-0">
              <span className="text-2xl font-black text-red-500">{resultData.total_clips_found}</span>
              <span className="block text-[10px] text-gray-400 uppercase font-bold">Clips Destacados</span>
            </div>
          </div>

          {/* FLASH NOTICIOSO ASSEMBLY SECTION */}
          <div className="bg-gradient-to-br from-red-950/60 via-black to-slate-900 border-2 border-red-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-500 uppercase tracking-widest">
                  <Radio className="w-4 h-4 animate-pulse" /> Ensamblador de Flash de Noticias (1 a 5 min)
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">Noticiero Rápido para Portada & Socios</h2>
              </div>
              <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-gray-400">Duración Acumulada:</span>
                <span className="text-lg font-black text-amber-400">
                  {Math.floor(cumulativeDurationSeconds / 60)}m {cumulativeDurationSeconds % 60}s
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                  Título del Flash Noticioso
                </label>
                <input 
                  type="text"
                  value={flashTitle}
                  onChange={(e) => setFlashTitle(e.target.value)}
                  placeholder="Título del Flash..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold"
                />
              </div>

              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Selecciona los recortes a incluir en este Flash:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {resultData.clips.map((clip) => {
                  const isSelected = selectedFlashClipIds.includes(clip.clip_id);
                  return (
                    <div
                      key={`flash-select-${clip.clip_id}`}
                      onClick={() => handleToggleFlashClip(clip.clip_id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected 
                          ? "bg-red-900/30 border-red-500 text-white shadow-lg" 
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-400">#{clip.clip_id}</span>
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white font-mono">{clip.start_timestamp} - {clip.end_timestamp}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{clip.title}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2">{clip.summary}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} 
                        className="mt-1 w-5 h-5 accent-red-600 rounded cursor-pointer flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>

              {flashSuccessMsg && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-medium">
                  {flashSuccessMsg}
                </div>
              )}

              <button
                onClick={handlePublishNewsFlash}
                disabled={isPublishingFlash || selectedClipsList.length === 0}
                className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
              >
                {isPublishingFlash ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publicando Flash de Noticias...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" /> 🚀 Publicar Flash Noticioso ({selectedClipsList.length} clips • {Math.floor(cumulativeDurationSeconds / 60)}m {cumulativeDurationSeconds % 60}s)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MAIN PLAYER & INDIVIDUAL CLIPS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player Column */}
            <div className="lg:col-span-2 space-y-4">
              {activeClip && ytId ? (
                <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?start=${activeClip.start_time_seconds}&end=${activeClip.end_time_seconds}&autoplay=1`}
                      title={activeClip.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-6 space-y-3 bg-slate-950">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase border border-amber-400/20">
                        Clip #{activeClip.clip_id} • Impacto {activeClip.impact_score}/10
                      </span>
                      <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-red-500" /> {activeClip.start_timestamp} - {activeClip.end_timestamp} ({activeClip.duration_seconds}s)
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold text-white">{activeClip.title}</h2>
                    <p className="text-gray-300 text-sm">{activeClip.summary}</p>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">Texto para Redes / Copywriting</span>
                        <button
                          onClick={() => handleCopyCaption(activeClip)}
                          className="text-xs font-bold text-red-400 hover:text-white flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg transition-all"
                        >
                          {copiedId === activeClip.clip_id ? (
                            <> <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado </>
                          ) : (
                            <> <Copy className="w-3.5 h-3.5" /> Copiar Copy </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{activeClip.social_caption}</p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handlePublishClipAsArticle(activeClip)}
                        disabled={publishingId === activeClip.clip_id}
                        className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                      >
                        {publishingId === activeClip.clip_id ? (
                          <> <Loader2 className="w-4 h-4 animate-spin" /> Publicando en Noticias... </>
                        ) : publishedId === activeClip.clip_id ? (
                          <> <Check className="w-4 h-4 text-emerald-400" /> ¡Publicado en Portada! </>
                        ) : (
                          <> <ArrowRight className="w-4 h-4" /> Publicar como Artículo Individual en Noticias </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-2xl p-12 text-center text-gray-400">
                  Selecciona un clip de la lista para ver la previsualización.
                </div>
              )}
            </div>

            {/* Clips List Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-red-500" /> Momentos Clave Identificados ({resultData.clips.length})
              </h3>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {resultData.clips.map((clip) => (
                  <div
                    key={clip.clip_id}
                    onClick={() => setActiveClip(clip)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      activeClip?.clip_id === clip.clip_id
                        ? "bg-red-950/40 border-red-500/80 shadow-lg"
                        : "bg-black/30 border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">{clip.start_timestamp} - {clip.end_timestamp}</span>
                      <span className="text-amber-400 font-bold">Puntaje: {clip.impact_score}/10</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1 line-clamp-2">{clip.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{clip.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
