"use client";

import React from "react";
import { ClassifiedCategory, CATEGORIES_MAP, POPULAR_LOCATIONS } from "@/types/classifieds";
import { Search, Filter, MapPin, DollarSign, RefreshCw } from "lucide-react";

interface Props {
  selectedCategory: ClassifiedCategory | "todas";
  onSelectCategory: (cat: ClassifiedCategory | "todas") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  selectedCurrency: "ALL" | "ARS" | "USD";
  onCurrencyChange: (curr: "ALL" | "ARS" | "USD") => void;
  onlyTrade: boolean;
  onToggleTrade: () => void;
  onReset: () => void;
}

export default function ClassifiedFilters({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedCurrency,
  onCurrencyChange,
  onlyTrade,
  onToggleTrade,
  onReset
}: Props) {
  const categoriesList: (ClassifiedCategory | "todas")[] = [
    "todas",
    "vehiculos",
    "herramientas",
    "tecnologia",
    "electrodomesticos",
    "hogar",
    "inmuebles",
    "indumentaria",
    "otros"
  ];

  return (
    <div className="w-full space-y-4">
      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar autos, motos, herramientas, electrodomésticos..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500 transition-colors shadow-inner"
          />
        </div>

        {/* Selector de Ubicación */}
        <div className="relative sm:w-56">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full pl-9 pr-8 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-500 appearance-none cursor-pointer"
          >
            <option value="todas">📍 Todas las zonas</option>
            {POPULAR_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Moneda & Permuta */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedCurrency === "ALL") onCurrencyChange("ARS");
              else if (selectedCurrency === "ARS") onCurrencyChange("USD");
              else onCurrencyChange("ALL");
            }}
            className="px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Filtrar por moneda"
          >
            {selectedCurrency === "ALL" ? "💵 Moneda: Todas" : selectedCurrency === "ARS" ? "🇦🇷 Pesos ($)" : "🇺🇸 Dólares (USD)"}
          </button>

          <button
            type="button"
            onClick={onToggleTrade}
            className={`px-3.5 py-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              onlyTrade
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Acepta permuta"
          >
            🔄 Permuta
          </button>
        </div>
      </div>

      {/* Píldoras de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {categoriesList.map((catKey) => {
          const isSelected = selectedCategory === catKey;
          const isAll = catKey === "todas";
          const catInfo = isAll ? { label: "Todos los Clasificados", icon: "✨" } : CATEGORIES_MAP[catKey as ClassifiedCategory];

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => onSelectCategory(catKey)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold"
                  : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
              }`}
            >
              <span>{catInfo.icon}</span>
              <span>{catInfo.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
