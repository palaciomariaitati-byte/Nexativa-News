"use client";

import React, { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Mail, Building2, Map, UtensilsCrossed, Briefcase, QrCode } from 'lucide-react';

export default function TopBusBar() {
  const [settings, setSettings] = useState({
    whatsapp: "5493786611250",
    tiktok: "#",
    instagram: "#",
    facebook: "#",
    youtube: "#",
    email: "contacto@nexativa.com",
  });
  const [isQrOpen, setIsQrOpen] = useState(false);

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
    // Actualiza el hash para que SponsorTabs cambie la pestaña activa
    window.history.pushState(null, "", `#${id}`);
    // Dispara el evento hashchange manualmente para que el useEffect de SponsorTabs lo escuche
    window.dispatchEvent(new Event("hashchange"));
    
    // Scrollea suavemente hasta la sección de sponsors
    const element = document.getElementById("sponsors-section");
    if (element) {
      // Offset top para que no quede tapado por la navbar
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
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
    <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-8 mt-2 mb-4 relative z-50">
      <div className="glass-panel !overflow-visible w-full rounded-2xl flex flex-col md:flex-row items-center justify-between p-2 md:p-3 gap-3 border border-white/10 shadow-lg">
        
        {/* Atajos de Categorías (Izquierda) */}
        <div className="flex overflow-x-auto hide-scrollbar items-center justify-start md:justify-center gap-2 w-full md:w-auto pb-1 md:pb-0 snap-x">
          <button
            onClick={() => scrollToSection("cat-hoteleria")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <Building2 className="w-4 h-4" />
            <span>Hotelería</span>
          </button>
          <button
            onClick={() => scrollToSection("cat-turismo")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <Map className="w-4 h-4" />
            <span>Turismo</span>
          </button>
          <button
            onClick={() => scrollToSection("cat-gastronomia")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Gastronomía</span>
          </button>
          <button
            onClick={() => scrollToSection("cat-servicios")}
            className="flex items-center gap-2 bg-black/40 hover:bg-[var(--color-brand-accent)] hover:text-black transition-colors text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-white/5 flex-shrink-0 snap-center"
          >
            <Briefcase className="w-4 h-4" />
            <span>Servicios</span>
          </button>
        </div>

        {/* Redes Sociales (Derecha) */}
        <div className="flex items-center justify-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-400 transition-colors shadow-md"
            aria-label="WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M20.52 3.48A11.94 11.94 0 0012 0c-6.62 0-12 5.38-12 12 0 2.12.56 4.14 1.56 5.9L0 24l6.33-1.65a11.86 11.86 0 005.66 1.44h.01c6.62 0 12-5.38 12-12 0-3.2-1.24-6.13-3.48-8.31zM12 22a9.86 9.86 0 01-5.2-1.44l-.37-.22-3.76 1 1-3.66-.24-.38A9.86 9.86 0 012 12c0-5.51 4.49-10 10-10s10 4.49 10 10-4.49 10-10 10z"/>
              <path d="M17.37 14.54c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.61.79-.75.95-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.18-.72-.64-1.21-1.43-1.35-1.66-.14-.24-.02-.37.1-.49.1-.1.24-.27.36-.4.12-.12.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.74 2.66 4.22 3.73.59.26 1.05.41 1.41.53.59.19 1.13.16 1.55.1.47-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
            </svg>
          </a>
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white p-2 rounded-full hover:opacity-90 transition-opacity shadow-md"
            aria-label="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
            </svg>
          </a>
          <a
            href={facebookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 transition-colors shadow-md"
            aria-label="Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M279.1 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.4 0 225.4 0c-73.22 0-121.1 44.38-121.1 124.7v70.62H22.89V288h81.39v224h100.2V288z"/>
            </svg>
          </a>
          <a
            href={tiktokLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white p-2 rounded-full border border-white/10 hover:bg-gray-900 transition-colors shadow-md"
            aria-label="TikTok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
            </svg>
          </a>
          <a
            href={youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 text-white p-2 rounded-full border border-white/10 hover:bg-red-500 transition-colors shadow-md"
            aria-label="YouTube"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/>
            </svg>
          </a>
          <a
            href={emailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-400 transition-colors shadow-md"
            aria-label="Email"
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          {/* Botón QR Code (Hover/Click muestra el código QR) */}
          <div className="relative group">
            <button
              onClick={() => setIsQrOpen(!isQrOpen)}
              onBlur={() => setTimeout(() => setIsQrOpen(false), 200)}
              className="bg-[var(--color-brand-accent)] text-black p-2 rounded-full hover:bg-white transition-colors shadow-md flex items-center justify-center"
              aria-label="Descargar App"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className={`absolute right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 top-full mt-2 w-48 p-4 bg-white rounded-xl shadow-2xl transition-all duration-300 z-50 flex flex-col items-center ${isQrOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
              <p className="text-black text-xs font-bold text-center mb-2 leading-tight">
                Escanea para descargar<br/>Nexativa News
              </p>
              {/* Usamos una API gratuita para generar el QR dinámicamente con la URL actual */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://nexativa-news-digital.vercel.app/" 
                alt="QR Code" 
                className="w-32 h-32 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
