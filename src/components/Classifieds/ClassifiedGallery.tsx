"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

interface Props {
  images: string[];
  title: string;
}

export default function ClassifiedGallery({ images, title }: Props) {
  const safeImages = images && images.length > 0
    ? images
    : ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === "Escape") setIsLightboxOpen(false);
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, safeImages.length]);

  return (
    <div className="w-full space-y-3 select-none">
      {/* Visor Principal */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="group relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 cursor-pointer shadow-2xl"
      >
        <img
          src={safeImages[activeIndex]}
          alt={`${title} - Foto ${activeIndex + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
        />

        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

        {/* Botón Ampliar Pantalla Completa */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-white/80 hover:text-white hover:bg-slate-900 border border-slate-700/80 shadow-lg transition-all"
          title="Ver en pantalla completa"
        >
          <Maximize2 size={16} />
        </button>

        {/* Flechas de Navegación si hay más de 1 imagen */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 transition-all shadow-lg cursor-pointer"
              title="Foto anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 transition-all shadow-lg cursor-pointer"
              title="Foto siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Indicador de Foto */}
        <div className="absolute bottom-4 left-4 rounded-lg bg-slate-950/80 backdrop-blur-md px-3 py-1 text-xs font-mono font-bold text-white border border-slate-800 shadow-md">
          {activeIndex + 1} / {safeImages.length}
        </div>
      </div>

      {/* Tira de Miniaturas */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative shrink-0 w-20 sm:w-24 aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border transition-all cursor-pointer ${
                activeIndex === idx
                  ? "border-cyan-400 ring-2 ring-cyan-500/40 scale-102 shadow-lg"
                  : "border-slate-800 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Miniatura ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox a Pantalla Completa */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 shadow-xl cursor-pointer"
            title="Cerrar pantalla completa"
          >
            <X size={22} />
          </button>

          {/* Imagen Grande */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={safeImages[activeIndex]}
              alt={`${title} - Foto ${activeIndex + 1}`}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800/80"
            />

            {/* Flechas Lightbox */}
            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/90 text-white hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 transition-all shadow-xl cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/90 text-white hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 transition-all shadow-xl cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Contador Lightbox */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-400">
              Foto {activeIndex + 1} de {safeImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
