"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VideoQueueItem } from "@/lib/types";

// Dynamically import react-player to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function VideoSection() {
  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFloating, setIsFloating] = useState(false);

  const placeholderRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Solo flota si el placeholder dejó de verse Y la ventana se desplazó más abajo de él
        if (!entry.isIntersecting && window.scrollY > (placeholderRef.current?.offsetTop || 0)) {
          setIsFloating(true);
        } else {
          setIsFloating(false);
        }
      },
      { threshold: 0 }
    );
    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }
    return () => observer.disconnect();
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
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (loading || queue.length === 0 || !currentVideo) return null;

  const floatingClasses = isFloating 
    ? "fixed bottom-6 right-6 w-[280px] sm:w-[350px] z-[60] shadow-2xl scale-100" 
    : "relative w-full max-w-3xl mx-auto z-10";

  return (
    <>
      {/* Placeholder invisible para saber cuándo el video original sale de pantalla */}
      <div ref={placeholderRef} className="w-full h-px absolute -top-20" />
      
      {showVideo ? (
        <div className={`transition-all duration-500 ease-in-out bg-black border border-white/10 rounded-xl overflow-hidden ${floatingClasses}`}>
          {isFloating && (
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 text-white hover:text-white bg-black/80 rounded-full w-8 h-8 flex items-center justify-center z-50 backdrop-blur-sm border border-white/20 shadow-lg"
              title="Cerrar reproductor"
            >
              ✖
            </button>
          )}
          <div className="flex flex-col relative group">
            {isFloating && (
              <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between pointer-events-none">
                <h5 className="font-semibold text-white text-xs flex items-center gap-2 truncate pr-8">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  En Vivo
                </h5>
              </div>
            )}
            
            <div className="aspect-video w-full relative bg-black">
                {/* @ts-expect-error react-player types are not strict enough */}
                <ReactPlayer
                  url={currentVideo.video_url}
                  playing={false}
                  controls={true}
                  muted={false}
                  light={true}
                  width="100%"
                  height="100%"
                  onEnded={handleVideoEnd}
                  onError={(e: Error) => {
                    console.error("Error playing video:", currentVideo.video_url, e);
                    handleVideoEnd();
                  }}
                  style={{ position: "absolute", top: 0, left: 0 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  config={({
                    youtube: {
                      playerVars: { 
                        autoplay: 0, 
                        modestbranding: 1, 
                        origin: typeof window !== 'undefined' ? window.location.origin : ''
                      }
                    }
                  }) as any}
                />
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center p-4 bg-black/80 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md ${isFloating ? 'fixed bottom-6 right-6 w-auto z-[60]' : 'w-full max-w-4xl mx-auto'}`}>
          <p className="text-gray-400 text-xs mb-2 hidden md:block">Transmisión minimizada</p>
          <button 
            onClick={() => setShowVideo(true)}
            className="bg-[var(--color-brand-accent)] text-black font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            ▶ En Vivo
          </button>
        </div>
      )}
    </>
  );
}
