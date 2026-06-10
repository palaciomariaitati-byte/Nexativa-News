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
          {/* Logo and Mobile Admin Button */}
          <div className="flex-1 flex items-center justify-between sm:justify-start">
            <Link href="/" className="text-3xl font-serif font-bold tracking-widest text-[var(--color-brand-accent)]">
              NEXATIVA<span className="text-white font-light">NEWS</span>
            </Link>
            {/* Mobile Admin Icon */}
            {session && (
              <Link href="/admin" className="sm:hidden p-2 text-[var(--color-brand-accent)] bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </Link>
            )}
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
