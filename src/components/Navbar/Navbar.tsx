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
      <nav className="sticky top-0 z-50 glass-panel rounded-none border-t-0 border-x-0 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-1 flex items-center justify-between sm:justify-start">
            <Link href="/" className="text-2xl sm:text-3xl font-serif font-bold tracking-widest text-[var(--color-brand-accent)]">
              NEXATIVA<span className="text-white font-light">NEWS</span>
            </Link>
          </div>

          {/* Navigation links (Desktop) */}
          <div className="hidden lg:flex items-center space-x-6">
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
            <Link href="/empleos" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/empleos"
              className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Empleos
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/80 hover:text-white bg-white/5 rounded-xl border border-white/10"
              aria-label="Abrir Menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-pink-400" /> : <Menu className="w-6 h-6 text-[var(--color-brand-accent)]" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl p-4 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 font-sans text-xs">
              <Link
                href="/guia"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-cyan-300 font-bold flex items-center gap-2"
              >
                <StoreIcon className="w-4 h-4 text-cyan-400" /> Guía Comercial
              </Link>

              <Link
                href="/empleos"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-emerald-400" /> Empleos & Oficios
              </Link>

              <Link
                href="/prestadores"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-emerald-900/30 border border-emerald-600/30 rounded-xl text-emerald-200 font-semibold flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" /> Panel Prestador
              </Link>

              <Link
                href="/news"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold flex items-center gap-2"
              >
                <Newspaper className="w-4 h-4 text-amber-400" /> Noticias
              </Link>

              <Link
                href="/clasico"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-orange-200 font-semibold flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-orange-400" /> Edición Clásica
              </Link>

              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-pink-400" /> Shop / Productos
              </Link>
            </div>

            {session && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-3 bg-[var(--color-brand-accent)] text-black font-bold text-xs uppercase tracking-widest rounded-xl"
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
