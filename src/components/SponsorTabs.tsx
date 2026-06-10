"use client";

import React, { useState, useEffect } from "react";
import type { Sponsor } from "@/lib/types";

export default function SponsorTabs({ sponsors }: { sponsors: Sponsor[] }) {
  const categories = ["Hotelería", "Turismo", "Gastronomía", "Servicios", "Otros"];
  const [activeTab, setActiveTab] = useState("Hotelería");

  // Escuchar cambios en la URL (hash) para cambiar la pestaña automáticamente desde el TopBusBar
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash; // ej: #cat-hoteleria
      if (hash && hash.startsWith("#cat-")) {
        const catHash = hash.replace("#cat-", "");
        // Buscar la categoría que coincide (ignorando tildes y mayúsculas)
        const matchedCat = categories.find(
          (c) => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === catHash
        );
        if (matchedCat) {
          setActiveTab(matchedCat);
        }
      }
    };

    // Revisar el hash al cargar
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const getTrackingUrl = (sponsorId: string, url: string, type: string) => {
    return `/api/track-click?sponsor_id=${sponsorId}&type=${type}&url=${encodeURIComponent(url)}`;
  };

  const activeSponsors = sponsors.filter((s) => (s.category || 'Servicios') === activeTab);

  return (
    <div className="w-full glass-panel overflow-hidden border border-white/10" id="sponsors-section">
      {/* Pestañas (Scroll horizontal en móvil si no entran) */}
      <div className="flex overflow-x-auto border-b border-white/10 bg-black/20 hide-scrollbar snap-x">
        {categories.map((cat) => {
          const count = sponsors.filter((s) => (s.category || 'Servicios') === cat).length;
          if (count === 0) return null; // Ocultar pestañas sin sponsors

          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex-1 min-w-[120px] px-4 py-4 text-sm font-bold text-center uppercase tracking-wider transition-colors snap-center ${
                activeTab === cat
                  ? "bg-[var(--color-brand-accent)] text-black"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Contenido (Cinta Infinita) */}
      <div className="p-4 sm:p-6 w-full">
        {activeSponsors.length > 0 ? (
          <div className="overflow-hidden w-full relative">
            <div 
              className="flex w-max animate-marquee-sponsors hover:[animation-play-state:paused] gap-4 pb-2"
            >
              {activeSponsors.map((sponsor) => (
                <SponsorCardItem key={sponsor.id} sponsor={sponsor} getTrackingUrl={getTrackingUrl} />
              ))}
              {/* Duplicado para crear el efecto infinito sin cortes */}
              {activeSponsors.map((sponsor) => (
                <SponsorCardItem key={sponsor.id + "-clone"} sponsor={sponsor} getTrackingUrl={getTrackingUrl} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay comercios en esta categoría.
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-componente extraído de page.tsx para mantener el mismo diseño
function SponsorCardItem({ sponsor, getTrackingUrl }: { sponsor: Sponsor, getTrackingUrl: any }) {
  const cardContent = (
    <>
      {sponsor.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={sponsor.banner_url} 
          alt={sponsor.name} 
          className="w-full h-32 object-cover rounded-md mb-2 shadow-md"
        />
      ) : sponsor.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={sponsor.logo_url} 
          alt={sponsor.name} 
          className="w-full h-24 object-contain rounded-md mb-2 bg-white/5 shadow-md p-2"
        />
      ) : null}
      
      <h4 className="font-bold text-gray-100 group-hover:text-[var(--color-brand-accent)] transition-colors text-center w-full truncate">
        {sponsor.name}
      </h4>
      
      <div className="hidden sm:flex flex-wrap justify-center gap-2 mt-2 w-full">
        {sponsor.website_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.website_url, 'website')} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-[var(--color-brand-accent)] hover:text-black text-white px-3 py-1 rounded-full text-xs transition-colors">
            Sitio Web
          </a>
        )}
        {sponsor.instagram_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.instagram_url, 'instagram')} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-80 text-white px-3 py-1 rounded-full text-xs transition-opacity">
            Instagram
          </a>
        )}
      </div>
    </>
  );

  const mainLink = sponsor.website_url || sponsor.instagram_url;

  if (mainLink) {
    return (
      <a href={getTrackingUrl(sponsor.id, mainLink, 'card_click')} target="_blank" rel="noopener noreferrer" className="glass-panel p-3 space-y-2 hover:-translate-y-1 transition-transform group flex flex-col items-center min-w-[160px] max-w-[200px] border border-white/5 cursor-pointer">
        {cardContent}
      </a>
    );
  }

  return (
    <div className="glass-panel p-3 space-y-2 hover:-translate-y-1 transition-transform group flex flex-col items-center min-w-[160px] max-w-[200px] border border-white/5">
      {cardContent}
    </div>
  );
}
