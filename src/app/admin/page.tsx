"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
      }
    }
    fetchProfile();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Bienvenido al Panel</h1>
      {profile && (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <p className="text-lg">Hola, <span className="font-bold text-white">{profile.full_name || profile.username}</span>.</p>
          <p className="text-sm text-white/50 mt-2">Tu rol actual es: <span className="uppercase text-[var(--color-brand-accent)]">{profile.role}</span></p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Prensa & Noticias</h3>
              <p className="text-sm text-white/70">Redacta y publica nuevos artículos para el portal. (Todos los roles)</p>
            </div>
            {(profile.role === 'admin' || profile.role === 'operator') && (
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
            {profile.role === 'admin' && (
              <div className="bg-black/20 p-4 rounded-lg border border-[var(--color-brand-accent)]/30">
                <h3 className="font-bold mb-2 text-[var(--color-brand-accent)]">Contabilidad</h3>
                <p className="text-sm text-white/70">Acceso exclusivo al libro contable de ingresos y egresos. (Solo Admin)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
