"use client";

import React, { useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VideoQueueItem } from "@/lib/types";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

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
    // Parámetros exigidos para bypass autoplay inicial, con playsinline para evitar fullscreen forzado en móvil
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1`;
  }
  return null;
}

const PLAYER_CONFIG = {
  youtube: {
    playerVars: { autoplay: 1, playsinline: 1 }
  }
};

export default function VideoSection() {
  const [activeVideo, setActiveVideo] = useState<VideoQueueItem | null>(null);
  const [showVideo, setShowVideo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [mode, setMode] = useState<"tv" | "radio">("tv");
  const [radioUrl, setRadioUrl] = useState<string | null>(null);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [isRadioBuffering, setIsRadioBuffering] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = document.createElement("audio");
    a.preload = "none";
    a.style.display = "none";
    document.body.appendChild(a);
    audioRef.current = a;

    a.onplaying = () => {
      setIsRadioPlaying(true);
      setIsRadioBuffering(false);
    };
    a.onwaiting = () => setIsRadioBuffering(true);
    a.onpause = () => {
      setIsRadioPlaying(false);
      setIsRadioBuffering(false);
    };
    a.onerror = (e) => {
      console.error("Audio error:", e);
      setIsRadioPlaying(false);
      setIsRadioBuffering(false);
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        if (document.body.contains(audioRef.current)) {
          document.body.removeChild(audioRef.current);
        }
        audioRef.current = null;
      }
    };
  }, []);

  const toggleRadioPlay = () => {
    if (audioRef.current) {
      if (isRadioPlaying || isRadioBuffering) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        setIsRadioPlaying(false);
        setIsRadioBuffering(false);
      } else {
        setIsRadioBuffering(true);
        if (radioUrl) {
          let actualUrl = radioUrl;
          if (actualUrl.includes("pistarinconsoñado.com.ar") || 
              actualUrl.includes("xn--pistarinconsoado-jub.com.ar") || 
              actualUrl.includes("pistarinconsonado.com.ar")) {
            actualUrl = "https://miestacion.turadioonline.com.ar/8180/stream";
          }
          const cleanUrl = actualUrl.split('nocache=')[0].replace(/[?&]$/, '');
          const separator = cleanUrl.includes('?') ? '&' : '?';
          const freshUrl = `${cleanUrl}${separator}nocache=${Date.now()}`;
          audioRef.current.src = freshUrl;
        }
        audioRef.current.volume = 1.0;
        audioRef.current.load();

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Error al reproducir audio:", e);
            setIsRadioBuffering(false);
            setIsRadioPlaying(false);
          });
        }
      }
    }
  };

  // Pause radio when switching to TV mode
  useEffect(() => {
    if (mode === "tv" && audioRef.current && (isRadioPlaying || isRadioBuffering)) {
      audioRef.current.pause();
      setIsRadioPlaying(false);
      setIsRadioBuffering(false);
    }
  }, [mode, isRadioPlaying, isRadioBuffering]);

  useEffect(() => {
    const handleScroll = () => {
      if (!placeholderRef.current) return;
      const rect = placeholderRef.current.getBoundingClientRect();
      setIsFloating(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleVideoEnded = async () => {
    if (!activeVideo) return;
    try {
      console.log("Video finalizado, solicitando siguiente...");
      await fetch("/api/streaming/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: activeVideo.id }),
      });
    } catch (e) {
      console.error("Error al avanzar la cola:", e);
    }
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: any = null;
    let reconnectTimeout: NodeJS.Timeout;

    const fetchActiveVideo = async () => {
      const { data, error } = await supabase
        .from("video_queue")
        .select("*")
        .eq("status", "playing")
        .maybeSingle();

      if (!error) {
        setActiveVideo(data || null);
      }

      const { data: settingsData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "radio_url")
        .maybeSingle();

      if (settingsData?.value) {
        setRadioUrl(settingsData.value);
      }

      setLoading(false);
    };

    fetchActiveVideo();

    const connectRealtime = () => {
      // 1. Manejo del Ciclo de Vida del Canal (Unsubscribe Limpio)
      if (channel) {
        supabase.removeChannel(channel);
      }

      // Sincronización en Tiempo Real
      channel = supabase
        .channel("video_queue_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "video_queue" },
          () => {
            // Volvemos a obtener el estado para asegurar consistencia
            fetchActiveVideo();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log("Realtime video conectado");
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || err) {
            console.log("Realtime video desconectado. Reconectando en 3s...");
            // 3. Monitoreo de Estado del Canal (Auto-reconnect)
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(() => {
              connectRealtime();
            }, 3000);
          }
        });
    };

    connectRealtime();

    // 2. Reconexión por Enfoque de Pantalla (Visibility Change API)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Pestaña visible: reconectando Video Realtime...");
        fetchActiveVideo(); // Asegurar estado limpio
        connectRealtime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(reconnectTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
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
    ? "fixed bottom-20 left-4 w-[200px] sm:bottom-6 sm:left-6 sm:w-[300px] z-[60] shadow-2xl ring-1 ring-white/20 opacity-95 hover:opacity-100 scale-100 translate-y-0" 
    : "relative w-full max-w-2xl mx-auto z-10 shadow-xl opacity-100 scale-100 translate-y-0";

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div ref={placeholderRef} className="w-full h-px absolute -top-20" />
      
      {/* Spacer para evitar el salto áspero (layout shift) en la pantalla cuando se hace flotante */}
      {isFloating && showVideo && (
        <div className="w-full aspect-video rounded-xl bg-white/5 animate-pulse" />
      )}

      {showVideo ? (
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] bg-black border border-white/10 rounded-xl overflow-hidden ${floatingClasses}`}>
          
          {/* Selector de Modo (TV / Radio) - Oculto cuando es flotante para ahorrar espacio */}
          {!isFloating && radioUrl && (
            <div className="flex bg-black/50 border-b border-white/10">
              <button 
                onClick={() => setMode("tv")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${mode === "tv" ? "text-[var(--color-brand-accent)] border-b-2 border-[var(--color-brand-accent)] bg-white/5" : "text-white/50 hover:text-white/80"}`}
              >
                📺 TV en Vivo
              </button>
              <button 
                onClick={() => setMode("radio")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${mode === "radio" ? "text-[var(--color-brand-accent)] border-b-2 border-[var(--color-brand-accent)] bg-white/5" : "text-white/50 hover:text-white/80"}`}
              >
                📻 Radio
              </button>
            </div>
          )}

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
                  {mode === "tv" ? "TV en Vivo" : "Radio en Vivo"}
                </h5>
              </div>
            )}
            
            <div className={`aspect-video w-full relative ${mode === "radio" ? "bg-gradient-to-br from-indigo-900 to-black" : "bg-black"}`}>
              {mode === "tv" && activeVideo?.video_url ? (
                <ReactPlayer
                  src={activeVideo.video_url}
                  className="absolute top-0 left-0"
                  width="100%"
                  height="100%"
                  playing={true}
                  muted={false}
                  controls={true}
                  playsinline={true}
                  onEnded={handleVideoEnded}
                  config={PLAYER_CONFIG}
                />
              ) : mode === "radio" && radioUrl ? (
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pb-8 z-10 bg-[#0a0a0a]">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl flex items-center justify-center mb-6 relative shadow-[0_0_40px_rgba(200,150,100,0.15)] bg-gradient-to-br from-[#2a1a10] to-black p-4 border border-[#cf9e6e]/20">
                      <img src="https://xn--pistarinconsoado-jub.com.ar/assets/logo.png" alt="Rincón Soñado" className="w-full h-full object-contain drop-shadow-xl" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 uppercase tracking-widest drop-shadow-lg text-center px-4">
                      {isRadioBuffering ? "Conectando..." : isRadioPlaying ? "Radio en Vivo" : "Transmisión Pausada"}
                    </h3>
                    
                    {isRadioPlaying && !isRadioBuffering && (
                      <div className="flex items-end gap-1.5 h-6 opacity-80 mb-4">
                        <span className="w-1.5 sm:w-2 bg-[#cf9e6e] animate-[pulse_1s_ease-in-out_infinite]" style={{ height: '30%' }}></span>
                        <span className="w-1.5 sm:w-2 bg-[#e8be92] animate-[pulse_1.2s_ease-in-out_infinite]" style={{ height: '80%' }}></span>
                        <span className="w-1.5 sm:w-2 bg-[#ffdca8] animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '50%' }}></span>
                        <span className="w-1.5 sm:w-2 bg-[#e8be92] animate-[pulse_1.1s_ease-in-out_infinite]" style={{ height: '100%' }}></span>
                        <span className="w-1.5 sm:w-2 bg-[#cf9e6e] animate-[pulse_0.9s_ease-in-out_infinite]" style={{ height: '60%' }}></span>
                      </div>
                    )}

                    <button 
                      onClick={toggleRadioPlay}
                      className="mt-2 bg-[#cf9e6e] hover:bg-[#ffdca8] text-black rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-[0_0_20px_rgba(207,158,110,0.4)] hover:shadow-[0_0_30px_rgba(255,220,168,0.6)] transition-all transform hover:scale-105"
                      disabled={isRadioBuffering}
                    >
                      {isRadioBuffering ? (
                        <svg className="animate-spin w-6 h-6 sm:w-8 sm:h-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : isRadioPlaying ? (
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-gray-900">
                  <span className="text-4xl mb-3">{mode === "tv" ? "📺" : "📻"}</span>
                  <p>{mode === "tv" ? "Formato de video no soportado" : "Radio no disponible"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center p-2 sm:p-3 bg-black/80 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFloating ? 'fixed bottom-20 left-4 sm:bottom-6 sm:left-6 w-auto z-[60]' : 'w-full max-w-2xl mx-auto'}`}>
          <p className="text-gray-400 text-[10px] mb-1.5 hidden md:block">Transmisión minimizada</p>
          <button 
            onClick={() => setShowVideo(true)}
            className="bg-[var(--color-brand-accent)] text-black text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 sm:gap-2"
          >
            ▶ En Vivo
          </button>
        </div>
      )}
    </div>
  );
}
