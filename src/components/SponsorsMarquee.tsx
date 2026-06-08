import React from "react";
import type { Sponsor } from "@/lib/types";

export default function SponsorsMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  // If there are no sponsors in the DB yet, we provide some dummy placeholders
  // so the user can see what it looks like and "sell" the space.
  const displaySponsors = sponsors.length > 0 ? sponsors : [
    { id: "dummy-1", name: "TU MARCA AQUÍ", logo_url: "" },
    { id: "dummy-2", name: "ANUNCIA CON NOSOTROS", logo_url: "" },
    { id: "dummy-3", name: "ESPACIO PUBLICITARIO", logo_url: "" },
    { id: "dummy-4", name: "HAZTE PRO", logo_url: "" },
  ];

  return (
    <div className="bg-[var(--color-brand-accent)] text-black py-2 overflow-hidden whitespace-nowrap border-b border-yellow-600/50 w-full relative z-10 shadow-[0_0_20px_var(--color-brand-accent)]">
      <div className="flex items-center space-x-8 animate-marquee">
        {displaySponsors.map((s) => (
          <div key={s.id} className="flex items-center space-x-2 px-6">
            {s.logo_url ? (
              <img src={s.logo_url} alt={s.name} className="h-8 object-contain" />
            ) : (
              <span className="text-sm font-black uppercase tracking-widest">{s.name}</span>
            )}
            <span className="text-black/30 mx-4 text-xl">•</span>
          </div>
        ))}
        {/* Duplicate for infinite effect */}
        {displaySponsors.map((s) => (
          <div key={s.id + "-clone"} className="flex items-center space-x-2 px-6">
            {s.logo_url ? (
              <img src={s.logo_url} alt={s.name} className="h-8 object-contain" />
            ) : (
              <span className="text-sm font-black uppercase tracking-widest">{s.name}</span>
            )}
            <span className="text-black/30 mx-4 text-xl">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
