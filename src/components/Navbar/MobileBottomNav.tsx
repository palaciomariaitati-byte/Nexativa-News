"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Briefcase, Store, UserCheck } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login") || pathname?.startsWith("/noraitu") || pathname?.startsWith("/clasico")) {
    return null;
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 flex justify-around items-center h-16 pb-safe px-1 bg-slate-950/95 backdrop-blur-xl">
      <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/" ? "text-[var(--color-brand-accent)] font-bold" : "text-gray-400 hover:text-white transition-colors"}`}>
        <Home className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Inicio</span>
      </Link>

      <Link href="/news" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/news" ? "text-[var(--color-brand-accent)] font-bold" : "text-gray-400 hover:text-white transition-colors"}`}>
        <Newspaper className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Noticias</span>
      </Link>

      <Link href="/guia" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/guia" ? "text-cyan-400 font-bold" : "text-cyan-300/70 hover:text-cyan-300 transition-colors"}`}>
        <Store className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Guía</span>
      </Link>

      <Link href="/empleos" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/empleos" ? "text-emerald-400 font-bold" : "text-emerald-300/70 hover:text-emerald-300 transition-colors"}`}>
        <Briefcase className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Empleos</span>
      </Link>

      <Link href="/prestadores" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/prestadores" ? "text-amber-400 font-bold" : "text-amber-300/70 hover:text-amber-300 transition-colors"}`}>
        <UserCheck className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">Mi Panel</span>
      </Link>
    </div>
  );
}
