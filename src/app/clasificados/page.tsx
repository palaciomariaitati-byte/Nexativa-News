"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchClassifieds } from "@/lib/classifieds/queries";
import { ClassifiedItem, ClassifiedCategory, CATEGORIES_MAP } from "@/types/classifieds";
import ClassifiedCard from "@/components/Classifieds/ClassifiedCard";
import ClassifiedFilters from "@/components/Classifieds/ClassifiedFilters";
import { PlusCircle, ShoppingBag, Sparkles, ShieldCheck, MessageCircle, RefreshCw, Car, Wrench, Smartphone, Home } from "lucide-react";

export default function ClasificadosPage() {
  const [items, setItems] = useState<ClassifiedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ClassifiedCategory | "todas">("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("todas");
  const [selectedCurrency, setSelectedCurrency] = useState<"ALL" | "ARS" | "USD">("ALL");
  const [onlyTrade, setOnlyTrade] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    const data = await fetchClassifieds({
      category: selectedCategory,
      query: searchQuery,
      location: selectedLocation,
      currency: selectedCurrency === "ALL" ? undefined : selectedCurrency,
      onlyTrade
    });
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, selectedLocation, selectedCurrency, onlyTrade]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Sparkles size={13} />
                <span>Mercado Regional y Segunda Mano</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Clasificados <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">Nexativa</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Comprá y vendé autos, motos, herramientas, tecnología y artículos del hogar en Ituzaingó y la región. Trato directo entre particulares por WhatsApp, sin intermediarios ni comisiones.
              </p>
            </div>

            {/* CTA Publicar */}
            <div className="shrink-0">
              <Link
                href="/clasificados/publicar"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:opacity-95 active:scale-95 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <PlusCircle size={20} className="fill-slate-950 stroke-white" />
                <span>Publicar mi Aviso Gratis</span>
              </Link>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="mt-8">
            <ClassifiedFilters
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
              onlyTrade={onlyTrade}
              onToggleTrade={() => setOnlyTrade(!onlyTrade)}
              onReset={() => {
                setSelectedCategory("todas");
                setSearchQuery("");
                setSelectedLocation("todas");
                setSelectedCurrency("ALL");
                setOnlyTrade(false);
              }}
            />
          </div>
        </div>
      </section>

      {/* Grid de Clasificados */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Cabecera de resultados */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag size={18} className="text-cyan-400" />
            <span>
              {selectedCategory === "todas" ? "Todos los Artículos" : CATEGORIES_MAP[selectedCategory]?.label}
            </span>
            <span className="text-xs font-mono text-slate-400 font-normal">
              ({items.length} disponibles)
            </span>
          </h2>

          <button
            onClick={loadItems}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-4/3 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <ClassifiedCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="my-12 flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShoppingBag size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No encontramos avisos en este momento</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                {searchQuery || selectedCategory !== "todas"
                  ? "Probá cambiando los filtros de búsqueda o categoría."
                  : "¡Sé el primero de tu barrio en publicar un auto, moto, herramienta o electrodoméstico!"}
              </p>
            </div>
            <Link
              href="/clasificados/publicar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg"
            >
              <PlusCircle size={16} />
              <span>Publicar Primer Aviso</span>
            </Link>
          </div>
        )}

        {/* Sección de Confianza & Seguridad Regional */}
        <section className="mt-20 pt-10 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Car size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Hasta 10 Fotos por Aviso</h4>
              <p className="text-xs text-slate-400 mt-1">
                Subí todas las fotos de tu auto, moto o producto con compresión automática en alta definición.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <MessageCircle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Trato Directo por WhatsApp</h4>
              <p className="text-xs text-slate-400 mt-1">
                Los compradores te escriben directo a tu celular. Sin intermediarios ni comisiones de venta.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Local y Seguro</h4>
              <p className="text-xs text-slate-400 mt-1">
                Pensado para vecinos de Ituzaingó, Villa Olivari, Apipé, Posadas y la región.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
