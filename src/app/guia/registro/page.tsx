"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, CheckCircle2, ExternalLink } from "lucide-react";

export default function GuiaRegistroDirectoPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Gastronomía");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("Ituzaingó, Corrientes");
  const [description, setDescription] = useState("");
  const [featuredOffer, setFeaturedOffer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activatedBiz, setActivatedBiz] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) {
      alert("Por favor completá el Nombre del Comercio y tu WhatsApp.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/guia/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `BIZ-${Date.now()}`,
          name: name.trim(),
          category,
          whatsapp: whatsapp.trim(),
          address: address.trim(),
          description: description.trim() || `Comercio local verificado (${name}).`,
          featured_offer: featuredOffer.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.business) {
        setActivated(true);
        setActivatedBiz(data.business);
      }
    } catch (err) {
      alert("Error de conexión al activar tu comercio.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Páginas Amarillas 2.0 • Nexativa News</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Inscripción & Alta de Comercio
          </h1>
          <p className="text-sm text-slate-400">
            Completá tus datos comerciales para publicar gratis tu ficha y WhatsApp en la Guía Comunitaria de Ituzaingó.
          </p>
        </div>

        {activated && activatedBiz ? (
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-6 text-center text-emerald-200 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">¡Tu Comercio ya está Publicado en Vivo!</h2>
            <p className="text-sm text-emerald-300">
              Felicitaciones, <strong>{activatedBiz.name}</strong>. Tu ficha comercial ya se encuentra activa en las Páginas Amarillas 2.0.
            </p>
            <div className="pt-2">
              <Link
                href="/guia"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>🌐 Ver Mi Comercio en la Guía Pública (/guia)</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nombre del Comercio o Empresa *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Mueblería & Deco El Puerto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Rubro / Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Gastronomía">Gastronomía & Sabores</option>
                  <option value="Estética">Estética & Bienestar</option>
                  <option value="Arquitectura">Arquitectura & Construcción</option>
                  <option value="Joyería">Joyería & Regalos</option>
                  <option value="Comercio">Comercio General</option>
                  <option value="Salud">Salud & Farmacia</option>
                  <option value="Servicios Locales">Servicios Locales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  WhatsApp de Ventas *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 3786401122"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Dirección Física / Barrio
              </label>
              <input
                type="text"
                placeholder="Ej: Av. San Martín 1420, Ituzaingó"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Descripción del Comercio
              </label>
              <textarea
                rows={3}
                placeholder="Describí tus productos, servicios y horarios de atención..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30">
              <label className="block text-xs font-extrabold text-amber-300 mb-1">
                🔥 Promo Especial / Plato del Día (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: 2x1 en Pizzas de Miércoles a Viernes"
                value={featuredOffer}
                onChange={(e) => setFeaturedOffer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-amber-200 font-bold focus:border-amber-400 outline-none text-xs"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                💡 Esta oferta destacada rotará en el portal de Nexativa News.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-base shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>{submitting ? "Publicando Ficha..." : "🚀 ACTIVAR Y PUBLICAR MI COMERCIO GRATIS"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
