"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import NoraChatWindow from "./NoraChatWindow";

export default function NoraAgent() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const currentHoveredContext = useRef<string | null>(null);
  const hasTriggeredBottom = useRef<boolean>(false);

  // Excluir únicamente páginas administrativas internas (Admin / Dashboard)
  const isAdminPage = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  if (isAdminPage) {
    return null;
  }

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
          className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-110 active:scale-95 transition-all z-40 overflow-hidden border-2 border-white/30 group"
          title="Nora — Recepcionista Virtual"
        >
          <img 
            src="/nora-avatar.jpg?v=2" 
            alt="Nora" 
            className="w-full h-full object-cover relative z-10" 
            onError={(e) => { e.currentTarget.style.opacity = '0'; }} 
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-purple-700 to-indigo-500">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
            </svg>
          </div>
          <span className="sr-only">Abrir Chat con Nora</span>
        </button>
      )}
    </>
  );
}
