"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Play, Sparkles, Copy, Check, Video, Clock, Share2, Film, Loader2, ArrowRight,
  Zap, Radio, Download, Inbox, ShieldCheck, Layers, Plus, Trash2, Search,
  ExternalLink, Tv, Newspaper, Bookmark, CheckCircle2, ChevronRight, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import CleanFlashPlayer from "@/components/CleanFlashPlayer";
import Link from "next/link";

export type StoredClip = {
  id?: string;
  clip_id?: number;
  flash_id?: string;
  flash_title?: string;
  video_url: string;
  source_title?: string;
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
  thumbnail_url?: string | null;
  created_at?: string;
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
  clips: StoredClip[];
};

type PartnerVideo = {
  id: string;
  partner_name: string;
  title: string;
  video_url: string;
  notes: string;
  status: string;
  created_at: string;
};

type QueueVideo = {
  id: string;
  title: string;
  video_url: string;
  status: string;
};

export default function NoraClipperAdminPage() {
  const [activeTab, setActiveTab] = useState<"clipper" | "library">("library");

  // Clipper Generator State
  const [youtubeUrlsText, setYoutubeUrlsText] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultData, setResultData] = useState<ClipperResponse | null>(null);
  const [activeClip, setActiveClip] = useState<StoredClip | null>(null);

  // Stored Clips Library State
  const [savedClips, setSavedClips] = useState<StoredClip[]>([]);
  const [isLoadingSavedClips, setIsLoadingSavedClips] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [activeLibraryClip, setActiveLibraryClip] = useState<StoredClip | null>(null);

  // Feedback notifications
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | number | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | number | null>(null);

  // Partner Videos Inbox State
  const [partnerVideos, setPartnerVideos] = useState<PartnerVideo[]>([]);
  const [isLoadingPartnerVideos, setIsLoadingPartnerVideos] = useState(false);

  // Streaming Queue Videos
  const [queueVideos, setQueueVideos] = useState<QueueVideo[]>([]);

  // Flash Assembly State
  const [selectedFlashClipIds, setSelectedFlashClipIds] = useState<number[]>([]);
  const [flashTitle, setFlashTitle] = useState("");
  const [isPublishingFlash, setIsPublishingFlash] = useState(false);
  const [flashSuccessMsg, setFlashSuccessMsg] = useState<string | null>(null);

  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 1. Fetch Stored Clips from Nexativa Database
  const fetchSavedClips = async () => {
    setIsLoadingSavedClips(true);
    try {
      const res = await fetch("/api/clips?limit=50");
      const json = await res.json();
      if (json.success && Array.isArray(json.clips)) {
        setSavedClips(json.clips);
        if (json.clips.length > 0 && !activeLibraryClip) {
          setActiveLibraryClip(json.clips[0]);
        }
      }
    } catch (e) {
      console.error("Error cargando biblioteca de clips:", e);
    } finally {
      setIsLoadingSavedClips(false);
    }
  };

  // 2. Fetch Partner Videos
  const fetchPartnerVideos = async () => {
    setIsLoadingPartnerVideos(true);
    try {
      const res = await fetch("/api/partner-videos?limit=10");
      const json = await res.json();
      if (json.success && json.videos) {
        setPartnerVideos(json.videos);
      }
    } catch (e) {
      console.error("Error cargando videos de socios:", e);
    } finally {
      setIsLoadingPartnerVideos(false);
    }
  };

  // 3. Fetch Stream Queue Videos
  const fetchQueueVideos = async () => {
    try {
      const { data } = await supabase.from("video_queue").select("id, title, video_url, status").limit(5);
      if (data) setQueueVideos(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchSavedClips();
    fetchPartnerVideos();
    fetchQueueVideos();
  }, []);

  // Analyze & Auto-Save
  const handleAnalyze = async () => {
    const urlsList = youtubeUrlsText
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(Boolean);

    if (urlsList.length === 0) {
      alert("Por favor ingresa al menos 1 enlace de video de YouTube o transmisión.");
      return;
    }

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
          urls: urlsList,
          videoTitle: videoTitle || "Coberturas y Noticieros del Día"
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResultData(json.data);
        if (json.data.clips && json.data.clips.length > 0) {
          setActiveClip(json.data.clips[0]);
          const defaultFlashIds = json.data.suggested_news_flash?.clip_ids || json.data.clips.slice(0, 5).map((c: StoredClip) => c.clip_id);
          setSelectedFlashClipIds(defaultFlashIds);
          setFlashTitle(json.data.suggested_news_flash?.title || `🔴 FLASH MULTI-NOTICIAS: ${videoTitle || "Resumen del Día"}`);
        }
        // Auto-refresh the stored clips library to show the newly persisted clips!
        await fetchSavedClips();
        setActionSuccessMsg("🎉 ¡Clips segmentados y guardados automáticamente en la plataforma Nexativa!");
        setTimeout(() => setActionSuccessMsg(null), 5000);
      } else {
        alert("Error analizando los videos: " + (json.error || "Revisa los enlaces enviados."));
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProcessPartnerVideo = (pv: PartnerVideo) => {
    setYoutubeUrlsText(pv.video_url);
    setVideoTitle(`${pv.partner_name}: ${pv.title}`);
    setActiveTab("clipper");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleProcessQueueVideo = (qv: QueueVideo) => {
    setYoutubeUrlsText(qv.video_url);
    setVideoTitle(`Transmisión Nexativa: ${qv.title}`);
    setActiveTab("clipper");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleToggleFlashClip = (clipId: number) => {
    if (selectedFlashClipIds.includes(clipId)) {
      setSelectedFlashClipIds(selectedFlashClipIds.filter(id => id !== clipId));
    } else {
      setSelectedFlashClipIds([...selectedFlashClipIds, clipId]);
    }
  };

  const selectedClipsList = (resultData?.clips || []).filter(c => selectedFlashClipIds.includes(c.clip_id ?? -1));
  const cumulativeDurationSeconds = selectedClipsList.reduce((acc, c) => acc + c.duration_seconds, 0);

  // Publish News Flash
  const handlePublishNewsFlash = async () => {
    if (selectedClipsList.length === 0) {
      alert("Por favor selecciona al menos 1 recorte para ensamblar el Flash de Noticias.");
      return;
    }

    setIsPublishingFlash(true);
    setFlashSuccessMsg(null);

    try {
      const firstClip = selectedClipsList[0];
      const primaryUrl = firstClip.video_url || youtubeUrlsText.split("\n")[0];
      const ytId = getYouTubeId(primaryUrl);
      const embedUrl = ytId
        ? `https://www.youtube.com/embed/${ytId}?start=${firstClip.start_time_seconds}&end=${firstClip.end_time_seconds}&autoplay=1`
        : primaryUrl;
      const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

      const combinedSummary = selectedClipsList.map(c => `• [${c.source_title || "Programa"}] ${c.title}: ${c.summary}`).join("\n");

      const res = await fetch("/api/flashes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: flashTitle.trim() || "🔴 Flash de Noticias Multi-Programa Nexativa",
          summary: combinedSummary,
          duration_seconds: cumulativeDurationSeconds,
          video_url: primaryUrl,
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
        setFlashSuccessMsg("🎉 ¡Flash Noticioso Multi-Programa publicado y emitido con éxito en Nexativa Clean Player!");
        fetchSavedClips();
      } else {
        alert("Error al publicar Flash: " + json.error);
      }
    } catch (e: any) {
      alert("Error al conectar con la API de Flashes: " + e.message);
    } finally {
      setIsPublishingFlash(false);
    }
  };

  // Helper Actions for Stored Clips
  const handleCopyCaption = (clip: StoredClip) => {
    const text = clip.social_caption || `🔴 ${clip.title}\n\n${clip.summary}\n\n#NexativaNews #Cadena4 #Noticias`;
    navigator.clipboard.writeText(text);
    setCopiedCaptionId(clip.id || clip.clip_id || 1);
    setTimeout(() => setCopiedCaptionId(null), 2500);
  };

  const handleCopyTimestampLink = (clip: StoredClip) => {
    let url = clip.video_url;
    const start = clip.start_time_seconds || 0;
    if (url.includes("youtu.be/")) {
      url = `${url}?t=${start}s`;
    } else if (url.includes("youtube.com/watch")) {
      url = `${url}&t=${start}s`;
    }
    navigator.clipboard.writeText(url);
    setCopiedLinkId(clip.id || clip.clip_id || 1);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const handleSendToVideoQueue = async (clip: StoredClip) => {
    try {
      const { data: currentQueue } = await supabase.from("video_queue").select("position");
      const nextPos = (currentQueue && currentQueue.length > 0)
        ? Math.max(...currentQueue.map((v: any) => v.position || 0)) + 1
        : 1;

      const ytId = getYouTubeId(clip.video_url);
      const queueUrl = ytId 
        ? `https://www.youtube.com/watch?v=${ytId}&t=${clip.start_time_seconds || 0}s` 
        : clip.video_url;

      const { error } = await supabase.from("video_queue").insert([{
        title: `[Clip] ${clip.title}`,
        video_url: queueUrl,
        type: "youtube",
        status: "queued",
        position: nextPos
      }]);

      if (error) {
        alert("Error enviando a Video Queue: " + error.message);
      } else {
        setActionSuccessMsg(`📺 ¡Clip "${clip.title}" enviado a la cola de emisión en vivo de Nexativa TV!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        fetchQueueVideos();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDeleteClip = async (clip: StoredClip) => {
    if (!confirm(`¿Eliminar el recorte "${clip.title}" de la plataforma?`)) return;
    try {
      const res = await fetch(`/api/clips?id=${clip.id || clip.flash_id || ""}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSavedClips(prev => prev.filter(c => c.id !== clip.id));
        if (activeLibraryClip?.id === clip.id) {
          setActiveLibraryClip(savedClips.find(c => c.id !== clip.id) || null);
        }
      } else {
        alert("Error al eliminar: " + json.error);
      }
    } catch (e: any) {
      alert("Error al conectar: " + e.message);
    }
  };

  // Filtered stored clips
  const filteredClips = useMemo(() => {
    return savedClips.filter(c => {
      const matchesSearch = !searchFilter.trim() || 
        c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.summary?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.source_title?.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCategory = categoryFilter === "todos" || c.category?.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [savedClips, searchFilter, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-black to-slate-900 border border-red-500/30 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" /> Nora Auto-Clipper Pro & Multi-Programa Flash Producer
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Segmentador Audiovisual & Biblioteca de Clips
          </h1>
          <p className="text-gray-400 text-sm max-w-3xl">
            Segmenta automáticamente transmisiones de YouTube o videos de tu portal de noticias con Nora IA. Todos los recortes se almacenan de forma permanente en la plataforma de Nexativa para su reutilización y emisión.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-[10px] text-gray-400 bg-black/60 border border-white/10 px-3 py-2 rounded-xl text-right font-mono">
            Desarrollado por <strong className="text-white">Nexora One</strong>
            <span className="block text-red-400 font-bold font-sans uppercase">Nexativa News ©</span>
          </div>
          <Link
            href="/admin/news/flashes"
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg transition-colors"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Ver Flashes Emitidos
          </Link>
        </div>
      </div>

      {/* Global Notifications */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 rounded-xl text-sm font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("library")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === "library"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Bookmark className="w-4 h-4" /> 📁 Clips Almacenados en Nexativa
            <span className="ml-1 bg-black/40 text-amber-400 px-2 py-0.5 rounded-full text-xs font-mono">
              {savedClips.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("clipper")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === "clipper"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" /> ✂️ Segmentar Nuevos Videos (YouTube / Portal)
          </button>
        </div>

        <button
          onClick={fetchSavedClips}
          disabled={isLoadingSavedClips}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSavedClips ? "animate-spin" : ""}`} /> Sincronizar Plataforma
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BIBLIOTECA DE CLIPS ALMACENADOS EN LA PLATAFORMA                   */}
      {/* ========================================================================= */}
      {activeTab === "library" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter Bar */}
          <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar clip por titular, síntesis o programa..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {["todos", "nacional", "local", "sociedad", "política", "internacional"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stored Clips View */}
          {isLoadingSavedClips ? (
            <div className="p-16 text-center text-gray-400 bg-black/40 border border-white/10 rounded-2xl space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
              <p className="text-sm font-medium">Cargando biblioteca de clips guardados en Nexativa...</p>
            </div>
          ) : filteredClips.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Player View */}
              <div className="lg:col-span-2 space-y-4">
                {activeLibraryClip ? (
                  <div className="space-y-4">
                    <CleanFlashPlayer
                      videoUrl={activeLibraryClip.video_url}
                      segments={[activeLibraryClip]}
                      totalDurationSeconds={activeLibraryClip.duration_seconds}
                      title={activeLibraryClip.title}
                      partnerName={activeLibraryClip.source_title || "Nexativa Studio"}
                    />

                    {/* Clip Metadata and Actions */}
                    <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-600 text-white font-extrabold text-[10px] uppercase px-2.5 py-1 rounded">
                            {activeLibraryClip.category || "NACIONAL"}
                          </span>
                          <span className="text-purple-300 bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                            {activeLibraryClip.source_title || "Programa"}
                          </span>
                          <span className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {activeLibraryClip.start_timestamp} - {activeLibraryClip.end_timestamp} ({activeLibraryClip.duration_seconds}s)
                          </span>
                        </div>
                        <span className="text-xs text-red-400 font-bold">
                          Impacto Periodístico: {activeLibraryClip.impact_score}/10
                        </span>
                      </div>

                      <div>
                        <h2 className="text-xl font-black text-white leading-snug">{activeLibraryClip.title}</h2>
                        <p className="text-gray-300 text-sm mt-2 leading-relaxed">{activeLibraryClip.summary}</p>
                      </div>

                      {/* Social Caption Box */}
                      {activeLibraryClip.social_caption && (
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                            📱 Copia sugerida para Redes Sociales (Instagram / TikTok / Facebook / X):
                          </span>
                          <p className="text-xs text-gray-300 whitespace-pre-line font-mono">
                            {activeLibraryClip.social_caption}
                          </p>
                        </div>
                      )}

                      {/* Instant Actions for Platform Use */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => handleCopyCaption(activeLibraryClip)}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                        >
                          {copiedCaptionId === (activeLibraryClip.id || activeLibraryClip.clip_id) ? (
                            <> <Check className="w-3.5 h-3.5 text-emerald-400" /> ¡Texto Copiado! </>
                          ) : (
                            <> <Copy className="w-3.5 h-3.5 text-amber-400" /> Copiar Copia Redes </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopyTimestampLink(activeLibraryClip)}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                        >
                          {copiedLinkId === (activeLibraryClip.id || activeLibraryClip.clip_id) ? (
                            <> <Check className="w-3.5 h-3.5 text-emerald-400" /> ¡Enlace Copiado! </>
                          ) : (
                            <> <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Copiar Link con Timestamp </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSendToVideoQueue(activeLibraryClip)}
                          className="bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Tv className="w-3.5 h-3.5 text-purple-400" /> Emitir en Nexativa TV
                        </button>

                        <Link
                          href={`/admin/news/editor?clip_title=${encodeURIComponent(activeLibraryClip.title)}&video_url=${encodeURIComponent(activeLibraryClip.video_url)}&summary=${encodeURIComponent(activeLibraryClip.summary || "")}&category=${encodeURIComponent(activeLibraryClip.category || "nacional")}`}
                          className="bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Newspaper className="w-3.5 h-3.5 text-emerald-400" /> Crear Noticia con este Clip
                        </Link>

                        <button
                          onClick={() => handleDeleteClip(activeLibraryClip)}
                          className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 ml-auto transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-12 text-center text-gray-400">
                    Selecciona un recorte de la lista para previsualizarlo y reproducirlo.
                  </div>
                )}
              </div>

              {/* Clips List Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-500" /> Recortes Disponibles ({filteredClips.length})
                  </h3>
                  <span className="text-[10px] text-amber-400 font-mono">Almacenados en Base de Datos</span>
                </div>

                <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                  {filteredClips.map((clip, idx) => {
                    const isSelected = activeLibraryClip?.id === clip.id || (!activeLibraryClip?.id && activeLibraryClip?.title === clip.title);
                    return (
                      <div
                        key={clip.id || `clip-lib-${idx}`}
                        onClick={() => setActiveLibraryClip(clip)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          isSelected
                            ? "bg-red-950/50 border-red-500 shadow-xl"
                            : "bg-black/40 border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-mono text-amber-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {clip.start_timestamp} - {clip.end_timestamp}
                          </span>
                          <span className="text-red-400 font-bold text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            {clip.impact_score}/10
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white line-clamp-2">{clip.title}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2">{clip.summary}</p>

                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <span className="text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded">
                            {clip.source_title || "Programa"}
                          </span>
                          <span className="text-gray-500">
                            {clip.created_at ? new Date(clip.created_at).toLocaleDateString([], { month: "short", day: "2-digit" }) : "Hoy"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-gray-400 bg-black/40 border border-white/10 rounded-2xl space-y-4">
              <Film className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">Aún no hay clips en la biblioteca</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Utiliza la pestaña <strong>"Segmentar Nuevos Videos"</strong> para procesar transmisiones de YouTube o videos de tu portal de noticias con Nora IA.
              </p>
              <button
                onClick={() => setActiveTab("clipper")}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase transition-all inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Segmentar Mi Primer Video
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SEGMENTAR / RECORTAR NUEVOS VIDEOS CON NORA IA                     */}
      {/* ========================================================================= */}
      {activeTab === "clipper" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Quick Source Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PARTNER VIDEOS INBOX */}
            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-extrabold text-white">📥 Coberturas de Socios (Cadena 4)</h3>
                </div>
                <button onClick={fetchPartnerVideos} className="text-[10px] text-amber-400 hover:underline">
                  Refrescar
                </button>
              </div>

              {partnerVideos.length > 0 ? (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {partnerVideos.map((pv) => (
                    <div key={pv.id} className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="truncate flex-1">
                        <span className="font-bold text-amber-400 block">{pv.partner_name}</span>
                        <span className="text-white truncate block">{pv.title}</span>
                      </div>
                      <button
                        onClick={() => handleProcessPartnerVideo(pv)}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-2.5 py-1 rounded-lg text-[10px] shrink-0"
                      >
                        ⚡ Cargar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No hay videos de socios pendientes.</p>
              )}
            </div>

            {/* STREAMING QUEUE INBOX */}
            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-extrabold text-white">📺 Transmisiones en Cola (Nexativa TV)</h3>
                </div>
                <button onClick={fetchQueueVideos} className="text-[10px] text-purple-400 hover:underline">
                  Refrescar
                </button>
              </div>

              {queueVideos.length > 0 ? (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {queueVideos.map((qv) => (
                    <div key={qv.id} className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <span className="text-white truncate flex-1">{qv.title}</span>
                      <button
                        onClick={() => handleProcessQueueVideo(qv)}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold px-2.5 py-1 rounded-lg text-[10px] shrink-0"
                      >
                        ⚡ Cargar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No hay videos en la cola de streaming.</p>
              )}
            </div>
          </div>

          {/* Input Box for Multi-Videos (Up to 5 URLs) */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500" /> Links de Videos / Programas (YouTube o Portal)
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">1 enlace por línea (hasta 5)</span>
                </label>
                <textarea 
                  value={youtubeUrlsText}
                  onChange={(e) => setYoutubeUrlsText(e.target.value)}
                  placeholder="Pega las URLs de tus videos o programas:&#10;https://www.youtube.com/watch?v=... (Noticiero Mañana)&#10;https://www.youtube.com/watch?v=... (Noticiero Noche)"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 font-mono resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Título / Referencia del Lote
                </label>
                <input 
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ej: Emisiones del Día / Noticieros Cadena 4"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-2">
                  Nora IA analizará el contenido audiovisual, detectará momentos clave, generará marcas de tiempo exactas y almacenará los recortes de inmediato en Nexativa.
                </p>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !youtubeUrlsText.trim()}
              className="w-full md:w-auto bg-gradient-to-r from-red-600 via-amber-600 to-red-800 hover:from-red-500 hover:to-amber-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Analizando y Almacenando Clips con Nora IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Decodificar Programas & Guardar Clips en Nexativa
                </>
              )}
            </button>
          </div>

          {/* Results View */}
          {resultData && (
            <div className="space-y-8 animate-fadeIn">
              {/* Top Bar Summary */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ¡Proceso Completado y Almacenado con Éxito!
                  </span>
                  <p className="text-white text-base mt-1 font-medium">{resultData.video_summary}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-center flex-shrink-0">
                    <span className="text-2xl font-black text-red-500">{resultData.total_clips_found}</span>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold">Clips Almacenados</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("library")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    <Bookmark className="w-4 h-4" /> Ver en Biblioteca
                  </button>
                </div>
              </div>

              {/* FLASH NOTICIOSO ASSEMBLY SECTION */}
              <div className="bg-gradient-to-br from-red-950/60 via-black to-slate-900 border-2 border-red-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-500 uppercase tracking-widest">
                      <Radio className="w-4 h-4 animate-pulse" /> Ensamblador Multi-Programa de Flash Noticioso (1 a 5 min)
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1">Mezclador de Recortes del Día</h2>
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
                      Título del Flash Noticioso Combinado
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
                    Selecciona los recortes de los distintos programas para unir en el Flash:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resultData.clips.map((clip) => {
                      const isSelected = selectedFlashClipIds.includes(clip.clip_id ?? -1);
                      return (
                        <div
                          key={`flash-select-${clip.clip_id}`}
                          onClick={() => handleToggleFlashClip(clip.clip_id ?? 0)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            isSelected 
                              ? "bg-red-900/30 border-red-500 text-white shadow-lg" 
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold uppercase">
                                {clip.source_title || "Programa"}
                              </span>
                              <span className="text-xs font-mono text-amber-400">{clip.start_timestamp} - {clip.end_timestamp}</span>
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
                    className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-red-700 hover:from-red-500 hover:to-amber-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                  >
                    {isPublishingFlash ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Publicando Flash Noticioso Multi-Programa...
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" /> 🚀 Publicar Flash Noticioso Combinado ({selectedClipsList.length} clips • {Math.floor(cumulativeDurationSeconds / 60)}m {cumulativeDurationSeconds % 60}s)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* MAIN CLEAN PLAYER & INDIVIDUAL CLIPS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Player Column */}
                <div className="lg:col-span-2 space-y-4">
                  {activeClip ? (
                    <CleanFlashPlayer
                      videoUrl={activeClip.video_url || youtubeUrlsText.split("\n")[0]}
                      segments={selectedClipsList.length > 0 ? selectedClipsList : [activeClip]}
                      totalDurationSeconds={cumulativeDurationSeconds || activeClip.duration_seconds}
                      title={flashTitle || activeClip.title}
                      partnerName="Nexativa Studio"
                    />
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
                        className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          activeClip?.clip_id === clip.clip_id
                            ? "bg-red-950/40 border-red-500/80 shadow-lg"
                            : "bg-black/30 border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-mono text-amber-400 font-bold">{clip.source_title || "Programa"} ({clip.start_timestamp} - {clip.end_timestamp})</span>
                          <span className="text-red-400 font-bold">Puntaje: {clip.impact_score}/10</span>
                        </div>

                        <h4 className="text-sm font-bold text-white line-clamp-2">{clip.title}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2">{clip.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
