"use client";

import { useState, useRef, useEffect } from "react";

export default function ClassicRadioPlayer({ streamUrl }: { streamUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.src = streamUrl;
    audio.preload = "none";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    };
  }, [streamUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        setIsPlaying(false);
      } else {
        audioRef.current.src = streamUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 border-2 border-double border-[#2c241b] bg-[#eae0c4] shadow-sm transform rotate-1">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-2 border-b border-[#2c241b] pb-1 w-full text-center">
        Transmisión Radial
      </div>
      <button 
        onClick={togglePlay}
        className="w-12 h-12 rounded-full border-2 border-[#2c241b] flex items-center justify-center hover:bg-[#d8cba8] transition-colors"
      >
        {isPlaying ? (
          <div className="w-4 h-4 bg-[#2c241b]" />
        ) : (
          <div className="w-0 h-0 border-t-8 border-b-8 border-l-[12px] border-transparent border-l-[#2c241b] ml-1" />
        )}
      </button>
      <div className="text-[9px] uppercase mt-2 font-bold opacity-70">
        {isPlaying ? "AL AIRE" : "APAGADO"}
      </div>
    </div>
  );
}
