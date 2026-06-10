import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffRole } from "./actions";
import LogoutButton from "./LogoutButton"; // We will create this client component
import GoBackButton from "./GoBackButton"; // Go back button component
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - Nexativa",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexativa Admin",
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userRole = await getStaffRole();

  if (!userRole) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-brand-text)]">
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex border border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Admin</h2>
            <p className="text-xs text-white/50 mt-1 uppercase">Rol: {userRole || 'Invitado'}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link href="/admin" className={`px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10`}>
            Resumen
          </Link>
          <Link href="/admin/news" className={`px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10`}>
            Prensa & Noticias
          </Link>
          {(userRole === 'admin' || userRole === 'operator') && (
            <>
              <Link href="/admin/store" className={`px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10`}>
                Tienda / Productos
              </Link>
              <Link href="/admin/streaming" className={`px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10`}>
                Streaming / Videos
              </Link>
              <Link href="/admin/sponsors" className={`px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10`}>
                Auspiciantes & Stats
              </Link>
              <Link href="/admin/settings" className={`px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10`}>
                Redes Sociales
              </Link>
            </>
          )}
          {userRole === 'admin' && (
            <>
              <Link href="/admin/accounting" className={`px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10`}>
                Contabilidad
              </Link>
              <Link href="/admin/staff" className={`px-4 py-2 rounded-lg text-sm transition-colors text-[var(--color-brand-accent)] font-bold hover:bg-white/10`}>
                Gestión de Personal
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <GoBackButton />
        <div className="glass-panel p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
