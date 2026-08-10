import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffRole } from "./actions";

export const revalidate = 0; // Disable static caching

export default async function AdminOverviewPage() {
  const role = await getStaffRole();
  if (!role) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Centro de Control General • Nexativa Admin
        </h1>
        <p className="text-xs text-white/50 mt-1 uppercase">
          Rol asignado: <span className="text-[var(--color-brand-accent)] font-bold">{role}</span>
        </p>
      </div>

      {/* SECTOR 1: SERVICIOS Y COMUNIDAD */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-rose-500/30 pb-2">
          <span className="text-base font-black text-rose-400 uppercase tracking-wider">
            🛠️ SERVICIOS & COMUNIDAD
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/inmuebles" className="bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/40 hover:border-rose-400 p-4 rounded-xl transition-all block shadow-lg">
            <h3 className="font-extrabold mb-1 text-rose-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              🏠 Inmuebles Verificados
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supervisión de alquileres, marcas de estado (Disponible/Ocupado/En Mantenimiento) y sanciones.
            </p>
          </Link>

          <Link href="/admin/jobs" className="bg-emerald-950/20 hover:bg-emerald-900/40 border border-emerald-500/30 hover:border-emerald-500 p-4 rounded-xl transition-all block">
            <h3 className="font-extrabold mb-1 text-emerald-400 text-sm">💼 Empleos & Oficios (NoraScore)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">Gestión de postulantes, búsquedas laborales, calificaciones y certificados.</p>
          </Link>

          <Link href="/admin/press" className="bg-cyan-950/20 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400 p-4 rounded-xl transition-all block">
            <h3 className="font-extrabold mb-1 text-cyan-300 text-sm">📖 Guía Comercial & Páginas Amarillas</h3>
            <p className="text-xs text-slate-300 leading-relaxed">Directorio geolocalizado, comercios adheridos y comunicados de prensa.</p>
          </Link>
        </div>
      </div>

      {/* SECTOR 2: PERIODISMO Y NOTICIAS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-red-500/30 pb-2">
          <span className="text-base font-black text-red-400 uppercase tracking-wider">
            📰 PERIODISMO & COBERTURAS
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/news" className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 p-4 rounded-xl transition-all block">
            <h3 className="font-extrabold mb-1 text-white text-sm">Redacción de Noticias</h3>
            <p className="text-xs text-slate-400">Redactá y publicá artículos periodísticos en el portal principal.</p>
          </Link>

          <Link href="/admin/news/live" className="bg-red-950/30 hover:bg-red-900/50 border border-red-500/40 p-4 rounded-xl transition-all block">
            <h3 className="font-extrabold mb-1 text-red-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Nora Live Editor
            </h3>
            <p className="text-xs text-slate-300">Editor móvil de asistencia periodística en vivo para corresponsales.</p>
          </Link>

          <Link href="/admin/news/flashes" className="bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/40 p-4 rounded-xl transition-all block">
            <h3 className="font-extrabold mb-1 text-red-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Flash Noticioso (1-5 min)
            </h3>
            <p className="text-xs text-slate-300">Emisión de noticieros en síntesis generados por Nora Clipper.</p>
          </Link>
        </div>
      </div>

      {/* SECTOR 3: CRECIMIENTO & MARKETING */}
      {(role === 'admin' || role === 'operator') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-indigo-500/30 pb-2">
            <span className="text-base font-black text-indigo-400 uppercase tracking-wider">
              📈 CRECIMIENTO & MARKETING (GROWTH)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/valen" className="bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-500/40 p-4 rounded-xl transition-all block shadow-lg">
              <h3 className="font-extrabold mb-1 text-indigo-300 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                🌐 VALEN — Growth Executive CEO
              </h3>
              <p className="text-xs text-slate-300">Motor de escaneo en redes, prospectación B2B y captación de clientes.</p>
            </Link>

            <Link href="/admin/marketing" className="bg-black/40 hover:bg-black/60 border border-white/10 p-4 rounded-xl transition-all block">
              <h3 className="font-extrabold mb-1 text-[var(--color-brand-accent)] text-sm">Marketing & Ads AI</h3>
              <p className="text-xs text-slate-400">Generación de campañas publicitarias y avisos virales con IA.</p>
            </Link>

            <Link href="/admin/sponsors" className="bg-black/40 hover:bg-black/60 border border-white/10 p-4 rounded-xl transition-all block">
              <h3 className="font-extrabold mb-1 text-white text-sm">Auspiciantes & Stats</h3>
              <p className="text-xs text-slate-400">Métricas de sponsors, impresiones de anuncios y anunciantes.</p>
            </Link>
          </div>
        </div>
      )}

      {/* SECTOR 4: COMERCIO & FINANZAS */}
      {(role === 'admin' || role === 'operator') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
            <span className="text-base font-black text-cyan-400 uppercase tracking-wider">
              ⚙️ COMERCIO & FINANZAS
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/store" className="bg-black/40 hover:bg-black/60 border border-white/10 p-4 rounded-xl transition-all block">
              <h3 className="font-extrabold mb-1 text-white text-sm">🛍️ Tienda / Productos</h3>
              <p className="text-xs text-slate-400">Administración de e-commerce, stock y catálogo.</p>
            </Link>

            {role === 'admin' && (
              <>
                <Link href="/admin/accounting" className="bg-black/40 hover:bg-black/60 border border-white/10 p-4 rounded-xl transition-all block">
                  <h3 className="font-extrabold mb-1 text-amber-400 text-sm">📊 Contabilidad & Finanzas</h3>
                  <p className="text-xs text-slate-400">Libro contable, registro de ingresos/egresos y flujo de caja.</p>
                </Link>

                <Link href="/admin/staff" className="bg-black/40 hover:bg-black/60 border border-white/10 p-4 rounded-xl transition-all block">
                  <h3 className="font-extrabold mb-1 text-rose-400 text-sm">👥 Gestión de Personal</h3>
                  <p className="text-xs text-slate-400">Alta y administración de cuentas de equipo y roles.</p>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
