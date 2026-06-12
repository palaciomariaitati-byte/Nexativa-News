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
    redirect("/admin/sponsors");
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
