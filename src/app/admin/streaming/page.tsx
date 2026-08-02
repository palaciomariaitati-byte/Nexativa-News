"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { VideoQueueItem } from "@/lib/types";
import AdVideoUploader from "@/components/AdVideoUploader";

export default function AdminStreamingPage() {
  const [activeTab, setActiveTab] = useState<"ad_manager" | "stream_queue">("ad_manager");
  const [videos, setVideos] = useState<VideoQueueItem[]>([]);
  const [adSpots, setAdSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  
  // Settings del intercalador de pauta por socio
  const [selectedPartner, setSelectedPartner] = useState("cadena4");
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [isAutoInterleave, setIsAutoInterleave] = useState(true);
  const [triggerStatusMsg, setTriggerStatusMsg] = useState("");

  const supabase = getSupabaseBrowserClient();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("video_queue").select("*").order("position", { ascending: true });
    if (data) setVideos(data);
    setLoading(false);
  }, [supabase]);

  const fetchAdSpots = useCallback(async () => {
    const { data } = await supabase.from("ad_spots").select("*").order("position", { ascending: true });
    if (data) {
      setAdSpots(data);
    } else {
      // Fallback a vacio si no hay spots
      setAdSpots([]);
    }
  }, [supabase]);

  const fetchAdSettings = useCallback(async () => {
    const { data } = await supabase.from("ad_settings").select("*").eq("partner_id", selectedPartner).single();
    if (data) {
      setIntervalMinutes(data.interval_minutes || 15);
      setIsAutoInterleave(data.is_auto_interleave ?? true);
    }
  }, [supabase, selectedPartner]);

  useEffect(() => {
    fetchVideos();
    fetchAdSpots();
    fetchAdSettings();
  }, [fetchVideos, fetchAdSpots, fetchAdSettings]);

  const detectType = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("twitch.tv")) return "twitch";
    return "custom";
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl || !newVideoTitle) return;

    const nextPos = videos.length > 0 ? Math.max(...videos.map(v => v.position)) + 1 : 1;

    const { error } = await supabase.from("video_queue").insert([{
      title: newVideoTitle,
      video_url: newVideoUrl,
      type: detectType(newVideoUrl),
      status: "queued",
      position: nextPos
    }]);

    if (!error) {
      setNewVideoUrl("");
      setNewVideoTitle("");
      fetchVideos();
    } else {
      alert("Error al añadir video: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("video_queue").delete().eq("id", id);
    setVideos(videos.filter(v => v.id !== id));
  };

  const handleDeleteAdSpot = async (id: string) => {
    await supabase.from("ad_spots").delete().eq("id", id);
    fetchAdSpots();
  };

  const handleToggleAdSpotStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "paused" : "active";
    await supabase.from("ad_spots").update({ status: nextStatus }).eq("id", id);
    fetchAdSpots();
  };

  const handleSaveAdSettings = async () => {
    const { error } = await supabase.from("ad_settings").upsert({
      partner_id: selectedPartner,
      interval_minutes: intervalMinutes,
      is_auto_interleave: isAutoInterleave,
      updated_at: new Date().toISOString()
    });

    if (error) {
      alert("Aviso: " + error.message);
    } else {
      setTriggerStatusMsg("✅ Configuración de frecuencia de pauta actualizada.");
      setTimeout(() => setTriggerStatusMsg(""), 3000);
    }
  };

  // Botón de Disparo Inmediato: "🚀 Lanzar Pauta Publicitaria Ahora"
  const handleTriggerAdNow = async () => {
    setTriggerStatusMsg("🚀 Disparando pauta publicitaria en vivo...");
    const nowToken = `trigger_${Date.now()}`;
    
    const { error } = await supabase.from("ad_settings").upsert({
      partner_id: selectedPartner,
      interval_minutes: intervalMinutes,
      is_auto_interleave: isAutoInterleave,
      trigger_now_token: nowToken,
      updated_at: new Date().toISOString()
    });

    if (error) {
      // Fallback a marcar en video_queue como playing
      console.warn("Fallback a video_queue:", error.message);
      const activeSpot = adSpots.find(s => s.status === 'active') || adSpots[0];
      if (activeSpot) {
        await supabase.from("video_queue").insert([{
          title: `[PAUTA EN VIVO] ${activeSpot.title}`,
          video_url: activeSpot.video_url,
          type: "custom",
          status: "playing",
          position: 0
        }]);
      }
    }

    setTriggerStatusMsg("✅ ¡Pauta enviada al reproductor en vivo con éxito!");
    setTimeout(() => setTriggerStatusMsg(""), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header con Pestañas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase font-bold">
            Streaming & Pauta Publicitaria
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Gestión de transmisión en vivo, subida de publicidad con barra de carga e intercalado multi-socio.
          </p>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("ad_manager")}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "ad_manager"
                ? "bg-[var(--color-brand-accent)] text-black shadow-lg shadow-amber-500/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            🎬 Pauta Publicitaria & Intercalador
          </button>
          <button
            onClick={() => setActiveTab("stream_queue")}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "stream_queue"
                ? "bg-[var(--color-brand-accent)] text-black shadow-lg shadow-amber-500/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            📺 Cola de Streaming Vivo
          </button>
        </div>
      </div>

      {activeTab === "ad_manager" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Panel de Control de Frecuencia e Intercalado */}
          <div className="bg-gradient-to-r from-amber-500/10 via-black/40 to-black/60 border border-[var(--color-brand-accent)]/30 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[var(--color-brand-accent)] text-black text-xs font-black uppercase px-2.5 py-1 rounded-md">
                    Master Arbitrator
                  </span>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Programador de Intercalado Publicitario
                  </h2>
                </div>
                <p className="text-xs text-white/60">
                  Define la frecuencia con la que el reproductor pausará suavemente la señal en vivo para emitir la pauta comercial.
                </p>
              </div>

              {/* Botón de Lanzamiento Inmediato */}
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleTriggerAdNow}
                  className="w-full lg:w-auto bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-white font-black text-sm uppercase tracking-widest px-8 py-4 rounded-xl hover:brightness-125 active:scale-95 transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 border border-red-400/40 animate-pulse"
                >
                  <span>🚀</span> Lanzar Pauta Publicitaria Ahora (En Vivo)
                </button>
                {triggerStatusMsg && (
                  <p className="text-xs font-bold text-emerald-400 animate-fadeIn">{triggerStatusMsg}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/10">
              <div>
                <label className="block text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wider mb-2">
                  Socio / Medio Configurado
                </label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-brand-accent)]"
                >
                  <option value="cadena4">Cadena 4 (Ituzaingó, Corrientes)</option>
                  <option value="nexativa_main">Nexativa News (Master Control)</option>
                  <option value="radio_corrientes">Radio Corrientes Partner</option>
                  <option value="futuro_socio">Futuro Socio / Medio Asociado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wider mb-2">
                  Frecuencia de Corte (Minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 15)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-brand-accent)]"
                />
                <p className="text-[10px] text-white/40 mt-1">Pausa la transmisión cada {intervalMinutes} minutos para pauta.</p>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={handleSaveAdSettings}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl border border-white/20 transition-all"
                >
                  💾 Guardar Frecuencia
                </button>
              </div>
            </div>
          </div>

          {/* Formulario de Subida con Barra de Progreso */}
          <AdVideoUploader onSuccess={fetchAdSpots} defaultPartnerId={selectedPartner} />

          {/* Lista de Spots de Pauta */}
          <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                Cartelera de Pautas Publicitarias Cargadas
              </h3>
              <span className="text-xs bg-[var(--color-brand-accent)]/20 text-[var(--color-brand-accent)] border border-[var(--color-brand-accent)]/30 px-3 py-1 rounded-full font-bold">
                {adSpots.length} Spots Activos
              </span>
            </div>

            {adSpots.length === 0 ? (
              <div className="p-12 text-center text-white/40 space-y-2">
                <p className="text-2xl">📺</p>
                <p className="font-medium">No hay videos de pauta publicitaria cargados para este socio.</p>
                <p className="text-xs text-white/30">Usa el formulario superior con la barra de carga para subir un video MP4 comercial.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-white/60">
                      <th className="p-4">Anunciante / Título</th>
                      <th className="p-4">Socio / Target</th>
                      <th className="p-4">Duración</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {adSpots.map((spot) => (
                      <tr key={spot.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-white">{spot.title}</p>
                          <p className="text-xs text-white/40 truncate max-w-[300px] font-mono">{spot.video_url}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-white/10 text-white/80 border border-white/15 px-2.5 py-1 rounded-lg text-xs uppercase font-bold">
                            {spot.partner_id || "cadena4"}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-white/70">
                          {spot.duration_seconds || 30}s
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAdSpotStatus(spot.id, spot.status)}
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                              spot.status === "active"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                            }`}
                          >
                            {spot.status === "active" ? "🟢 Habilitado" : "🟡 Pausado"}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-3">
                          <a
                            href={spot.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                          >
                            ▶ Ver Video
                          </a>
                          <button
                            onClick={() => handleDeleteAdSpot(spot.id)}
                            className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider"
                          >
                            Quitar
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
      )}

      {activeTab === "stream_queue" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Agregar Video a Cola */}
          <form onSubmit={handleAddVideo} className="bg-black/20 rounded-xl border border-white/10 p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Título del Video</label>
              <input required type="text" value={newVideoTitle} onChange={e => setNewVideoTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="Ej: Entrevista Exclusiva" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Enlace (YouTube, Twitch, MP4)</label>
              <input required type="url" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="https://youtube.com/..." />
            </div>
            <button type="submit" className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black font-bold uppercase tracking-widest py-3 px-8 rounded-lg transition-colors h-[50px]">
              Añadir
            </button>
          </form>

          {/* Lista de Videos */}
          <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-white/50">Cargando cola...</div>
            ) : videos.length === 0 ? (
              <div className="p-8 text-center text-white/50">La cola de reproducción está vacía.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Video</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Estado</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {videos.map((video) => (
                    <tr key={video.id} className={`hover:bg-white/5 transition-colors ${video.status === 'playing' ? 'bg-[var(--color-brand-accent)]/10' : ''}`}>
                      <td className="p-4">
                        <p className="font-medium text-white">{video.title}</p>
                        <p className="text-xs text-white/50 truncate max-w-[200px]">{video.video_url}</p>
                      </td>
                      <td className="p-4">
                        {video.status === 'playing' ? (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">EN VIVO</span>
                        ) : (
                          <span className="bg-white/10 text-white/70 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">En Cola</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button onClick={() => handleDelete(video.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase tracking-wider font-bold">Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
