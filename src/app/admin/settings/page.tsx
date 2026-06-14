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
