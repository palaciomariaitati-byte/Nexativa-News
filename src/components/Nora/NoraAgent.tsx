"use client";

import React, { useEffect, useState, useRef } from "react";
import NoraChatWindow from "./NoraChatWindow";

export default function NoraAgent() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const currentHoveredContext = useRef<string | null>(null);
  const hasTriggeredBottom = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const contextElement = target.closest('[data-nora-context]') as HTMLElement;
      
      if (contextElement) {
        const contextRaw = contextElement.getAttribute('data-nora-context');
        if (contextRaw && contextRaw !== currentHoveredContext.current) {
          currentHoveredContext.current = contextRaw;
          try {
            const parsedData = JSON.parse(contextRaw);
            setContextData(parsedData);
            
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            
            hoverTimer.current = setTimeout(() => {
              setIsChatOpen((prev) => {
                if (!prev) return true;
                return prev;
              });
            }, 6000);
          } catch(err) {
            console.error("Error parsing nora context", err);
          }
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = (e.relatedTarget as HTMLElement)?.closest?.('[data-nora-context]');
      const contextElement = target.closest('[data-nora-context]');
      
      if (contextElement && relatedTarget !== contextElement) {
        currentHoveredContext.current = null;
        if (hoverTimer.current) {
          clearTimeout(hoverTimer.current);
          hoverTimer.current = null;
        }
      }
    };

    const handleScroll = () => {
      // Trigger at the bottom of the page
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if (!hasTriggeredBottom.current) {
          hasTriggeredBottom.current = true;
          setContextData({ type: 'b2b', trigger: 'end_of_page' });
          setIsChatOpen(true);
        }
      } else {
        // Reset if they scroll back up so it can trigger again later if needed
        if (window.innerHeight + window.scrollY < document.body.offsetHeight - 1000) {
          hasTriggeredBottom.current = false;
        }
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  return (
    <>
      <NoraChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextData={contextData}
      />
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-32 left-6 sm:bottom-6 sm:left-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform z-50 overflow-hidden border-2 border-white/20"
        >
          <img src="/nora-avatar.jpg?v=2" alt="Nora" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
          <span className="sr-only">Abrir Chat con Nora</span>
        </button>
      )}
    </>
  );
}
