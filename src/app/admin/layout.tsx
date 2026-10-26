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
    <div className="flex min-h-screen bg-[#090f15] text-[#e2e8f0] relative font-sans">
      <RealtimeAlertListener />
      {/* Sidebar Colapsable en Acordeón Sovereign */}
      <aside className="w-64 bg-[#0c1219] m-3 rounded-2xl flex flex-col hidden md:flex border border-[#1e2633] shrink-0 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[#1e2633] flex items-center justify-between bg-[#0e1520]">
          <div>
            <h2
              className="text-sm font-black font-serif text-[#e5b242] tracking-wider uppercase"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              ADMIN PANEL
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                ROL: <span className="text-amber-400 font-bold">{userRole || 'Invitado'}</span>
              </p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            SYNC OK
          </span>
        </div>

        {/* Componente Interactivo de Categorías Desplegables */}
        <AdminSidebar userRole={userRole} />

        <div className="p-3 border-t border-[#1e2633] bg-[#0c1219]">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-3 md:p-6 overflow-y-auto">
        {/* Mobile Top Bar */}
        <div className="flex md:hidden items-center justify-between p-3.5 bg-[#0c1219] border border-[#1e2633] rounded-xl mb-4 shadow-lg">
          <div>
            <h2
              className="text-sm font-bold font-serif text-[#e5b242] tracking-wider uppercase"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              NEXATIVA ADMIN
            </h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase">
              ROL: <span className="text-amber-400">{userRole || 'Invitado'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/news/corresponsal"
              className="text-xs text-amber-400 font-bold hover:text-white transition-colors bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded"
            >
              Cola
            </Link>
            <div className="w-24">
              <LogoutButton />
            </div>
          </div>
        </div>

        <GoBackButton />
        <div className="bg-[#0b1017] border border-[#1e2633] rounded-2xl p-4 md:p-8 min-h-[calc(100vh-5rem)] shadow-2xl">
          {children}
        </div>
      </main>

      {/* Copiloto & Asistente Instructor Master del Dashboard */}
      <NoraAdminCopilot />
    </div>
  );
}
