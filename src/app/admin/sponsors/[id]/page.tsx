import React from "react";
import SponsorForm from "../SponsorForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditSponsorPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: sponsor, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !sponsor) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-900/20 rounded-xl border border-red-500/30">
        <h2 className="text-xl font-bold mb-2">Error al cargar el cliente</h2>
        <p>{error?.message || "Cliente no encontrado"}</p>
        <p className="mt-4 text-sm text-gray-400">Por favor, reporta este error para que lo solucionemos.</p>
        <a href="/admin/sponsors" className="mt-4 inline-block bg-white/10 px-4 py-2 rounded">Volver</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Cliente: {sponsor.name}</h1>
        <p className="text-gray-400 mt-2">Modifica los datos del cliente. Si subes una nueva imagen, se reemplazará la anterior.</p>
      </div>
      
      <SponsorForm initialData={sponsor} />
    </div>
  );
}
