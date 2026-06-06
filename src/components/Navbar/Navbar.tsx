/* src/components/Navbar/Navbar.tsx */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Navbar() {
  const [session, setSession] = useState<any>(null);

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
    <nav className="bg-white text-black border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo centered */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="text-2xl font-serif tracking-wider">
            Nexativa News
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex space-x-4">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>
          <Link href="/categorias" className="hover:underline">
            Categorías
          </Link>
          {session && (
            <Link
              href="/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
