"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({
    whatsapp: "",
    tiktok: "",
    instagram: "",
    facebook: "",
    youtube: "",
    linkedin: "",
    email: "",
    x_url: "",
    system_announcement: "",
    plan_bronce_price: "",
    plan_plata_price: "",
    plan_oro_price: "",
  });

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from("settings").select("*");
      if (!error && data) {
        const newSettings = { ...settings };
        data.forEach((row) => {
          if (row.key in newSettings) {
            newSettings[row.key as keyof typeof settings] = row.value;
          }
        });
        setSettings(newSettings);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Save each key-value pair to the settings table
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));

    // Upsert the values
    const { error } = await supabase.from("settings").upsert(updates, { onConflict: "key" });

    setSaving(false);
    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("Configuraciones guardadas exitosamente.");
    }
  };

  if (loading) {
    return <div className="text-white/50">Cargando configuraciones...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase mb-8">
        Redes Sociales
      </h1>
      <p className="text-white/70 mb-8">
        Actualiza los enlaces de tus redes sociales. Si dejas un campo vacío o con "#", el enlace no se abrirá.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white/5 border border-[var(--color-brand-accent)]/50 p-4 rounded-xl mb-6">
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Anuncio del Sistema (Carrusel de Noticias)</label>
          <input
            type="text"
            name="system_announcement"
            value={settings.system_announcement || ""}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="Ej: ¡Lanzamos la nueva plataforma de Nexativa News! 🎉"
          />
          <p className="text-xs text-white/50 mt-2">Si escribís algo acá, aparecerá como "Último Momento" en la barra de noticias de la página principal. Dejalo vacío para ocultarlo.</p>
        </div>

        <div className="bg-indigo-900/30 border border-indigo-500/50 p-4 rounded-xl mb-6">
          <label className="block text-sm font-bold text-indigo-400 mb-2 uppercase">Fuente Automática de Noticias (Bot de Ingesta)</label>
          <input
            type="url"
            name="auto_news_rss_url"
            value={settings.auto_news_rss_url || ""}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            placeholder="Ej: https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml"
          />
          <p className="text-xs text-white/50 mt-2">El bot leerá este enlace RSS cada 60 minutos y publicará automáticamente las noticias nuevas en tu base de datos.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <h2 className="md:col-span-3 text-xl font-bold text-[var(--color-brand-accent)] uppercase mb-2">Precios de los Planes</h2>
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase">Precio Plan Bronce</label>
            <input
              type="text"
              name="plan_bronce_price"
              value={settings.plan_bronce_price || ""}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
              placeholder="Ej: $5.000 / mes"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase">Precio Plan Plata</label>
            <input
              type="text"
              name="plan_plata_price"
              value={settings.plan_plata_price || ""}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
              placeholder="Ej: $10.000 / mes"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase">Precio Plan Oro</label>
            <input
              type="text"
              name="plan_oro_price"
              value={settings.plan_oro_price || ""}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
              placeholder="Ej: $20.000 / mes"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">WhatsApp (Número, ej: 5493786611250)</label>
          <input
            type="text"
            name="whatsapp"
            value={settings.whatsapp}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="5493786611250"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Facebook</label>
          <input
            type="url"
            name="facebook"
            value={settings.facebook}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="https://facebook.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Instagram</label>
          <input
            type="url"
            name="instagram"
            value={settings.instagram}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">YouTube</label>
          <input
            type="url"
            name="youtube"
            value={settings.youtube}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="https://youtube.com/@..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">TikTok</label>
          <input
            type="url"
            name="tiktok"
            value={settings.tiktok}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="https://tiktok.com/@..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">LinkedIn</label>
          <input
            type="url"
            name="linkedin"
            value={settings.linkedin || ""}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">X (Twitter)</label>
          <input
            type="url"
            name="x_url"
            value={settings.x_url || ""}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="https://x.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={settings.email}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            placeholder="contacto@nexativa.com"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-[var(--color-brand-accent)] text-black font-bold uppercase tracking-widest py-4 px-8 rounded-lg hover:scale-105 transition-transform w-full disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
