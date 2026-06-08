"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp, Building2, Map, UtensilsCrossed, Briefcase } from "lucide-react";
import { usePathname } from "next/navigation";

export default function FloatingShortcuts() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <div className="fixed left-6 bottom-6 flex flex-col gap-3 z-50">
      {/* Scroll to Top Button (Right side conceptually, but we can put it on the right) */}
      <button
        onClick={scrollToTop}
        className={`fixed right-6 bottom-6 p-4 bg-[var(--color-brand-accent)] text-black rounded-full shadow-lg hover:bg-white transition-all transform ${
          showScrollTop ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
        aria-label="Volver arriba"
      >
        <ArrowUp className="w-6 h-6 font-bold" />
      </button>

      {/* Floating Category Shortcuts (Left side) */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => scrollToSection("cat-hoteleria")}
          className="flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl hover:bg-[var(--color-brand-accent)] hover:text-black hover:scale-105 transition-all text-white group shadow-lg"
        >
          <Building2 className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
          <span className="font-semibold text-sm">Hotelería</span>
        </button>
        <button
          onClick={() => scrollToSection("cat-turismo")}
          className="flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl hover:bg-[var(--color-brand-accent)] hover:text-black hover:scale-105 transition-all text-white group shadow-lg"
        >
          <Map className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
          <span className="font-semibold text-sm">Turismo</span>
        </button>
        <button
          onClick={() => scrollToSection("cat-gastronomia")}
          className="flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl hover:bg-[var(--color-brand-accent)] hover:text-black hover:scale-105 transition-all text-white group shadow-lg"
        >
          <UtensilsCrossed className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
          <span className="font-semibold text-sm">Gastronomía</span>
        </button>
        <button
          onClick={() => scrollToSection("cat-servicios")}
          className="flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl hover:bg-[var(--color-brand-accent)] hover:text-black hover:scale-105 transition-all text-white group shadow-lg"
        >
          <Briefcase className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
          <span className="font-semibold text-sm">Servicios</span>
        </button>
      </div>
    </div>
  );
}
