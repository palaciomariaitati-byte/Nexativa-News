import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffRole } from "./actions";
import LogoutButton from "./LogoutButton"; // We will create this client component
import GoBackButton from "./GoBackButton"; // Go back button component
import RealtimeAlertListener from "@/components/RealtimeAlertListener";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    return (
      <>
        <RealtimeAlertListener />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-brand-text)]">
      <RealtimeAlertListener />
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex border border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Admin</h2>
            <p className="text-xs text-white/50 mt-1 uppercase">Rol: {userRole || 'Invitado'}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto hide-scrollbar">
          <Link href="/admin" className="px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-colors">
            📊 Resumen General
          </Link>

          {/* SECTOR 1: SERVICIOS */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-2 mb-1">
              🛠️ SERVICIOS
            </p>
            <Link href="/admin/inmuebles" className="px-3 py-1.5 rounded-lg text-xs text-rose-300 font-bold hover:bg-white/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              🏠 Inmuebles Verificados
            </Link>
            <Link href="/admin/jobs" className="px-3 py-1.5 rounded-lg text-xs text-emerald-400 font-bold hover:bg-white/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              💼 Empleos & Oficios
            </Link>
            <Link href="/admin/press" className="px-3 py-1.5 rounded-lg text-xs text-cyan-300 font-bold hover:bg-white/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              📖 Guía Comercial & Prensa
            </Link>
            <Link href="/admin/culture" className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/10 block">
              🎨 Espacio Cultural
            </Link>
          </div>

          {/* SECTOR 2: PERIODISMO */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest px-2 mb-1">
              📰 PERIODISMO
            </p>
            <Link href="/admin/news" className="px-3 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 block font-semibold">
              Prensa & Noticias
            </Link>
            <Link href="/admin/news/live" className="px-3 py-1.5 rounded-lg text-xs text-red-400 font-bold hover:bg-white/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Nora Live Editor
            </Link>
            <Link href="/admin/news/flashes" className="px-3 py-1.5 rounded-lg text-xs text-red-300 font-bold hover:bg-white/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              Flash Noticioso
            </Link>
            <Link href="/admin/news/clipper" className="px-3 py-1.5 rounded-lg text-xs text-purple-300 font-bold hover:bg-white/10 flex items-center gap-2">
              Nora Auto-Clipper Pro
            </Link>
            <Link href="/admin/news/corresponsal" className="px-3 py-1.5 rounded-lg text-xs text-amber-300 font-bold hover:bg-white/10 flex items-center gap-2">
              Cola Corresponsal
            </Link>
            <Link href="/admin/news/qr" className="px-3 py-1.5 rounded-lg text-xs text-emerald-300 font-bold hover:bg-white/10 flex items-center gap-2">
              📱 QR Ciudadano
            </Link>
          </div>

          {/* SECTOR 3: CRECIMIENTO & MARKETING */}
          {(userRole === 'admin' || userRole === 'operator') && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2 mb-1">
                📈 CRECIMIENTO & IA
              </p>
              <Link href="/admin/valen" className="px-3 py-1.5 rounded-lg text-xs text-indigo-300 font-bold hover:bg-indigo-500/20 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                🌐 VALEN (Growth CEO)
              </Link>
              <Link href="/admin/marketing" className="px-3 py-1.5 rounded-lg text-xs text-amber-300 font-bold hover:bg-white/10 block">
                🚀 Marketing & Ads
              </Link>
              <Link href="/admin/sponsors" className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/10 block">
                📢 Auspiciantes & Stats
              </Link>
              <Link href="/admin/streaming" className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/10 block">
                📺 Streaming & Videos
              </Link>
            </div>
          )}

          {/* SECTOR 4: COMERCIO & AJUSTES */}
          {(userRole === 'admin' || userRole === 'operator') && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest px-2 mb-1">
                ⚙️ COMERCIO & GESTIÓN
              </p>
              <Link href="/admin/store" className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/10 block">
                🛍️ Tienda / Productos
              </Link>
              <Link href="/admin/settings" className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/10 block">
                ⚙️ Redes Sociales
              </Link>
              {userRole === 'admin' && (
                <>
                  <Link href="/admin/accounting" className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/10 block">
                    📊 Contabilidad
                  </Link>
                  <Link href="/admin/staff" className="px-3 py-1.5 rounded-lg text-xs text-amber-400 font-bold hover:bg-white/10 block">
                    👥 Gestión de Personal
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {/* Mobile Top Bar */}
        <div className="flex md:hidden items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl mb-4">
          <div>
            <h2 className="text-base font-bold font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Admin</h2>
            <p className="text-[10px] text-white/50 uppercase">Rol: {userRole || 'Invitado'}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/news/corresponsal" className="text-xs text-amber-500 font-bold hover:text-white transition-colors bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
              Cola
            </Link>
            <div className="w-24">
              <LogoutButton />
            </div>
          </div>
        </div>

        <GoBackButton />
        <div className="glass-panel p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
