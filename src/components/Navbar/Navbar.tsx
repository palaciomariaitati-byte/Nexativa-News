"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Menu, X, Briefcase, Store as StoreIcon, Newspaper, BookOpen, Sparkles, UserCheck } from "lucide-react";

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 glass-panel rounded-none border-t-0 border-x-0 border-b border-white/10 bg-slate-950/95 backdrop-blur-md w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-serif font-bold tracking-widest text-[var(--color-brand-accent)] shrink-0">
            NEXATIVA<span className="text-white font-light">NEWS</span>
          </Link>

          {/* Navigation links (Desktop: md:flex) */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link href="/" className="text-xs font-bold hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest">
              Inicio
            </Link>
            <Link href="/clasico" className="text-xs font-bold hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest text-orange-200">
              Edición Clásica
            </Link>
            <Link href="/news" className="text-xs font-bold hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest">
              Noticias
            </Link>
            <Link href="/cultura" className="text-xs font-bold hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest">
              Cultura
            </Link>
            <Link href="/guia" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest flex items-center gap-1.5 bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Guía Comercial
            </Link>
            <Link href="/guia/inmuebles" className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-widest flex items-center gap-1.5 bg-rose-950/40 px-3 py-1.5 rounded-full border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Inmuebles Verificados
            </Link>
            <Link href="/empleos" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Empleos & Oficios
            </Link>
            <Link href="/store" className="text-xs font-bold hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest">
              Shop
            </Link>
            {session && (
              <Link
                href="/admin"
                className="bg-[var(--color-brand-accent)] text-black font-bold text-xs px-4 py-2 rounded-full uppercase tracking-widest hover:bg-[var(--color-brand-accent-hover)] transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Menu Button (< 768px) */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3.5 py-2 text-amber-300 font-black text-xs bg-amber-500/20 hover:bg-amber-500/30 rounded-xl border border-amber-500/50 flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/10 shrink-0"
              aria-label="Abrir Menú Hamburguesa"
            >
              {mobileMenuOpen ? (
                <>
                  <X className="w-5 h-5 text-pink-400" />
                  <span className="tracking-wider">CERRAR</span>
                </>
              ) : (
                <>
                  <Menu className="w-5 h-5 text-amber-400" />
                  <span className="tracking-wider">MENÚ ☰</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/98 backdrop-blur-2xl p-4 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 font-sans text-xs">
              <Link
                href="/guia"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 bg-cyan-950/50 border border-cyan-500/40 rounded-xl text-cyan-300 font-bold flex items-center gap-2 text-xs"
              >
                <StoreIcon className="w-4 h-4 text-cyan-400" /> Guía Comercial
              </Link>

              <Link
                href="/guia/inmuebles"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 font-bold flex items-center gap-2 text-xs"
              >
                <StoreIcon className="w-4 h-4 text-rose-400" /> Inmuebles Verificados
              </Link>

              <Link
                href="/empleos"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold flex items-center gap-2 text-xs"
              >
                <Briefcase className="w-4 h-4 text-emerald-400" /> Empleos & Oficios
              </Link>

              <Link
                href="/prestadores"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 bg-emerald-900/40 border border-emerald-600/30 rounded-xl text-emerald-200 font-bold flex items-center gap-2 text-xs"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" /> Panel Prestador
              </Link>

              <Link
                href="/news"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold flex items-center gap-2 text-xs"
              >
                <Newspaper className="w-4 h-4 text-amber-400" /> Noticias
              </Link>

              <Link
                href="/clasico"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-orange-200 font-bold flex items-center gap-2 text-xs"
              >
                <BookOpen className="w-4 h-4 text-orange-400" /> Edición Clásica
              </Link>

              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold flex items-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4 text-pink-400" /> Shop / Productos
              </Link>
            </div>

            {session && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-3.5 bg-[var(--color-brand-accent)] text-black font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg"
              >
                Consola Admin
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
