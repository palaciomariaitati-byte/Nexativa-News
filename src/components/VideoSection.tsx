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
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Si scrollea más de 400px hacia abajo, lo hacemos flotar
      setIsFloating(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    if (!currentVideo) return;
    setIsPlaying(false);

    const watchdog = setTimeout(() => {
      if (!isPlaying) {
        console.warn(`Watchdog: El video ${currentVideo.title} no arrancó en 8 segundos. Saltando al siguiente...`);
        handleVideoEnd();
      }
    }, 8000);

    return () => clearTimeout(watchdog);
  }, [currentIndex, currentVideo]);

  if (loading || queue.length === 0 || !currentVideo) return null;

  const floatingClasses = isFloating 
    ? "fixed bottom-6 right-6 w-[300px] sm:w-[350px] z-[60] shadow-2xl scale-100" 
    : "relative w-full max-w-4xl mx-auto z-10";

  return (
    showVideo ? (
      <div className={`transition-all duration-500 ease-in-out bg-black border border-white/10 rounded-xl overflow-hidden ${floatingClasses}`}>
        <button
          onClick={() => setShowVideo(false)}
          className="absolute top-2 right-2 text-white/50 hover:text-white bg-black/60 rounded-full w-8 h-8 flex items-center justify-center z-50 backdrop-blur-sm"
          title="Cerrar reproductor"
        >
          ✖
        </button>
        <div className="flex flex-col relative group">
          <div className="absolute top-0 left-0 w-full p-3 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <h5 className="font-semibold text-white text-sm flex items-center gap-2 truncate pr-8">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {currentVideo.title}
            </h5>
            <span className="text-[10px] font-bold text-white/80 px-2 py-1 bg-white/20 rounded-md backdrop-blur-md">
              {currentIndex + 1}/{queue.length}
            </span>
          </div>
          
          <div className="aspect-video w-full relative bg-black">
              {/* @ts-ignore */}
              <ReactPlayer
                url={currentVideo.video_url}
                playing={true}
                controls={!isFloating} // Hide controls when floating to keep it clean
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
                config={({
                  youtube: {
                    playerVars: { 
                      autoplay: 1, 
                      modestbranding: 1, 
                      mute: 1,
                      origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
                    }
                  }
                }) as any}
              />
          </div>
        </div>
      </div>
    ) : (
      <div className={`flex flex-col items-center justify-center p-4 bg-black/40 border border-white/10 rounded-xl shadow-inner backdrop-blur-md ${isFloating ? 'fixed bottom-6 right-6 w-auto z-[60]' : 'w-full max-w-4xl mx-auto'}`}>
        <p className="text-gray-400 text-xs mb-2 hidden md:block">Transmisión minimizada</p>
        <button 
          onClick={() => setShowVideo(true)}
          className="bg-[var(--color-brand-accent)] text-black font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          ▶ En Vivo
        </button>
      </div>
    )
  );
}
