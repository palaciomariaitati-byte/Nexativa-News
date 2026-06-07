"use client";

import React from "react";
import type { StreamVideo } from "@/lib/types";

type Props = {
  stream: StreamVideo | null;
};

export default function StickyVideo({ stream }: Props) {
  if (!stream) {
    return (
      <p className="text-sm text-gray-500">
        No hay transmisión en vivo en este momento.
      </p>
    );
  }

  const src = stream.youtube_url;

  return (
    <div className="fixed bottom-4 right-4 w-64 md:w-80 lg:w-96 aspect-video bg-black rounded-lg shadow-xl overflow-hidden z-50">
      <iframe
        src={src}
        title={stream.title}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
