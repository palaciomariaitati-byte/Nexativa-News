"use client";

import React, { useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VideoQueueItem } from "@/lib/types";

// Parseo Infalible de URLs de YouTube
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId: string | null = null;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtube.com")) {
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        videoId = parsedUrl.pathname.split("/")[2];
      } else {
        videoId = parsedUrl.searchParams.get("v");
      }
    } else if (parsedUrl.hostname.includes("youtu.be")) {
      videoId = parsedUrl.pathname.substring(1);
    }
  } catch (e) {
    // Ignorar errores de URL y tratar de extraer de otra manera si falla el constructor URL
  }

  if (videoId) {
    // Parámetros exigidos para bypass autoplay y mute inicial
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1`;
  }
  return null;
}

export default function VideoSection() {
  const [activeVideo, setActiveVideo] = useState<VideoQueueItem | null>(null);
  const [showVideo, setShowVideo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!placeholderRef.current) return;
      const rect = placeholderRef.current.getBoundingClientRect();
      setIsFloating(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const fetchActiveVideo = async () => {
      const { data, error } = await supabase
        .from("video_queue")
        .select("*")
        .eq("status", "playing")
        .maybeSingle();

      if (!error) {
        setActiveVideo(data || null);
      }
      setLoading(false);
    };

    fetchActiveVideo();

    // Sincronización en Tiempo Real con reconexión nativa
    const channel = supabase
      .channel("video_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_queue" },
        () => {
          // Volvemos a obtener el estado para asegurar consistencia
          fetchActiveVideo();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("Realtime conectado");
        } else if (status === 'CLOSED') {
          console.log("Realtime desconectado");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="p-4 bg-gray-900 text-white text-center rounded-xl border border-white/10 w-full max-w-4xl mx-auto mt-8">Cargando transmisión en vivo...</div>;
  }

  if (!activeVideo) {
    return <div className="p-4 bg-black/40 text-white/50 text-center rounded-xl border border-white/10 w-full max-w-4xl mx-auto mt-8">Próximamente estaremos en vivo.</div>;
  }

  const embedUrl = getYouTubeEmbedUrl(activeVideo.video_url);

  const floatingClasses = isFloating 
    ? "fixed bottom-20 left-4 w-[200px] sm:bottom-6 sm:left-6 sm:w-[350px] z-[60] shadow-2xl scale-100" 
    : "relative w-full max-w-3xl mx-auto z-10";

  return (
    <>
      <div ref={placeholderRef} className="w-full h-px absolute -top-20" />
      
      {showVideo ? (
        <div className={`transition-all duration-500 ease-in-out bg-black border border-white/10 rounded-xl overflow-hidden ${floatingClasses}`}>
          {isFloating && (
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-1 right-1 text-white hover:text-white bg-black/80 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center z-50 backdrop-blur-sm border border-white/20 shadow-lg text-xs"
              title="Cerrar reproductor"
            >
              ✖
            </button>
          )}
          <div className="flex flex-col relative group">
            {isFloating && (
              <div className="absolute top-0 left-0 w-full p-1.5 sm:p-2 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between pointer-events-none">
                <h5 className="font-semibold text-white text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 truncate pr-8">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
                  En Vivo
                </h5>
              </div>
            )}
            
            <div className="aspect-video w-full relative bg-black">
              {embedUrl ? (
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={embedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-gray-900">
                  Formato de video no soportado
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center p-2 sm:p-3 bg-black/80 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md ${isFloating ? 'fixed bottom-20 left-4 sm:bottom-6 sm:left-6 w-auto z-[60]' : 'w-full max-w-4xl mx-auto'}`}>
          <p className="text-gray-400 text-[10px] mb-1.5 hidden md:block">Transmisión minimizada</p>
          <button 
            onClick={() => setShowVideo(true)}
            className="bg-[var(--color-brand-accent)] text-black text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 sm:gap-2"
          >
            ▶ En Vivo
          </button>
        </div>
      )}
    </>
  );
}
