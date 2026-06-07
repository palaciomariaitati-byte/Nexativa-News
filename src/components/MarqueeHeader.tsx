import React from "react";
import type { Sponsor } from "@/lib/types";

export default function MarqueeHeader({ sponsors }: { sponsors: Sponsor[] }) {
  const renderCard = (s: Sponsor, key: React.Key) => (
    <div
      key={key}
      className="border border-slate-200 rounded-2xl p-2 space-y-2 bg-white shadow-sm hover:shadow-md hover:bg-indigo-50 transition-colors transform hover:scale-105 transition-transform duration-200"
    >
      <h4 className="font-semibold text-slate-900">{s.name}</h4>
      <div className="flex flex-wrap gap-1">
        {s.website_url && (
          <a
            href={s.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-800 text-white px-2 py-1 rounded text-xs"
          >
            Web
          </a>
        )}
        {s.instagram_url && (
          <a
            href={s.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-800 text-white px-2 py-1 rounded text-xs"
          >
            Instagram
          </a>
        )}
      </div>
      {s.map_url && (
        <p className="text-sm text-slate-500">Mapa no disponible temporalmente.</p>
      )}
    </div>
  );

  return (
    <div className="w-full overflow-hidden whitespace-nowrap bg-slate-900 text-white py-3 border-b border-slate-800">
      <div className="flex space-x-6 animate-marquee">
        {sponsors.map((s) => renderCard(s, s.id))}
        {sponsors.map((s) => renderCard(s, `${s.id}-clone`))}
      </div>
    </div>
  );
}
