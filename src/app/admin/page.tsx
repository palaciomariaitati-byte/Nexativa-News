import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffRole } from "./actions";

export default async function AdminOverviewPage() {
  const role = await getStaffRole();
  if (!role) {
    redirect("/admin/login");
  }

  // Ahora podemos quitar useState y useEffect porque esto ya es un componente de servidor
  // Y en lugar de buscar el perfil completo en Supabase (que era del login viejo),
  // simplemente usamos el rol de la cookie.

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Bienvenido al Panel</h1>
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <p className="text-lg">Hola.</p>
        <p className="text-sm text-white/50 mt-2">Tu rol actual es: <span className="uppercase text-[var(--color-brand-accent)]">{role}</span></p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/news" className="bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 p-4 rounded-lg transition-all block">
            <h3 className="font-bold mb-2">Prensa & Noticias</h3>
            <p className="text-sm text-white/70">Redacta y publica nuevos artículos para el portal. (Todos los roles)</p>
          </Link>
          <Link href="/admin/culture" className="bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 p-4 rounded-lg transition-all block">
            <h3 className="font-bold mb-2">Espacio Cultural</h3>
            <p className="text-sm text-white/70">Gestiona los artículos de arte, cultura e historia local. (Todos los roles)</p>
          </Link>
          {(role === 'admin' || role === 'operator') && (
            <>
              <Link href="/admin/store" className="bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 p-4 rounded-lg transition-all block">
                <h3 className="font-bold mb-2">Tienda / Productos</h3>
                <p className="text-sm text-white/70">Gestiona los productos del e-commerce y el stock. (Operador, Admin)</p>
              </Link>
              <Link href="/admin/streaming" className="bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 p-4 rounded-lg transition-all block">
                <h3 className="font-bold mb-2">Streaming</h3>
                <p className="text-sm text-white/70">Configura la cola de videos de reproducción continua. (Operador, Admin)</p>
              </Link>
              <Link href="/admin/sponsors" className="bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 p-4 rounded-lg transition-all block">
                <h3 className="font-bold mb-2">Auspiciantes & Stats</h3>
                <p className="text-sm text-white/70">Gestiona clientes, comercios y visualiza estadísticas. (Operador, Admin)</p>
              </Link>
              <Link href="/admin/marketing" className="bg-black/20 hover:bg-black/40 border border-transparent hover:border-[var(--color-brand-accent)]/50 p-4 rounded-lg transition-all block">
                <h3 className="font-bold mb-2 text-[var(--color-brand-accent)]">Marketing & Ads</h3>
                <p className="text-sm text-white/70">Usa la IA de Nexativa para generar copys, campañas y avisos virales. (Operador, Admin)</p>
              </Link>
              <Link href="/admin/settings" className="bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 p-4 rounded-lg transition-all block">
                <h3 className="font-bold mb-2">Redes Sociales</h3>
                <p className="text-sm text-white/70">Configura links de redes, número de WhatsApp e integraciones. (Operador, Admin)</p>
              </Link>
            </>
          )}
          {role === 'admin' && (
            <>
              <Link href="/admin/accounting" className="bg-black/20 hover:bg-black/40 border border-[var(--color-brand-accent)]/30 hover:border-[var(--color-brand-accent)] p-4 rounded-lg transition-all block">
                <h3 className="font-bold mb-2 text-[var(--color-brand-accent)]">Contabilidad</h3>
                <p className="text-sm text-white/70">Libro contable de ingresos, egresos y flujos de caja. (Solo Admin)</p>
              </Link>
              <Link href="/admin/staff" className="bg-black/20 hover:bg-black/40 border border-[var(--color-brand-accent)]/30 hover:border-[var(--color-brand-accent)] p-4 rounded-lg transition-all block">
                <h3 className="font-bold mb-2 text-[var(--color-brand-accent)]">Gestión de Personal</h3>
                <p className="text-sm text-white/70">Crea, edita o elimina cuentas de usuarios operadores o administradores. (Solo Admin)</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
