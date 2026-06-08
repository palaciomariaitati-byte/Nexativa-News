"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Dynamically import react-player to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function VideoSection() {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("video_queue")
        .select("*")
        .order("position", { ascending: true });

      if (!error && data) {
        setQueue(data);
      }
      setLoading(false);
    };

    fetchQueue();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("video_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_queue" },
        () => fetchQueue()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentVideo = queue[currentIndex];

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Watchdog Timer: Si un video se queda cargando (pantalla negra) por 8 segundos y no arranca, lo salta.
  // Esto arregla el problema de los videos bloqueados por YouTube (como A24) que se quedan pegados.
  useEffect(() => {
    if (!currentVideo) return;
    setIsPlaying(false); // Reiniciamos estado al cambiar de video

    const watchdog = setTimeout(() => {
      if (!isPlaying) {
        console.warn(`Watchdog: El video ${currentVideo.title} no arrancó en 8 segundos. Saltando al siguiente...`);
        handleVideoEnd();
      }
    }, 8000);

    return () => clearTimeout(watchdog);
  }, [currentIndex, currentVideo]);

  if (loading || queue.length === 0 || !currentVideo) return null;

  return (
    showVideo ? (
      <div className="space-y-4 w-full h-auto bg-black border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden relative">
        <button
          onClick={() => setShowVideo(false)}
          className="absolute top-1 right-1 text-white/50 hover:text-white bg-black/50 rounded-full w-6 h-6 flex items-center justify-center z-50"
          title="Cerrar reproductor"
        >
          ✖
        </button>
        <div className="h-full flex flex-col relative group">
          <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <h5 className="font-semibold text-white text-sm flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {currentVideo.title}
            </h5>
            <span className="text-xs text-white/50 px-2 bg-white/10 rounded-full">
              {currentIndex + 1} / {queue.length}
            </span>
          </div>
          
          <div className="aspect-video flex-1 w-full relative bg-black">
            <ReactPlayer
              url={currentVideo.video_url}
              playing={true}
              controls={true}
              muted={true}
              width="100%"
              height="100%"
              onPlay={() => setIsPlaying(true)}
              onEnded={handleVideoEnd}
              onError={(e) => {
                console.error("Error playing video:", currentVideo.video_url, e);
                handleVideoEnd();
              }}
              style={{ position: "absolute", top: 0, left: 0 }}
              config={{
                youtube: {
                  playerVars: { autoplay: 1, modestbranding: 1, mute: 1 }
                }
              }}
            />
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center p-8 bg-black/40 border border-white/10 rounded-lg shadow-inner">
        <p className="text-gray-400 text-sm mb-4">Transmisión minimizada</p>
        <button 
          onClick={() => setShowVideo(true)}
          className="bg-[var(--color-brand-accent)] text-black font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 w-full justify-center"
        >
          ▶ Abrir Reproductor
        </button>
      </div>
    )
  );
}
