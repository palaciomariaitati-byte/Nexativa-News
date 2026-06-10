"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
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



  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <button
        onClick={scrollToTop}
        className={`p-4 bg-[var(--color-brand-accent)] text-black rounded-full shadow-lg hover:bg-white transition-all transform ${
          showScrollTop ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
        aria-label="Volver arriba"
      >
        <ArrowUp className="w-6 h-6 font-bold" />
      </button>
    </div>
  );
}
