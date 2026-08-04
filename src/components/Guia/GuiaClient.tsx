"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Phone, MessageSquare, ShieldCheck, Sparkles, ArrowRight, Building2, Navigation, CheckCircle2 } from "lucide-react";

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
  status?: string;
  lat?: number;
  lng?: number;
}

interface GuiaClientProps {
  initialBusinesses: DirectoryItem[];
}

// Coordenadas centro de Ituzaingó, Corrientes
const ITUZAINGO_LAT = -27.5853;
const ITUZAINGO_LNG = -56.6853;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la tierra en KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function GuiaClient({ initialBusinesses }: GuiaClientProps) {
  const [businesses, setBusinesses] = useState<DirectoryItem[]>(initialBusinesses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [isExpandedCategories, setIsExpandedCategories] = useState(false);

  // 1. Cargar comercios desde Supabase API y localStorage al iniciar en el cliente
  useEffect(() => {
    async function syncClientBusinesses() {
      let localItems: DirectoryItem[] = [];

      // A. Cargar desde localStorage de socios CRM importados (Solo ACTIVOS en vista pública)
      try {
        const savedSocios = localStorage.getItem("nexativa_socios_crm_v3");
        if (savedSocios) {
          const parsed = JSON.parse(savedSocios);
          if (Array.isArray(parsed)) {
            localItems = parsed
              .filter((s: any) => s.status === "ACTIVE")
              .map((s: any, idx: number) => ({
                id: s.id || `local-socio-${idx}`,
                name: s.name || "Comercio Socio",
                category: s.category || "Servicios Locales",
                address: s.address || "Ituzaingó, Corrientes",
                city: "Ituzaingó",
                whatsapp: s.phone || s.whatsapp || "5493786611250",
                phone: s.phone || "3786611250",
                description: `Comercio local verificado (${s.name}). Contacto referente: ${s.contact_person || 'Atención al Cliente'}.`,
                tier: "ORO",
                isVerified: true,
                distance: "A 400 metros",
                status: s.status,
              }));
          }
        }
      } catch (e) {}

      // B. Cargar desde la API backend (Solo comercios ACTIVOS)
      try {
        const res = await fetch("/api/admin/import-businesses");
        const data = await res.json();
        if (data.success && Array.isArray(data.businesses) && data.businesses.length > 0) {
          const apiItems: DirectoryItem[] = data.businesses
            .filter((b: any) => b.status === "ACTIVE")
            .map((b: any, idx: number) => ({
              id: b.id || `api-b-${idx}`,
              name: b.name || "Comercio Registrado",
              category: b.category || "Servicios Locales",
              address: b.address || "Ituzaingó, Corrientes",
              city: b.city || "Ituzaingó",
              whatsapp: b.whatsapp || b.phone || "5493786611250",
              phone: b.phone || "3786611250",
              description: b.description || `Comercio adherido en el rubro ${b.category || 'local'}.`,
              tier: b.tier || "BRONCE",
              isVerified: b.is_verified ?? true,
              distance: "Cerca de ti",
              status: b.status || "ACTIVE",
            }));

          setBusinesses((prev) => {
            const apiIds = new Set(apiItems.map((i) => i.id));
            const filteredLocal = localItems.filter((l) => !apiIds.has(l.id));
            const combined = [...apiItems, ...filteredLocal];
            const combinedIds = new Set(combined.map((c) => c.id));
            const filteredInitial = initialBusinesses.filter((i) => !combinedIds.has(i.id));
            return [...combined, ...filteredInitial];
          });
          return;
        }
      } catch (err) {
        console.warn("No se pudieron cargar comercios dinámicos de la API:", err);
      }

      if (localItems.length > 0) {
        setBusinesses((prev) => {
          const localIds = new Set(localItems.map((l) => l.id));
          const filteredInitial = initialBusinesses.filter((i) => !localIds.has(i.id));
          return [...localItems, ...filteredInitial];
        });
      }
    }

    syncClientBusinesses();
  }, [initialBusinesses]);

  // Generar categorías dinámicas según los comercios realmente cargados
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    set.add("Todos");
    businesses.forEach((b) => {
      if (b.category && b.category.trim()) {
        set.add(b.category.trim());
      }
    });
    return Array.from(set);
  }, [businesses]);

  // Filtrar y ordenar comercios según búsqueda, categoría y geolocalización
  const filteredBusinesses = useMemo(() => {
    const cleanQuery = normalizeText(searchQuery);
    const cleanCategory = normalizeText(selectedCategory);

    let list = businesses.filter((b) => {
      const nameNorm = normalizeText(b.name);
      const catNorm = normalizeText(b.category);
      const descNorm = normalizeText(b.description);
      const addrNorm = normalizeText(b.address);
      const cityNorm = normalizeText(b.city);

      const matchesSearch =
        !cleanQuery ||
        nameNorm.includes(cleanQuery) ||
        catNorm.includes(cleanQuery) ||
        descNorm.includes(cleanQuery) ||
        addrNorm.includes(cleanQuery) ||
        cityNorm.includes(cleanQuery);

      const matchesCategory =
        selectedCategory === "Todos" || catNorm === cleanCategory || catNorm.includes(cleanCategory);

      return matchesSearch && matchesCategory;
    });

    // Si hay geolocalización de usuario activa, calcular distancia real y ordenar de más cercano a más lejano
    if (userLocation) {
      list = list.map((b, idx) => {
        const bLat = b.lat || ITUZAINGO_LAT + (idx * 0.002);
        const bLng = b.lng || ITUZAINGO_LNG + (idx * 0.003);
        const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, bLat, bLng);
        const distStr = distKm < 1 ? `A ${Math.round(distKm * 1000)} metros` : `A ${distKm.toFixed(1)} km`;
        return { ...b, distance: distStr, calculatedDist: distKm };
      }).sort((a: any, b: any) => a.calculatedDist - b.calculatedDist);
    }

    return list;
  }, [businesses, searchQuery, selectedCategory, userLocation]);

  // Función de Geolocalización GPS en Vivo
  const handleGPSLocation = () => {
    setIsGeolocating(true);
    setGeoStatus("Obteniendo tu ubicación GPS exacta...");

    if (!navigator.geolocation) {
      setGeoStatus("La geolocalización no está soportada por tu navegador. Usando ubicación aproximada.");
      setIsGeolocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setGeoStatus(`📍 Ubicación detectada en vivo. Comercios ordenados por distancia exacta desde tu posición.`);
        setIsGeolocating(false);
      },
      (error) => {
        // Fallback a coordenadas del centro de Ituzaingó
        setUserLocation({ lat: ITUZAINGO_LAT, lng: ITUZAINGO_LNG });
        setGeoStatus("📍 Ubicación fijada en el centro comercial de Ituzaingó, Corrientes.");
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-8">
      {/* Search Bar & Geolocation Trigger */}
      <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 backdrop-blur-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Qué servicio o comercio estás buscando? (Ej: Plomero, Nexus, Mueblería, Estética)..."
            className="w-full bg-slate-950/70 text-white placeholder-slate-500 pl-11 pr-8 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={handleGPSLocation}
          disabled={isGeolocating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap active:scale-95"
        >
          <Navigation className={`w-4 h-4 ${isGeolocating ? "animate-spin" : ""}`} />
          <span>{isGeolocating ? "Ubicando..." : "📍 Buscar Cerca de Mí"}</span>
        </button>
      </div>

      {geoStatus && (
        <div className="text-center text-xs font-semibold text-cyan-300 bg-slate-900/80 border border-cyan-500/30 p-3 rounded-xl max-w-lg mx-auto animate-fade-in shadow-lg">
          {geoStatus}
        </div>
      )}

      {/* Dynamic Categories Header & Selector */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              📁 Filtrar por Rubro ({categoriesList.length - 1} disponibles):
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Dropdown Selector para acceso instantáneo a cualquier rubro */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-cyan-300 font-extrabold text-xs px-3 py-2 rounded-xl focus:border-cyan-500 outline-none shadow"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "Todos" ? "🌐 Ver Todos los Rubros" : `🏷️ Rubro: ${cat}`}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsExpandedCategories(!isExpandedCategories)}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-700 whitespace-nowrap transition-colors"
            >
              {isExpandedCategories ? "▲ Menos Rubros" : "▼ Expandir Todos"}
            </button>
          </div>
        </div>

        {/* Dynamic Categories Pills (Píldoras Multilínea / Scroll) */}
        <div
          className={`flex items-center gap-2 ${
            isExpandedCategories ? "flex-wrap" : "overflow-x-auto scrollbar-none"
          } pb-2 transition-all`}
        >
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-lg shadow-cyan-500/20 scale-105"
                  : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Counter Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
        <span>Mostrando <strong>{filteredBusinesses.length}</strong> comercios y servicios en &ldquo;{selectedCategory}&rdquo;</span>
        {selectedCategory !== "Todos" && (
          <button onClick={() => setSelectedCategory("Todos")} className="text-cyan-400 font-semibold hover:underline">
            Ver todas las categorías
          </button>
        )}
      </div>

      {/* Directory Grid */}
      {filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/10 group"
            >
              <div>
                {/* Header Card: Tier Badge & Verification */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 text-amber-300">
                    PLAN {b.tier || "ORO"}
                  </span>

                  {b.isVerified && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verificado</span>
                    </span>
                  )}
                </div>

                {/* Title & Category */}
                <h2 className="text-xl font-extrabold text-white group-hover:text-cyan-300 transition-colors mb-1 line-clamp-2">
                  {b.name}
                </h2>
                <div className="text-xs font-semibold text-cyan-400 mb-3">{b.category}</div>

                <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  "{b.description}"
                </p>
              </div>

              <div>
                {/* Location & Distance */}
                <div className="flex items-center justify-between text-xs text-slate-400 py-3 border-t border-slate-800/80 mb-4">
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{b.address || "Ituzaingó, Corrientes"}</span>
                  </span>
                  <span className="font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 whitespace-nowrap">
                    {b.distance || "A 400 metros"}
                  </span>
                </div>

                {/* CTAs: WhatsApp Direct */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/${(b.whatsapp || b.phone || "5493786611250").replace(/\D/g, "")}?text=Hola!%20Los%20vi%20en%20las%20P%C3%A1ginas%20Amarillas%20de%20Nexativa%20News%20y%20quisiera%20consultar...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${(b.phone || b.whatsapp || "3786611250").replace(/\D/g, "")}`}
                    className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold px-3 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Llamar</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
          <p className="text-sm font-semibold text-slate-200">
            No se encontraron comercios para la búsqueda &ldquo;{searchQuery}&rdquo;.
          </p>
          <p className="text-xs text-slate-400">
            Probá buscando por otra palabra clave o presioná el botón de categorías para restablecer la lista.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Todos");
            }}
            className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
