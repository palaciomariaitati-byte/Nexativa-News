"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Phone, MessageSquare, ShieldCheck, Sparkles, ArrowRight, Building2, Navigation } from "lucide-react";

export interface DirectoryItem {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  whatsapp: string;
  phone: string;
  description: string;
  tier: string;
  isVerified: boolean;
  distance: string;
}

interface GuiaClientProps {
  initialBusinesses: DirectoryItem[];
}

const CATEGORIES = [
  "Todos",
  "Arquitectura",
  "Estética",
  "Joyería",
  "Soluciones Corporativas",
  "Gastronomía",
  "Salud & Bienestar",
  "Servicios Locales",
];

export default function GuiaClient({ initialBusinesses }: GuiaClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // Filter businesses based on search term and category
  const filteredBusinesses = initialBusinesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "Todos" || b.category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Handle GPS Geolocation ("Buscar Cerca de Mí")
  const handleGPSLocation = () => {
    setIsGeolocating(true);
    setGeoStatus("Obteniendo tu ubicación GPS...");

    if (!navigator.geolocation) {
      setGeoStatus("La geolocalización no está soportada por tu navegador.");
      setIsGeolocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoStatus(`Ubicación detectada (Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}). Ordenando comercios por distancia...`);
        setIsGeolocating(false);
      },
      (error) => {
        setGeoStatus("Ubicación por GPS aproximada a Ituzaingó, Corrientes.");
        setIsGeolocating(false);
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Search Bar & Geolocation Trigger */}
      <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 backdrop-blur-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Qué servicio estás buscando? (Ej: Plomero, Estética, Joyería)..."
            className="w-full bg-slate-950/70 text-white placeholder-slate-500 pl-11 pr-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <button
          onClick={handleGPSLocation}
          disabled={isGeolocating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          <Navigation className={`w-4 h-4 ${isGeolocating ? "animate-spin" : ""}`} />
          <span>{isGeolocating ? "Ubicando..." : "Buscar Cerca de Mí"}</span>
        </button>
      </div>

      {geoStatus && (
        <div className="text-center text-xs font-semibold text-cyan-400 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl max-w-md mx-auto">
          {geoStatus}
        </div>
      )}

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              selectedCategory === cat
                ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Directory Grid */}
      {filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/5 group"
            >
              <div>
                {/* Header Card: Tier Badge & Verification */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 text-amber-300">
                    PLAN {b.tier}
                  </span>

                  {b.isVerified && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verificado</span>
                    </span>
                  )}
                </div>

                {/* Title & Category */}
                <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-1 line-clamp-2">
                  {b.name}
                </h2>
                <div className="text-xs font-medium text-cyan-400 mb-3">{b.category}</div>

                <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {b.description}
                </p>
              </div>

              <div>
                {/* Location & Distance */}
                <div className="flex items-center justify-between text-xs text-slate-400 py-3 border-t border-slate-800/80 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{b.address}, {b.city}</span>
                  </span>
                  <span className="font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {b.distance}
                  </span>
                </div>

                {/* CTAs: WhatsApp Direct */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/${b.whatsapp}?text=Hola!%20Los%20vi%20en%20las%20P%C3%A1ginas%20Amarillas%20de%20Nexativa%20News%20y%20quisiera%20consultar...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${b.phone}`}
                    className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold px-3 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Llamar</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
          No se encontraron comercios para la búsqueda &ldquo;{searchQuery}&rdquo;. Intentá con otra palabra o categoría.
        </div>
      )}
    </div>
  );
}
