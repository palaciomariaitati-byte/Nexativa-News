import React from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function AdminSponsorsPage() {
  const supabase = createServerSupabaseClient();
  // Fetch sponsors with their click counts
  const { data: sponsors, error } = await supabase
    .from("sponsors")
    .select(`
      id,
      name,
      logo_url,
      banner_url,
      website_url,
      instagram_url,
      facebook_url,
      tiktok_url,
      youtube_url,
      whatsapp,
      email,
      sponsor_clicks (
        id,
        click_type
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-red-500">Error loading sponsors: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Auspiciantes & Estadísticas</h1>
        <Link href="/admin/sponsors/new" className="bg-[var(--color-brand-accent)] text-black px-4 py-2 rounded font-bold hover:bg-white transition-colors">
          + Nuevo Cliente
        </Link>
      </div>

      <div className="grid gap-6 mt-8">
        {sponsors?.map((sponsor: any) => {
          const clicks = sponsor.sponsor_clicks || [];
          const websiteClicks = clicks.filter((c: any) => c.click_type === 'website').length;
          const instagramClicks = clicks.filter((c: any) => c.click_type === 'instagram').length;
          const totalClicks = clicks.length;

          return (
            <div key={sponsor.id} className="bg-black/30 p-6 rounded-lg border border-white/10 flex flex-col md:flex-row gap-6 items-center">
              {/* Client Visuals */}
              <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
                {sponsor.banner_url ? (
                  <img src={sponsor.banner_url} alt={sponsor.name} className="w-full h-32 object-cover rounded border border-white/10" />
                ) : (
                  <div className="w-full h-32 bg-white/5 flex items-center justify-center rounded border border-white/10 text-gray-500 text-sm">
                    Sin Banner
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-center">{sponsor.name}</h2>
                  <Link href={`/admin/sponsors/${sponsor.id}`} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-gray-300">
                    Editar
                  </Link>
                </div>
              </div>

              {/* Stats & Info */}
              <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4">
                <div className="bg-white/5 p-3 lg:p-4 rounded text-center overflow-hidden">
                  <p className="text-[10px] lg:text-xs text-gray-400 uppercase tracking-wider mb-1 truncate">Visitas Web</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-400">{websiteClicks}</p>
                </div>
                <div className="bg-white/5 p-3 lg:p-4 rounded text-center overflow-hidden">
                  <p className="text-[10px] lg:text-xs text-gray-400 uppercase tracking-wider mb-1 truncate">Visitas Instag.</p>
                  <p className="text-2xl lg:text-3xl font-bold text-pink-400">{instagramClicks}</p>
                </div>
                <div className="bg-[var(--color-brand-accent)]/10 border border-[var(--color-brand-accent)]/30 p-3 lg:p-4 rounded text-center overflow-hidden">
                  <p className="text-[10px] lg:text-xs text-[var(--color-brand-accent)] uppercase tracking-wider mb-1 truncate">Total Generado</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[var(--color-brand-accent)]">{totalClicks}</p>
                </div>
              </div>
            </div>
          );
        })}
        {sponsors?.length === 0 && (
          <p className="text-gray-500 italic">No hay auspiciantes cargados en el sistema.</p>
        )}
      </div>
    </div>
  );
}
