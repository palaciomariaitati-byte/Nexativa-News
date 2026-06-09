import { redirect } from "next/navigation";
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
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Prensa & Noticias</h3>
            <p className="text-sm text-white/70">Redacta y publica nuevos artículos para el portal. (Todos los roles)</p>
          </div>
          {(role === 'admin' || role === 'operator') && (
            <>
              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Tienda</h3>
                <p className="text-sm text-white/70">Gestiona los productos del e-commerce y el stock. (Operador, Admin)</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Streaming</h3>
                <p className="text-sm text-white/70">Configura la cola de videos de reproducción continua. (Operador, Admin)</p>
              </div>
            </>
          )}
          {role === 'admin' && (
              <div className="bg-black/20 p-4 rounded-lg border border-[var(--color-brand-accent)]/30">
                <h3 className="font-bold mb-2 text-[var(--color-brand-accent)]">Contabilidad</h3>
                <p className="text-sm text-white/70">Acceso exclusivo al libro contable de ingresos y egresos. (Solo Admin)</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
