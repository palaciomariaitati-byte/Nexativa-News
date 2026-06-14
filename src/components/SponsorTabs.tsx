"use client";

import React, { useState, useEffect } from "react";
import type { Sponsor } from "@/lib/types";
import { Globe, MessageCircle, Mail, MapPin } from "lucide-react";

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

      {/* Contenido (Cinta Infinita o Placeholders) */}
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
          <div className="overflow-hidden w-full relative">
            <div className="flex w-max animate-marquee-sponsors hover:[animation-play-state:paused] gap-4 pb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`ph1-${i}`} className="glass-panel p-3 flex flex-col items-center justify-center min-w-[160px] max-w-[200px] h-48 border border-white/5 bg-white/5">
                  <h4 className="font-bold text-gray-400 text-center uppercase tracking-widest text-sm">
                    Publicite Aquí
                  </h4>
                </div>
              ))}
              {/* Duplicado para crear el efecto infinito */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`ph2-${i}`} className="glass-panel p-3 flex flex-col items-center justify-center min-w-[160px] max-w-[200px] h-48 border border-white/5 bg-white/5">
                  <h4 className="font-bold text-gray-400 text-center uppercase tracking-widest text-sm">
                    Publicite Aquí
                  </h4>
                </div>
              ))}
            </div>
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
         
        <img 
          src={sponsor.banner_url} 
          alt={sponsor.name} 
          className="w-full h-32 object-cover rounded-md mb-2 shadow-md"
        />
      ) : sponsor.logo_url ? (
         
        <img 
          src={sponsor.logo_url} 
          alt={sponsor.name} 
          className="w-full h-24 object-contain rounded-md mb-2 bg-white/5 shadow-md p-2"
        />
      ) : null}
      
      <h4 className="font-bold text-gray-100 group-hover:text-[var(--color-brand-accent)] transition-colors text-center w-full truncate">
        {sponsor.name}
      </h4>
      {sponsor.slogan && (
        <p className="text-xs text-gray-400 text-center italic line-clamp-2 w-full px-2">
          "{sponsor.slogan}"
        </p>
      )}
      
      {sponsor.map_url && (
        <a href={getTrackingUrl(sponsor.id, sponsor.map_url, 'map')} target="_blank" rel="noopener noreferrer" className="mt-2 w-full bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 py-1.5 px-3 rounded-md flex items-center justify-center gap-2 transition-all group-hover:scale-105" title="Ver Ubicación">
          <MapPin className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Cómo llegar</span>
        </a>
      )}

      <div className="flex flex-wrap justify-center gap-3 mt-3 w-full border-t border-white/5 pt-2">
        {sponsor.website_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.website_url, 'website')} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all" title="Sitio Web">
            <Globe className="w-4 h-4" />
          </a>
        )}
        {sponsor.instagram_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.instagram_url, 'instagram')} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 hover:scale-110 transition-all" title="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
            </svg>
          </a>
        )}
        {sponsor.facebook_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.facebook_url, 'facebook')} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 hover:scale-110 transition-all" title="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className="w-4 h-4">
              <path d="M279.1 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.4 0 225.4 0c-73.22 0-121.1 44.38-121.1 124.7v70.62H22.89V288h81.39v224h100.2V288z"/>
            </svg>
          </a>
        )}
        {sponsor.x_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.x_url, 'x')} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 hover:scale-110 transition-all" title="X (Twitter)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-4 h-4">
              <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L273 180.8 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
            </svg>
          </a>
        )}
        {sponsor.youtube_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.youtube_url, 'youtube')} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 hover:scale-110 transition-all" title="YouTube">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" className="w-4 h-4">
              <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/>
            </svg>
          </a>
        )}
        {sponsor.tiktok_url && (
          <a href={getTrackingUrl(sponsor.id, sponsor.tiktok_url, 'tiktok')} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:scale-110 transition-all" title="TikTok">
            <svg viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
              <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
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
