/* src/components/Navbar/Navbar.tsx */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);

  // Detect auth state
  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase!.auth.onAuthStateChange((_event, session) => setSession(session));
    supabase!.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 glass-panel rounded-none border-t-0 border-x-0 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo centered */}
          <div className="flex-1 flex items-center">
            <Link href="/" className="text-3xl font-serif font-bold tracking-widest text-[var(--color-brand-accent)]">
              NEXATIVA<span className="text-white font-light">NEWS</span>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="hidden sm:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest">
              Inicio
            </Link>
            <Link href="/news" className="text-sm font-medium hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest">
              Noticias
            </Link>
            <Link href="/store" className="text-sm font-medium hover:text-[var(--color-brand-accent)] transition-colors uppercase tracking-widest">
              Shop
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className="bg-[var(--color-brand-accent)] text-black font-bold text-xs px-4 py-2 rounded-full uppercase tracking-widest hover:bg-[var(--color-brand-accent-hover)] transition-colors"
              >
                Panel
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
