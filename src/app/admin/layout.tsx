"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
        setLoading(false);
        return;
      }

      // Fetch user profile role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
      }

      setLoading(false);
    }
    
    checkAuth();
  }, [router, pathname, supabase]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--color-brand-bg)] text-white">Cargando Panel...</div>;
  }

  // If we are on the login page, don't show the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-brand-text)]">
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Admin</h2>
          <p className="text-xs text-white/50 mt-1 uppercase">Rol: {userRole}</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link href="/admin" className={`px-4 py-2 rounded-lg text-sm transition-colors ${pathname === '/admin' ? 'bg-[var(--color-brand-accent)] text-black font-bold' : 'hover:bg-white/10'}`}>
            Resumen
          </Link>
          <Link href="/admin/news" className={`px-4 py-2 rounded-lg text-sm transition-colors ${pathname.includes('/admin/news') ? 'bg-[var(--color-brand-accent)] text-black font-bold' : 'hover:bg-white/10'}`}>
            Prensa & Noticias
          </Link>
          {(userRole === 'admin' || userRole === 'operator') && (
            <>
              <Link href="/admin/store" className={`px-4 py-2 rounded-lg text-sm transition-colors ${pathname.includes('/admin/store') ? 'bg-[var(--color-brand-accent)] text-black font-bold' : 'hover:bg-white/10'}`}>
                Tienda / Productos
              </Link>
              <Link href="/admin/streaming" className={`px-4 py-2 rounded-lg text-sm transition-colors ${pathname.includes('/admin/streaming') ? 'bg-[var(--color-brand-accent)] text-black font-bold' : 'hover:bg-white/10'}`}>
                Streaming / Videos
              </Link>
            </>
          )}
          {userRole === 'admin' && (
            <Link href="/admin/accounting" className={`px-4 py-2 rounded-lg text-sm transition-colors ${pathname.includes('/admin/accounting') ? 'bg-[var(--color-brand-accent)] text-black font-bold' : 'hover:bg-white/10'}`}>
              Contabilidad
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/admin/login");
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="glass-panel p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
