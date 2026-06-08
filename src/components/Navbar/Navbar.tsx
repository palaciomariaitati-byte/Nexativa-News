/* src/components/Navbar/Navbar.tsx */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Navbar() {
  const [session, setSession] = useState<any>(null);
  const [sponsors, setSponsors] = useState<any[]>([]);

  // Detect auth state and fetch sponsors
  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase!.auth.onAuthStateChange((_event, session) => setSession(session));
    supabase!.auth.getSession().then(({ data: { session } }) => setSession(session));
    // Fetch sponsors (pro clients) for marquee
    supabase!
      .from("sponsors")
      .select("id, name, logo_url, is_pro")
      .then(({ data }) => {
        if (data) {
          // Include all sponsors in the marquee for visibility
          setSponsors(data);
        }
      });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Marquee of Pro Sponsors */}
      {sponsors.length > 0 && (
        <div className="bg-[var(--color-brand-accent)] text-black py-1.5 overflow-hidden whitespace-nowrap border-b border-yellow-600/50">
          <div className="flex items-center space-x-6 animate-marquee">
            {sponsors.map((s) => (
              <div key={s.id} className="flex items-center space-x-2 px-4">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} className="h-6 object-contain" />
                ) : (
                  <span className="text-sm font-bold uppercase tracking-widest">{s.name}</span>
                )}
                <span className="text-black/30 mx-2">•</span>
              </div>
            ))}
            {/* Duplicate for infinite effect */}
            {sponsors.map((s) => (
              <div key={s.id + "-clone"} className="flex items-center space-x-2 px-4">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} className="h-6 object-contain" />
                ) : (
                  <span className="text-sm font-bold uppercase tracking-widest">{s.name}</span>
                )}
                <span className="text-black/30 mx-2">•</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <nav className="sticky top-0 z-50 glass-panel rounded-none border-t-0 border-x-0 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo centered */}
          <div className="flex-1 flex items-center">
            <Link href="/" className="text-3xl font-serif font-bold tracking-widest text-[var(--color-brand-accent)]">
              NEXATIVA<span className="text-white font-light">NEWS</span>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="flex items-center space-x-6">
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
