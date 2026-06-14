"use client";

import React, { useEffect, useState, useRef } from "react";
import NoraChatWindow from "./NoraChatWindow";

export default function NoraAgent() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [contextProduct, setContextProduct] = useState<string | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const currentHoveredProduct = useRef<string | null>(null);
  const hasTriggered = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const productElement = target.closest('[data-nora-product]') as HTMLElement;
      
      if (productElement) {
        const productName = productElement.getAttribute('data-nora-product');
        if (productName && productName !== currentHoveredProduct.current) {
          currentHoveredProduct.current = productName;
          // Siempre actualizamos el contexto por si el usuario abre el chat manualmente
          setContextProduct(productName);
          
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          
          // Reducimos a 1.5 segundos para que sea más reactivo
          hoverTimer.current = setTimeout(() => {
            // Solo abrir automáticamente si no está abierto ya
            setIsChatOpen((prev) => {
              if (!prev) return true;
              return prev;
            });
          }, 1500);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = (e.relatedTarget as HTMLElement)?.closest?.('[data-nora-product]');
      const productElement = target.closest('[data-nora-product]');
      
      // Solo cancelar si salimos completamente de un producto (no hacia uno de sus hijos)
      if (productElement && relatedTarget !== productElement) {
        currentHoveredProduct.current = null;
        if (hoverTimer.current) {
          clearTimeout(hoverTimer.current);
          hoverTimer.current = null;
        }
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  return (
    <>
      <NoraChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextProductTitle={contextProduct}
      />
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-32 left-6 sm:bottom-6 sm:left-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform z-50 overflow-hidden border-2 border-white/20"
        >
          <img src="/nora-avatar.png" alt="Nora" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
          <span className="sr-only">Abrir Chat con Nora</span>
        </button>
      )}
    </>
  );
}
