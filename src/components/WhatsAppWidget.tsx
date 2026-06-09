"use client";
import React, { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Mail, Instagram } from 'lucide-react';

export default function FloatingSocials() {
  const [settings, setSettings] = useState({
    whatsapp: "5493786611250",
    tiktok: "#",
    instagram: "#",
    facebook: "#",
    email: "contacto@nexativa.com",
  });

  useEffect(() => {
    async function fetchSettings() {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("settings").select("*");
      if (!error && data) {
        const newSettings = { ...settings };
        data.forEach((row) => {
          if (row.key in newSettings && row.value) {
            newSettings[row.key as keyof typeof settings] = row.value;
          }
        });
        setSettings(newSettings);
      }
    }
    fetchSettings();
  }, []);

  const whatsappNumber = settings.whatsapp;
  const waLink = `https://wa.me/${whatsappNumber}?text=Hola%20Nexativa%20News%2C%20quiero%20realizar%20una%20consulta.`;
  const tiktokLink = settings.tiktok;
  const instagramLink = settings.instagram;
  const facebookLink = settings.facebook;
  const emailLink = settings.email.includes('@') ? `mailto:${settings.email}` : '#';

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-2">
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-3 rounded-r-xl shadow-lg hover:pr-6 hover:bg-green-400 transition-all duration-300 flex items-center group"
        aria-label="Contactar por WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M20.52 3.48A11.94 11.94 0 0012 0c-6.62 0-12 5.38-12 12 0 2.12.56 4.14 1.56 5.9L0 24l6.33-1.65a11.86 11.86 0 005.66 1.44h.01c6.62 0 12-5.38 12-12 0-3.2-1.24-6.13-3.48-8.31zM12 22a9.86 9.86 0 01-5.2-1.44l-.37-.22-3.76 1 1-3.66-.24-.38A9.86 9.86 0 012 12c0-5.51 4.49-10 10-10s10 4.49 10 10-4.49 10-10 10z"/>
          <path d="M17.37 14.54c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.61.79-.75.95-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.18-.72-.64-1.21-1.43-1.35-1.66-.14-.24-.02-.37.1-.49.1-.1.24-.27.36-.4.12-.12.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.74 2.66 4.22 3.73.59.26 1.05.41 1.41.53.59.19 1.13.16 1.55.1.47-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
        </svg>
      </a>

      <a
        href={tiktokLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black text-white p-3 rounded-r-xl shadow-lg border border-white/10 hover:pr-6 hover:bg-gray-900 transition-all duration-300 flex items-center group"
        aria-label="TikTok"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-6 h-6">
          <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
        </svg>
      </a>

      <a
        href={instagramLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white p-3 rounded-r-xl shadow-lg hover:pr-6 hover:opacity-90 transition-all duration-300 flex items-center group"
        aria-label="Instagram"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-6 h-6">
          <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
        </svg>
      </a>

      <a
        href={emailLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-red-500 text-white p-3 rounded-r-xl shadow-lg hover:pr-6 hover:bg-red-400 transition-all duration-300 flex items-center group"
        aria-label="Email"
      >
        <Mail className="w-6 h-6" />
      </a>
    </div>
  );
}
