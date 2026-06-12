"use client";

import React, { useState, useEffect } from "react";
import type { Sponsor } from "@/lib/types";
import { Globe, Instagram, Facebook, Youtube, MessageCircle, Mail } from "lucide-react";

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
  }, [categories]);

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
  // TikTok uses a custom icon since lucide doesn't have an official one that looks good always, or we use something generic.
  // We will just use an SVG or a text fallback. Actually, Lucide has no TikTok. We'll use a simple "TT" or an SVG.
  // Wait, I can use an SVG for TikTok. I'll just skip TikTok if it's too complex or use a generic "Link" icon.
  // Let's use a generic link icon for TikTok or a simple text.
  
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
      
      <div className="flex flex-wrap justify-center gap-3 mt-2 w-full border-t border-white/5 pt-2">
        {sponsor.website_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.website_url, 'website')} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all" title="Sitio Web">
            <Globe className="w-4 h-4" />
          </a>
        )}
        {sponsor.instagram_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.instagram_url, 'instagram')} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 hover:scale-110 transition-all" title="Instagram">
            <Instagram className="w-4 h-4" />
          </a>
        )}
        {sponsor.facebook_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.facebook_url, 'facebook')} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 hover:scale-110 transition-all" title="Facebook">
            <Facebook className="w-4 h-4" />
          </a>
        )}
        {sponsor.youtube_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.youtube_url, 'youtube')} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 hover:scale-110 transition-all" title="YouTube">
            <Youtube className="w-4 h-4" />
          </a>
        )}
        {sponsor.tiktok_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.tiktok_url, 'tiktok')} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:scale-110 transition-all" title="TikTok">
            {/* Custom TikTok SVG icon */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.02-.33-.02-.66-.01-.99.11-1.74.88-3.39 2.08-4.63 1.39-1.42 3.39-2.26 5.37-2.34v4.06c-.84.05-1.68.39-2.28 1.01-.63.63-.94 1.54-.85 2.44.08.87.55 1.7 1.25 2.18.78.53 1.83.69 2.71.39.81-.27 1.48-.9 1.8-1.69.21-.51.27-1.08.28-1.63.02-4.14.01-8.28.01-12.42z" />
            </svg>
          </a>
        )}
        {sponsor.whatsapp && (
          <a href={getTrackingUrl(sponsor.id, `https://wa.me/${sponsor.whatsapp.replace(/\D/g, '')}`, 'whatsapp')} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 hover:scale-110 transition-all" title="WhatsApp">
            <MessageCircle className="w-4 h-4" />
          </a>
        )}
        {sponsor.email && (
          <a href={getTrackingUrl(sponsor.id, `mailto:${sponsor.email}`, 'email')} className="text-gray-400 hover:text-white hover:scale-110 transition-all" title="Email">
            <Mail className="w-4 h-4" />
          </a>
        )}
      </div>
    </>
  );

  const mainLink = sponsor.website_url || sponsor.instagram_url || sponsor.facebook_url || sponsor.whatsapp;

  if (mainLink) {
    return (
      <div className="glass-panel p-3 space-y-2 hover:-translate-y-1 transition-transform group flex flex-col items-center min-w-[160px] max-w-[200px] border border-white/5">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="glass-panel p-3 space-y-2 hover:-translate-y-1 transition-transform group flex flex-col items-center min-w-[160px] max-w-[200px] border border-white/5">
      {cardContent}
    </div>
  );
}
