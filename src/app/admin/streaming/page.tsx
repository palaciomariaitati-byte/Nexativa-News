"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { VideoQueueItem } from "@/lib/types";

export default function AdminStreamingPage() {
  const [videos, setVideos] = useState<VideoQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const supabase = getSupabaseBrowserClient();

  const fetchVideos = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("video_queue").select("*").order("position", { ascending: true });
    if (data) setVideos(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
     
    fetchVideos();
  }, [fetchVideos]);

  const detectType = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("twitch.tv")) return "twitch";
    return "custom";
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl || !newVideoTitle) return;

    // Next position is max + 1
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

  const movePosition = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === videos.length - 1)) return;

    const current = videos[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const target = videos[targetIndex];

    // Swap positions
    await supabase.from("video_queue").update({ position: target.position }).eq("id", current.id);
    await supabase.from("video_queue").update({ position: current.position }).eq("id", target.id);
    
    fetchVideos();
  };

  const setAsPlaying = async (id: string) => {
    // Set all to queued first
    await supabase.from("video_queue").update({ status: "queued" }).neq("status", "queued");
    // Set selected to playing
    await supabase.from("video_queue").update({ status: "playing" }).eq("id", id);
    fetchVideos();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Cola de Streaming</h1>
      
      {/* Agregar Video */}
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
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 w-16">Orden</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Video</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Estado</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {videos.map((video, idx) => (
                <tr key={video.id} className={`hover:bg-white/5 transition-colors ${video.status === 'playing' ? 'bg-[var(--color-brand-accent)]/10' : ''}`}>
                  <td className="p-4">
                    <div className="flex flex-col items-center">
                      <button onClick={() => movePosition(idx, 'up')} className="text-white/30 hover:text-white mb-1">▲</button>
                      <span className="font-bold">{idx + 1}</span>
                      <button onClick={() => movePosition(idx, 'down')} className="text-white/30 hover:text-white mt-1">▼</button>
                    </div>
                  </td>
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
                    {video.status !== 'playing' && (
                      <button onClick={() => setAsPlaying(video.id)} className="text-[var(--color-brand-accent)] hover:text-white transition-colors text-sm uppercase tracking-wider font-bold">Reproducir Ya</button>
                    )}
                    <button onClick={() => handleDelete(video.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase tracking-wider font-bold">Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
