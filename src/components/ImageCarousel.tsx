"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import ImageLightbox from "./ImageLightbox";

interface ImageCarouselProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  imageClassName?: string;
}

export default function ImageCarousel({ images, autoPlay = true, interval = 3000, className = "", imageClassName = "" }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const validImages = images.filter(img => img && img.trim() !== "");

  useEffect(() => {
    if (!autoPlay || validImages.length <= 1 || isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, validImages.length, isHovered, interval]);

  if (validImages.length === 0) {
    return <div className={`w-full h-full bg-white/5 flex items-center justify-center text-gray-500 ${className}`}>Sin img</div>;
  }

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % validImages.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);

  return (
    <>
      <div 
        className={`relative overflow-hidden group/carousel ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className="w-full h-full cursor-pointer relative"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Image 
            src={validImages[currentIndex]} 
            alt={`Imagen ${currentIndex + 1}`} 
            fill 
            className={`object-cover transition-transform duration-500 group-hover/carousel:scale-110 ${imageClassName}`} 
          />
          <div className="absolute inset-0 bg-black/0 group-hover/carousel:bg-black/20 transition-colors flex items-center justify-center">
            <span className="text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm shadow-xl flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              Ampliar
            </span>
          </div>
        </div>

        {validImages.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[var(--color-brand-accent)] hover:text-black text-white p-1 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-all z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[var(--color-brand-accent)] hover:text-black text-white p-1 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-all z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {validImages.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? "bg-[var(--color-brand-accent)]" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <ImageLightbox 
        images={validImages}
        currentIndex={currentIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </>
  );
}
