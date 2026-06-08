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

    // Set up realtime subscription to listen for queue changes
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("video_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_queue" },
        () => {
          fetchQueue(); // Refresh queue when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return null;
  if (queue.length === 0) return null; // Don't show if there's no video in queue

  const currentVideo = queue[currentIndex];

  // If we ran out of videos in the queue, we can loop back or stop
  if (!currentVideo) {
    return null;
  }

  const handleVideoEnd = () => {
    // Move to the next video in the queue
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to the first video
      setCurrentIndex(0);
    }
  };

  const handleVideoError = () => {
    console.error("Error playing video:", currentVideo.video_url);
    handleVideoEnd(); // Skip to next on error
  };

  return (
    showVideo ? (
      <div className="space-y-4 md:static fixed bottom-4 right-4 w-80 h-48 md:w-full md:h-auto bg-black border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden z-50">
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
              muted={true} // Obligatorio para que los navegadores permitan autoplay
              width="100%"
              height="100%"
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              style={{ position: "absolute", top: 0, left: 0 }}
              config={{
                youtube: {
                  playerVars: { autoplay: 1, modestbranding: 1 }
                }
              }}
            />
          </div>
        </div>
      </div>
    ) : (
      <button 
        onClick={() => setShowVideo(true)}
        className="fixed bottom-4 right-4 bg-[var(--color-brand-accent)] text-black font-bold px-4 py-2 rounded-full shadow-lg z-50 hover:scale-105 transition-transform flex items-center gap-2"
      >
        ▶ Abrir Reproductor
      </button>
    )
  );
}
