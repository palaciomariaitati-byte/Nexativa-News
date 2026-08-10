"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, BarChart3, Wrench, Newspaper, TrendingUp, Settings } from "lucide-react";

interface AdminSidebarProps {
  userRole: string;
}

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  // Estados de expansión de cada sector (por defecto iniciamos con SERVICIOS y PERIODISMO desplegados)
  const [openSectors, setOpenSectors] = useState<Record<string, boolean>>({
    servicios: true,
    periodismo: true,
    crecimiento: false,
    comercio: false,
  });

  const toggleSector = (sectorKey: string) => {
    setOpenSectors((prev) => ({
      ...prev,
      [sectorKey]: !prev[sectorKey],
    }));
  };

  return (
    <nav className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto hide-scrollbar font-sans text-xs">
      
      {/* Botón Resumen General */}
      <Link
        href="/admin"
        className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
          pathname === "/admin"
            ? "bg-[var(--color-brand-accent)] text-black shadow-lg"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span>📊 Resumen General</span>
      </Link>

      {/* SECTOR 1: SERVICIOS & COMUNIDAD */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
        <button
          type="button"
          onClick={() => toggleSector("servicios")}
          className="w-full px-3 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-rose-300 font-extrabold flex items-center justify-between transition-colors uppercase tracking-wider text-[11px]"
        >
          <span className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-rose-400" />
            <span>🛠️ SERVICIOS</span>
          </span>
          {openSectors.servicios ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSectors.servicios && (
          <div className="p-2 space-y-1 bg-slate-950/40 animate-in fade-in duration-200">
            <Link
              href="/admin/inmuebles"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                pathname.startsWith("/admin/inmuebles")
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-rose-300/80 hover:bg-white/10"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              🏠 Inmuebles Verificados
            </Link>

            <Link
              href="/admin/jobs"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                pathname.startsWith("/admin/jobs")
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-emerald-400/80 hover:bg-white/10"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              💼 Empleos & Oficios
            </Link>

            <Link
              href="/admin/press"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                pathname.startsWith("/admin/press")
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-cyan-300/80 hover:bg-white/10"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              📖 Guía Comercial & Prensa
            </Link>

            <Link
              href="/admin/culture"
              className={`px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 block transition-colors ${
                pathname.startsWith("/admin/culture") ? "bg-white/10 font-bold" : ""
              }`}
            >
              🎨 Espacio Cultural
            </Link>
          </div>
        )}
      </div>

      {/* SECTOR 2: PERIODISMO & NOTICIAS */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
        <button
          type="button"
          onClick={() => toggleSector("periodismo")}
          className="w-full px-3 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-red-300 font-extrabold flex items-center justify-between transition-colors uppercase tracking-wider text-[11px]"
        >
          <span className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-red-400" />
            <span>📰 PERIODISMO</span>
          </span>
          {openSectors.periodismo ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSectors.periodismo && (
          <div className="p-2 space-y-1 bg-slate-950/40 animate-in fade-in duration-200">
            <Link
              href="/admin/news"
              className={`px-3 py-1.5 rounded-lg text-slate-200 hover:bg-white/10 block font-semibold transition-colors ${
                pathname === "/admin/news" ? "bg-white/10 font-bold" : ""
              }`}
            >
              Prensa & Noticias
            </Link>

            <Link
              href="/admin/news/live"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                pathname.startsWith("/admin/news/live")
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : "text-red-400 hover:bg-white/10"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Nora Live Editor
            </Link>

            <Link
              href="/admin/news/flashes"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                pathname.startsWith("/admin/news/flashes")
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : "text-red-300 hover:bg-white/10"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              Flash Noticioso
            </Link>

            <Link
              href="/admin/news/clipper"
              className={`px-3 py-1.5 rounded-lg text-purple-300 font-bold hover:bg-white/10 block transition-colors ${
                pathname.startsWith("/admin/news/clipper") ? "bg-purple-500/20" : ""
              }`}
            >
              Nora Auto-Clipper Pro
            </Link>

            <Link
              href="/admin/news/corresponsal"
              className={`px-3 py-1.5 rounded-lg text-amber-300 font-bold hover:bg-white/10 block transition-colors ${
                pathname.startsWith("/admin/news/corresponsal") ? "bg-amber-500/20" : ""
              }`}
            >
              Cola Corresponsal
            </Link>

            <Link
              href="/admin/news/qr"
              className={`px-3 py-1.5 rounded-lg text-emerald-300 font-bold hover:bg-white/10 block transition-colors ${
                pathname.startsWith("/admin/news/qr") ? "bg-emerald-500/20" : ""
              }`}
            >
              📱 QR Ciudadano
            </Link>
          </div>
        )}
      </div>

      {/* SECTOR 3: CRECIMIENTO & MARKETING */}
      {(userRole === "admin" || userRole === "operator") && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          <button
            type="button"
            onClick={() => toggleSector("crecimiento")}
            className="w-full px-3 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-indigo-300 font-extrabold flex items-center justify-between transition-colors uppercase tracking-wider text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>📈 CRECIMIENTO & IA</span>
            </span>
            {openSectors.crecimiento ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSectors.crecimiento && (
            <div className="p-2 space-y-1 bg-slate-950/40 animate-in fade-in duration-200">
              <Link
                href="/admin/valen"
                className={`px-3 py-1.5 rounded-lg text-indigo-300 font-bold hover:bg-indigo-500/20 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 transition-colors ${
                  pathname.startsWith("/admin/valen") ? "bg-indigo-500/30" : ""
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                🌐 VALEN (Growth CEO)
              </Link>

              <Link
                href="/admin/marketing"
                className={`px-3 py-1.5 rounded-lg text-amber-300 font-bold hover:bg-white/10 block transition-colors ${
                  pathname.startsWith("/admin/marketing") ? "bg-white/10" : ""
                }`}
              >
                🚀 Marketing & Ads
              </Link>

              <Link
                href="/admin/sponsors"
                className={`px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 block transition-colors ${
                  pathname.startsWith("/admin/sponsors") ? "bg-white/10 font-bold" : ""
                }`}
              >
                📢 Auspiciantes & Stats
              </Link>

              <Link
                href="/admin/streaming"
                className={`px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 block transition-colors ${
                  pathname.startsWith("/admin/streaming") ? "bg-white/10 font-bold" : ""
                }`}
              >
                📺 Streaming & Videos
              </Link>
            </div>
          )}
        </div>
      )}

      {/* SECTOR 4: COMERCIO & AJUSTES */}
      {(userRole === "admin" || userRole === "operator") && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          <button
            type="button"
            onClick={() => toggleSector("comercio")}
            className="w-full px-3 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-cyan-300 font-extrabold flex items-center justify-between transition-colors uppercase tracking-wider text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>⚙️ COMERCIO & GESTIÓN</span>
            </span>
            {openSectors.comercio ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSectors.comercio && (
            <div className="p-2 space-y-1 bg-slate-950/40 animate-in fade-in duration-200">
              <Link
                href="/admin/store"
                className={`px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 block transition-colors ${
                  pathname.startsWith("/admin/store") ? "bg-white/10 font-bold" : ""
                }`}
              >
                🛍️ Tienda / Productos
              </Link>

              <Link
                href="/admin/settings"
                className={`px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 block transition-colors ${
                  pathname.startsWith("/admin/settings") ? "bg-white/10 font-bold" : ""
                }`}
              >
                ⚙️ Redes Sociales
              </Link>

              {userRole === "admin" && (
                <>
                  <Link
                    href="/admin/accounting"
                    className={`px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 block transition-colors ${
                      pathname.startsWith("/admin/accounting") ? "bg-white/10 font-bold" : ""
                    }`}
                  >
                    📊 Contabilidad
                  </Link>

                  <Link
                    href="/admin/staff"
                    className={`px-3 py-1.5 rounded-lg text-amber-400 font-bold hover:bg-white/10 block transition-colors ${
                      pathname.startsWith("/admin/staff") ? "bg-white/10" : ""
                    }`}
                  >
                    👥 Gestión de Personal
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
