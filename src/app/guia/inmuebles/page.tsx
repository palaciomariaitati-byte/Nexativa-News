"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Calendar,
  Search,
  Filter,
  Home,
  Users,
  MessageCircle,
  ExternalLink,
  PlusCircle,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Camera,
  Info
} from "lucide-react";

interface GalleryPhotoItem {
  id?: string;
  url: string;
  roomTag?: string;
  caption?: string;
}

function PropertyCard({ prop }: { prop: any }) {
  // Construir lista de fotos (soporta array de gallery_images o fallback a image_url)
  const photos: GalleryPhotoItem[] = Array.isArray(prop.gallery_images) && prop.gallery_images.length > 0
    ? prop.gallery_images
    : [{ url: prop.image_url || "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80", roomTag: "Fachada", caption: prop.title }];

  const [currentIdx, setCurrentIdx] = useState(0);
  const activePhoto = photos[currentIdx] || photos[0];

  const mapsLink = prop.maps_url || (prop.latitude && prop.longitude ? `https://www.google.com/maps/search/?api=1&query=${prop.latitude},${prop.longitude}` : null);

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col group">
      {/* Previsualización de Foto con Carrusel y Pie Descriptivo */}
      <div className="relative h-56 bg-slate-950 overflow-hidden select-none">
        <img
          src={activePhoto.url}
          alt={activePhoto.roomTag || prop.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badge de Estado Anti-Estafa */}
        <div className="absolute top-3 left-3 bg-slate-950/90 border border-emerald-500/40 text-emerald-400 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>
            {prop.status === "OCUPADO"
              ? "🔴 Ocupado"
              : prop.status === "EN_REPARACION"
              ? "🔧 En Reparación"
              : prop.status === "EN_PREPARACION"
              ? "🧹 En Preparación"
              : "🟢 Disponible • Verificado"}
          </span>
        </div>

        {/* Badge de Precio */}
        <div className="absolute top-3 right-3 bg-rose-500 text-slate-950 font-black text-xs px-3 py-1 rounded-lg shadow-lg z-10">
          ${Number(prop.price_per_night).toLocaleString("es-AR")} <span className="text-[10px] font-normal">/ noche</span>
        </div>

        {/* Controles de Navegación de Fotos (si tiene más de 1 foto) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all z-10 shadow"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all z-10 shadow"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Contador de fotos */}
            <div className="absolute top-12 right-3 bg-black/80 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-full border border-white/20 z-10">
              📷 {currentIdx + 1}/{photos.length}
            </div>
          </>
        )}

        {/* Pie Descriptivo Flotante del Espacio */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-rose-500/90 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
              {activePhoto.roomTag || "Ambiente"}
            </span>
            {activePhoto.caption && (
              <span className="text-xs text-slate-200 font-medium truncate drop-shadow">
                {activePhoto.caption}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Miniaturas de Fotos */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 p-2 bg-slate-950 overflow-x-auto border-b border-slate-800 scrollbar-none">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIdx(i)}
              className={`w-10 h-8 rounded overflow-hidden shrink-0 border transition-all ${
                i === currentIdx ? "border-rose-400 scale-105" : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img src={p.url} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Contenido de la Ficha */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-cyan-400">{prop.property_type}</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Users className="w-3.5 h-3.5" />
              <span>Hasta {prop.capacity_guests} huéspedes</span>
            </span>
          </div>

          <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors leading-tight">
            {prop.title}
          </h3>

          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <p className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{prop.address}</span>
            </p>

            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/60 px-2 py-1 rounded-lg shrink-0 transition-colors"
                title="Abrir mapa satelital GPS"
              >
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span>GPS</span>
              </a>
            )}
          </div>

          {prop.description && (
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-1">
              {prop.description}
            </p>
          )}
        </div>

        {/* Rango de Disponibilidad */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">🗓️ Disponible desde:</span>
            <span className="text-amber-400 font-bold">{prop.available_from}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">🗓️ Disponible hasta:</span>
            <span className="text-amber-400 font-bold">{prop.available_to}</span>
          </div>
        </div>

        {/* Datos del Propietario & Botón WhatsApp & GPS */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 truncate">
            <span className="block text-slate-500">Propietario Responsable:</span>
            <span className="font-bold text-slate-200">{prop.owner_name}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-colors"
                title="Cómo Llegar (Google Maps / Waze)"
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
              </a>
            )}

            <a
              href={`https://wa.me/549${prop.owner_phone}?text=${encodeURIComponent(
                `Hola ${prop.owner_name}, vi tu alquiler "${prop.title}" publicado en Nexativa News con calendario verificado (${prop.available_from} al ${prop.available_to}). Quisiera consultar disponibilidad.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortalInmueblesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [propertyType, setPropertyType] = useState("TODOS");

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (checkIn) params.append("check_in", checkIn);
      if (checkOut) params.append("check_out", checkOut);
      if (propertyType !== "TODOS") params.append("property_type", propertyType);

      const res = await fetch(`/api/inmuebles/list?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.properties) {
        setProperties(data.properties);
      }
    } catch (err) {
      console.error("Error al cargar inmuebles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [propertyType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white pb-16">
      
      {/* HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ALQUILERES VERIFICADOS & BLINDAJE ANTI-ESTAFAS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Portal de Inmuebles & Alquileres Temporarios
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Propiedades en Ituzaingó con **Galería Completa de Fotos**, **Geolocalización GPS** y **Calendario de Disponibilidad 100% Declarado**.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/guia/inmuebles/registro"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black px-5 py-3 rounded-xl text-sm transition-all shadow-lg shadow-rose-500/20"
            >
              <PlusCircle className="w-5 h-5 text-slate-950" />
              <span>Publicar Mi Inmueble (5 a 10 Fotos)</span>
            </Link>
            <Link
              href="/guia/inmuebles/propietario"
              className="inline-flex items-center gap-2 bg-slate-900 border border-rose-500/40 hover:bg-slate-800 text-rose-200 font-bold px-5 py-3 rounded-xl text-sm transition-all"
            >
              <span>🔑 App Propietario</span>
            </Link>
            <Link
              href="/guia/inmuebles/inquilino"
              className="inline-flex items-center gap-2 bg-slate-900 border border-emerald-500/40 hover:bg-slate-800 text-emerald-300 font-bold px-5 py-3 rounded-xl text-sm transition-all"
            >
              <span>🧳 App Inquilino (Check-In)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MOTOR DE BÚSQUEDA Y FILTRADO POR FECHAS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
        <form
          onSubmit={handleSearch}
          className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              📅 Fecha Desde
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              📅 Fecha Hasta
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              🏡 Tipo de Inmueble
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="CABAÑA">Cabaña</option>
              <option value="DEPARTAMENTO">Departamento</option>
              <option value="CASA">Casa</option>
              <option value="QUINTA">Quinta</option>
              <option value="LOCAL">Local / Eventos</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0 h-[38px]"
          >
            <Search className="w-4 h-4" />
            <span>Buscar Disponibles</span>
          </button>
        </form>
      </div>

      {/* GRILLA DE RESULTADOS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Inmuebles con Disponibilidad Garantizada</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
              {properties.length} encontrados
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-80" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
            <Home className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No se encontraron propiedades para ese rango de fechas.</h3>
            <p className="text-xs text-slate-400">
              Probá cambiar las fechas o seleccioná "Todos los Tipos" para ampliar tu búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <PropertyCard key={prop.id} prop={prop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
