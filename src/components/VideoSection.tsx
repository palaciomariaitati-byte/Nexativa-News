// src/components/VideoSection.tsx
"use client";
import React, { useState } from "react";
import type { StreamVideo } from "@/lib/types";

export default function VideoSection({ stream }: { stream: StreamVideo | null }) {
  if (!stream) {
    return <p className="text-sm text-gray-500">No hay streaming activo en este momento.</p>;
  }

  // Convert YouTube URL to embed format
  let embedUrl = stream.youtube_url;
  try {
    const urlObj = new URL(stream.youtube_url);
    if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.has("v")) {
      embedUrl = `https://www.youtube.com/embed/${urlObj.searchParams.get("v")}`;
    } else if (urlObj.hostname === "youtu.be") {
      embedUrl = `https://www.youtube.com/embed${urlObj.pathname}`;
    }
  } catch (e) {
    // ignore invalid URLs
  }

  const [showVideo, setShowVideo] = useState(true);

  return (
    showVideo ? (
      <div className="space-y-4 md:static fixed bottom-4 right-4 w-80 h-48 md:w-full md:h-auto bg-white shadow-lg rounded-lg overflow-hidden z-50">
        <button
          onClick={() => setShowVideo(false)}
          className="absolute top-1 right-1 text-gray-600 hover:text-gray-800"
        >
          ✖
        </button>
        <div className="border rounded p-2 h-full flex flex-col">
          <h5 className="font-semibold text-black mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            {stream.title}
          </h5>
          <div className="aspect-video flex-1">
            <iframe
              src={embedUrl}
              title={stream.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded"
            ></iframe>
          </div>
        </div>
      </div>
    ) : null
  );
}
