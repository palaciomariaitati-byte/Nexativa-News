"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CleanFlashPlayer from "@/components/CleanFlashPlayer";

function EmbedPlayerContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("video") || "";
  const start = parseInt(searchParams.get("start") || "0", 10);
  const end = parseInt(searchParams.get("end") || "180", 10);
  const title = searchParams.get("title") || "Momento Destacado";
  const partner = searchParams.get("partner") || "Cadena 4 & Nexativa News";

  const rawSegments = searchParams.get("segments");
  let segments = undefined;
  if (rawSegments) {
    try {
      segments = JSON.parse(decodeURIComponent(rawSegments));
    } catch (e) {}
  }

  const duration = end > start ? end - start : 180;

  if (!videoUrl && (!segments || segments.length === 0)) {
    return (
      <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center font-sans">
        <p className="text-sm text-gray-400">Parámetros de video no provistos.</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col justify-center m-0 p-0 select-none font-sans">
      <CleanFlashPlayer
        videoUrl={videoUrl}
        segments={segments || [{
          start_time_seconds: start,
          end_time_seconds: end,
          title: title
        }]}
        totalDurationSeconds={duration}
        title={title}
        partnerName={partner}
      />
    </div>
  );
}

export default function EmbedPlayerPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black text-white flex items-center justify-center">Cargando reproductor...</div>}>
      <EmbedPlayerContent />
    </Suspense>
  );
}
