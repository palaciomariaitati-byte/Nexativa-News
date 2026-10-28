import React from "react";
import supabaseAdmin from "@/lib/supabase/admin";
import CleanFlashPlayer from "@/components/CleanFlashPlayer";

export const dynamic = "force-dynamic";

interface EmbedFlashPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmbedFlashPage({ params }: EmbedFlashPageProps) {
  const { id } = await params;

  const { data: flash, error } = await supabaseAdmin
    .from("news_flashes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !flash) {
    return (
      <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-xl font-bold text-red-500 mb-2">🔴 Flash Noticioso no disponible</h2>
        <p className="text-sm text-gray-400">El contenido solicitado no se encuentra en la emisión activa.</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col justify-center m-0 p-0 select-none font-sans">
      <CleanFlashPlayer
        videoUrl={flash.video_url}
        segments={flash.segments || []}
        totalDurationSeconds={flash.duration_seconds || 180}
        title={flash.title}
        partnerName="Cadena 4 & Nexativa News"
      />
    </div>
  );
}
