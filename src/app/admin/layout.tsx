import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffRole } from "./actions";
import LogoutButton from "./LogoutButton"; // We will create this client component
import GoBackButton from "./GoBackButton"; // Go back button component
import RealtimeAlertListener from "@/components/RealtimeAlertListener";
import AdminSidebar from "@/components/Admin/AdminSidebar";
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

import NoraAdminCopilot from "@/components/Nora/NoraAdminCopilot";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userRole = await getStaffRole();

  if (!userRole) {
    return (
      <>
        <RealtimeAlertListener />
        {children}
        <NoraAdminCopilot />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-brand-text)] relative">
      <RealtimeAlertListener />
      {/* Sidebar Colapsable en Acordeón */}
      <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex border border-white/10 shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Admin Panel</h2>
            <p className="text-[10px] text-white/50 uppercase">Rol: {userRole || 'Invitado'}</p>
          </div>
        </div>

        {/* Componente Interactivo de Categorías Desplegables */}
        <AdminSidebar userRole={userRole} />

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

      {/* Copiloto & Asistente Instructor Master del Dashboard */}
      <NoraAdminCopilot />
    </div>
  );
}
