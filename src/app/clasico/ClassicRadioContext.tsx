"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";

interface ClassicRadioContextType {
  isPlaying: boolean;
  isError: boolean;
  togglePlay: () => void;
  streamUrl: string;
}

const ClassicRadioContext = createContext<ClassicRadioContextType | undefined>(undefined);

export function useClassicRadio() {
  const context = useContext(ClassicRadioContext);
  if (!context) {
    throw new Error("useClassicRadio must be used within a ClassicRadioProvider");
  }
  return context;
}

export function ClassicRadioProvider({ children, streamUrl }: { children: React.ReactNode; streamUrl: string }) {
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
        let actualUrl = streamUrl;
        
        // Mismos workarounds que en la versión moderna (VideoSection.tsx)
        if (actualUrl.includes("pistarinconsoñado.com.ar") || 
            actualUrl.includes("xn--pistarinconsoado-jub.com.ar") || 
            actualUrl.includes("pistarinconsonado.com.ar")) {
          actualUrl = "https://miestacion.turadioonline.com.ar/8180/stream";
        }
        const cleanUrl = actualUrl.split('nocache=')[0].replace(/[?&]$/, '');
        const separator = cleanUrl.includes('?') ? '&' : '?';
        const freshUrl = `${cleanUrl}${separator}nocache=${Date.now()}`;
        
        audioRef.current.src = freshUrl;
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
    <ClassicRadioContext.Provider value={{ isPlaying, isError, togglePlay, streamUrl }}>
      {children}
    </ClassicRadioContext.Provider>
  );
}
