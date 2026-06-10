"use client";

import React, { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Mail, Building2, Map, UtensilsCrossed, Briefcase } from 'lucide-react';

export default function TopBusBar() {
  const [settings, setSettings] = useState({
    whatsapp: "5493786611250",
    tiktok: "#",
    instagram: "#",
    facebook: "#",
    youtube: "#",
    email: "contacto@nexativa.com",
  });

  useEffect(() => {
    async function fetchSettings() {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("settings").select("*");
      if (!error && data) {
        setSettings((prev) => {
          const newSettings = { ...prev };
          data.forEach((row) => {
            if (row.key in newSettings && row.value) {
              newSettings[row.key as keyof typeof prev] = row.value;
            }
          });
          return newSettings;
        });
      }
    }
    fetchSettings();
  }, []);

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== "/") {
      window.location.href = `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Si la sección no existe (ej. no hay sponsors de esa categoría), alertamos al usuario sutilmente
      console.log(`Sección ${id} no encontrada (quizás no hay elementos).`);
    }
  };

  const whatsappNumber = settings.whatsapp;
  const waLink = `https://wa.me/${whatsappNumber}?text=Hola%20Nexativa%20News%2C%20quiero%20realizar%20una%20consulta.`;
  const tiktokLink = settings.tiktok;
  const instagramLink = settings.instagram;
  const facebookLink = settings.facebook;
  const youtubeLink = settings.youtube;
  const emailLink = settings.email.includes('@') ? `mailto:${settings.email}` : '#';

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-8 mt-2 mb-4">
      <div className="glass-panel w-full rounded-2xl flex flex-col md:flex-row items-center justify-between p-2 md:p-3 gap-3 border border-white/10 shadow-lg">
        
        {/* Atajos de Categorías (Centrados) */}
        <div className="flex overflow-x-auto hide-scrollbar items-center justify-center gap-2 sm:gap-4 w-full pb-1 md:pb-0 snap-x">
          <button
            onClick={() => scrollToSection("cat-hoteleria")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Hotelería</span>
          </button>
          <button
            onClick={() => scrollToSection("cat-turismo")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <Map className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Turismo</span>
          </button>
          <button
            onClick={() => scrollToSection("cat-gastronomia")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Gastronomía</span>
          </button>
          <button
            onClick={() => scrollToSection("cat-servicios")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Servicios</span>
          </button>
        </div>

      </div>
    </div>
  );
}
