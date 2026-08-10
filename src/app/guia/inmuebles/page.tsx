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
} from "lucide-react";

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
            Propiedades en Ituzaingó con **Calendario de Disponibilidad 100% Declarado**. Propietarios sujetos a normas estrictas de veracidad y sanciones por imprecisión.
          </p>

          <div className="pt-2">
            <Link
              href="/guia/inmuebles/registro"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-rose-500/20"
            >
              <PlusCircle className="w-5 h-5 text-slate-950" />
              <span>Publicar Mi Inmueble con Calendario Verificado</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MOTOR DE BÚSQUEDA Y FILTRADO POR FECHAS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
        <form
          onSubmit={handleSearch}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              📅 Fecha Entrada (Check-In)
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              📅 Fecha Salida (Check-Out)
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              🏡 Tipo de Inmueble
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="CABAÑA">Cabañas</option>
              <option value="DEPARTAMENTO">Departamentos</option>
              <option value="CASA">Casas</option>
              <option value="QUINTA">Quintas / Eventos</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-slate-950" />
            <span>Buscar Disponibilidad</span>
          </button>
        </form>
      </div>

      {/* REJILLA DE PROPIEDADES */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-white">Alquileres Verificados con Calendario Activo</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{properties.length} propiedades encontradas</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse font-mono">
            Buscando inmuebles verificados en la base de datos...
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
              <div
                key={prop.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col group"
              >
                {/* Previsualización de Foto */}
                <div className="relative h-48 bg-slate-950 overflow-hidden">
                  <img
                    src={
                      prop.image_url ||
                      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/90 border border-emerald-500/40 text-emerald-400 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
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
                  <div className="absolute bottom-3 right-3 bg-rose-500 text-slate-950 font-black text-xs px-3 py-1 rounded-lg shadow-lg">
                    ${Number(prop.price_per_night).toLocaleString("es-AR")} <span className="text-[10px] font-normal">/ noche</span>
                  </div>
                </div>

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

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{prop.address}</span>
                    </p>

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

                  {/* Datos del Propietario & Botón WhatsApp */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 truncate">
                      <span className="block text-slate-500">Propietario Responsable:</span>
                      <span className="font-bold text-slate-200">{prop.owner_name}</span>
                    </div>

                    <a
                      href={`https://wa.me/549${prop.owner_phone}?text=${encodeURIComponent(
                        `Hola ${prop.owner_name}, vi tu alquiler "${prop.title}" publicado en Nexativa News con calendario verificado (${prop.available_from} al ${prop.available_to}). Quisiera consultar disponibilidad.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shrink-0"
                    >
                      <MessageCircle className="w-4 h-4 fill-slate-950" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
