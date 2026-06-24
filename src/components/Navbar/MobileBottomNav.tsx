"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Store, PlayCircle, Palette, BookOpen } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
    return null;
  }

  const scrollToStream = () => {
    // If not on home page, maybe link to /?stream=true
    if (pathname !== "/") {
      window.location.href = "/#stream";
    } else {
      const streamEl = document.getElementById("stream-section");
      if (streamEl) {
        streamEl.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 flex justify-around items-center h-16 pb-safe px-1">
      <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/" ? "text-[var(--color-brand-accent)]" : "text-gray-400 hover:text-white transition-colors"}`}>
        <Home className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Inicio</span>
      </Link>
      <Link href="/news" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/news" ? "text-[var(--color-brand-accent)]" : "text-gray-400 hover:text-white transition-colors"}`}>
        <Newspaper className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Noticias</span>
      </Link>
      <Link href="/clasico" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/clasico" ? "text-[var(--color-brand-accent)]" : "text-orange-200 hover:text-white transition-colors"}`}>
        <BookOpen className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Clásico</span>
      </Link>
      <button onClick={scrollToStream} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-red-500 hover:text-red-400 transition-colors">
        <PlayCircle className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Vivo</span>
      </button>
      <Link href="/store" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/store" ? "text-[var(--color-brand-accent)]" : "text-gray-400 hover:text-white transition-colors"}`}>
        <Store className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Tienda</span>
      </Link>
    </div>
  );
}
