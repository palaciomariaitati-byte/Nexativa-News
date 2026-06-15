"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  async function fetchCampaigns() {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setCampaigns(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta campaña?")) {
      const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
      if (!error) {
        setCampaigns(campaigns.filter(c => c.id !== id));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Marketing & Ads</h1>
          <p className="text-white/50 text-sm mt-1">Gestiona las campañas y publicidades de tus clientes</p>
        </div>
        <Link href="/admin/marketing/editor" className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors">
          + Nueva Campaña
        </Link>
      </div>

      <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/50">Cargando campañas...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-white/50">No hay campañas activas. ¡Crea el primer anuncio para un cliente!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Cliente</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Campaña</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Estado</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Redes</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{campaign.client_name}</p>
                    </td>
                    <td className="p-4 text-sm text-white/80">{campaign.campaign_name}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${campaign.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                        {campaign.status === 'active' ? 'Activo' : 'Borrador'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {campaign.social_published ? (
                        <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full font-bold">Publicado</span>
                      ) : (
                        <span className="text-xs text-white/30">Pendiente</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <Link href={`/admin/marketing/editor?id=${campaign.id}`} className="text-[var(--color-brand-accent)] hover:text-white transition-colors text-sm uppercase tracking-wider font-bold">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(campaign.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase tracking-wider font-bold">
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
