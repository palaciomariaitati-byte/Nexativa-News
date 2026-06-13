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
    // Si ya se abrió el chat en esta sesión, no volver a abrirlo automáticamente por hover
    if (hasTriggered.current) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const productElement = target.closest('[data-nora-product]') as HTMLElement;
      
      if (productElement) {
        const productName = productElement.getAttribute('data-nora-product');
        if (productName && productName !== currentHoveredProduct.current) {
          currentHoveredProduct.current = productName;
          
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          
          // 2.5 seconds hover threshold
          hoverTimer.current = setTimeout(() => {
            if (!hasTriggered.current) {
              setContextProduct(productName);
              setIsChatOpen(true);
              hasTriggered.current = true; // Solo disparar una vez por sesión para no ser molestos
            }
          }, 2500);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const productElement = target.closest('[data-nora-product]');
      
      if (!productElement) {
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
    </>
  );
}
