"use client";

import { useState, useRef, useEffect } from "react";

export default function ClassicRadioPlayer({ streamUrl }: { streamUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isError, setIsError] = useState(false);
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
    setIsError(false);
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        setIsPlaying(false);
      } else {
        audioRef.current.src = streamUrl;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((e) => {
          console.error("Radio play error:", e);
          setIsError(true);
          setIsPlaying(false);
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center cursor-pointer group" onClick={togglePlay} title={isPlaying ? "Pausar Radio" : "Encender Radio"}>
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-4 border-double border-[#2c241b] shadow-md bg-[#eae0c4] transition-transform group-hover:scale-105">
        <img 
          src="/vintage-radio.png" 
          alt="Radio Vintage" 
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 sepia-[.3] mix-blend-multiply" 
        />
        
        {/* Indicador LED de encendido */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border border-black z-10 ${isPlaying ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-red-900/50'}`} />
        
        {/* Play/Pause icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
          {isPlaying ? (
            <div className="w-6 h-6 border-x-8 border-[#f4ebd0] opacity-90 shadow-sm" />
          ) : (
            <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-l-[20px] border-transparent border-l-[#f4ebd0] opacity-90 ml-2 shadow-sm" />
          )}
        </div>
      </div>
      
      <div className="text-[10px] sm:text-xs uppercase mt-2 font-bold tracking-widest">
        {isPlaying ? (
          <span className="text-red-700 animate-pulse">● Al Aire</span>
        ) : (
          <span className="opacity-70 text-[#2c241b]">Transmisión Radial</span>
        )}
      </div>
      
      {isError && (
        <div className="text-[9px] text-red-600 mt-1 max-w-[140px] leading-tight font-bold text-center">
          Fallo de señal. El dial {streamUrl} está fuera de alcance.
        </div>
      )}
    </div>
  );
}
