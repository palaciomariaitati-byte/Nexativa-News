"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Sparkles, HelpCircle } from "lucide-react";
import NoraChatWindow from "./NoraChatWindow";

/**
 * ========================================================================
 * 🤖 NORA AGENT - SOLAPITA AMIGABLE DE ASISTENCIA (CERO INTRUSIÓN)
 * Ubicación: /src/components/Nora/NoraAgent.tsx
 * ========================================================================
 * Elimina los pop-ups automáticos intrusivos y presenta una solapa estética
 * y discreta para que el usuario consulte voluntariamente cuando lo desee.
 */

export default function NoraAgent() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showPill, setShowPill] = useState(true);

  // Excluir páginas de administración o el propio chat fullscreen de NoraItu
  const isExcludedPage = 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/dashboard") || 
    pathname === "/noraitu";

  useEffect(() => {
    // Si el usuario ya cerró la solapita en esta sesión, respetar su decisión
    const dismissed = sessionStorage.getItem("nora_pill_dismissed");
    if (dismissed === "true") {
      setShowPill(false);
    }

    const handleCustomOpen = () => setIsChatOpen(true);
    window.addEventListener("open-nora-chat", handleCustomOpen);
    return () => {
      window.removeEventListener("open-nora-chat", handleCustomOpen);
    };
  }, []);

  const handleDismissPill = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPill(false);
    sessionStorage.setItem("nora_pill_dismissed", "true");
  };

  if (isExcludedPage) {
    return null;
  }

  return (
    <>
      {/* Ventana de Chat de Nora (Solo se abre por clic explícito) */}
      <NoraChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextData={{ mode: "asistencia_amigable", pathname }}
      />

      {/* Solapita Flotante Discreta y Elegante - Unificada en bottom-6 right-6 */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-row-reverse items-center gap-3 group">
          
          {/* Botón Circular Único con Avatar */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 shadow-2xl shadow-purple-950/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden border-2 border-white/50 cursor-pointer shrink-0"
            title="¿Buscás trabajo, alquiler o publicar en Ituzaingó? Hablá con Nora"
            aria-label="Abrir asistente virtual Nora"
          >
            <img 
              src="/nora-avatar.jpg?v=2" 
              alt="Nora" 
              className="w-full h-full object-cover rounded-full" 
              onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
              }} 
            />
            {/* Punto verde de disponible */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse"></span>
          </button>

          {/* Solapa / Píldora de Anuncio Cordial (No Intrusiva, a la izquierda del botón) */}
          {showPill && (
            <div 
              onClick={() => setIsChatOpen(true)}
              className="hidden sm:flex items-center gap-2.5 bg-slate-950/95 hover:bg-slate-900 border border-amber-500/30 hover:border-amber-400/50 py-2 px-3.5 rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer transition-all animate-in fade-in slide-in-from-right-4 duration-300 max-w-xs"
            >
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black text-amber-400 flex items-center gap-1 leading-tight">
                  <Sparkles size={11} className="text-amber-400" />
                  <span>Hola, soy Nora 👋</span>
                </span>
                <span className="text-xs text-slate-200 font-medium leading-tight mt-0.5">
                  ¿Buscás trabajo, alquileres o noticias? Te ayudo en 1 clic.
                </span>
              </div>

              {/* Botón X para ocultar la solapa y dejar solo el icono */}
              <button
                type="button"
                onClick={handleDismissPill}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-full hover:bg-slate-800 transition-colors ml-1"
                title="Ocultar mensaje"
                aria-label="Cerrar solapa"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
