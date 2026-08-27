"use client";

import React from "react";
import Link from "next/link";
import { ClassifiedItem, CATEGORIES_MAP, CONDITIONS_MAP } from "@/types/classifieds";
import { MapPin, MessageCircle, ArrowUpRight, Sparkles, Tag } from "lucide-react";

interface Props {
  item: ClassifiedItem;
}

export default function ClassifiedCard({ item }: Props) {
  const mainImage = item.images && item.images.length > 0
    ? item.images[0]
    : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

  const categoryInfo = CATEGORIES_MAP[item.category] || { label: "Varios", icon: "📦" };
  const conditionLabel = CONDITIONS_MAP[item.condition] || item.condition;

  const formattedPrice = item.price > 0
    ? item.currency === "USD"
      ? `USD ${item.price.toLocaleString("es-AR")}`
      : `$ ${item.price.toLocaleString("es-AR")}`
    : "Consultar";

  const cleanWhatsapp = (item.seller_whatsapp || item.seller_phone || "").replace(/\D/g, "");
  const whatsappMsg = encodeURIComponent(
    `¡Hola ${item.seller_name}! Te escribo por el aviso "${item.title}" publicado en Clasificados Nexativa.`
  );
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${whatsappMsg}`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
      {/* Contenedor de Imagen y Badges */}
      <Link href={`/clasificados/${item.id}`} className="relative aspect-4/3 w-full overflow-hidden bg-slate-950 block">
        <img
          src={mainImage}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradiente de sombra */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

        {/* Badge de Categoría */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-slate-700/60 shadow-md">
          <span>{categoryInfo.icon}</span>
          <span>{categoryInfo.label}</span>
        </div>

        {/* Badge Destacado */}
        {item.is_featured && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 shadow-md animate-pulse">
            <Sparkles size={12} className="fill-slate-950" />
            <span>DESTACADO</span>
          </div>
        )}

        {/* Cantidad de fotos */}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 rounded-md bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-800">
            📷 {item.images.length} fotos
          </div>
        )}
      </Link>

      {/* Cuerpo de la Card */}
      <div className="flex flex-1 flex-col p-4">
        {/* Ubicación y Estado */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 line-clamp-1">
            <MapPin size={12} className="text-cyan-400 shrink-0" />
            {item.location}
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-medium">
            {conditionLabel}
          </span>
        </div>

        {/* Título */}
        <Link href={`/clasificados/${item.id}`} className="group-hover:text-cyan-400 transition-colors">
          <h3 className="font-bold text-white text-base leading-snug line-clamp-2 mb-2">
            {item.title}
          </h3>
        </Link>

        {/* Precio & Opciones */}
        <div className="mt-auto pt-2 border-t border-slate-800/60 flex items-baseline justify-between">
          <div>
            <div className="text-lg font-black text-cyan-300 tracking-tight">
              {formattedPrice}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              {item.is_negotiable && <span>• Negociable</span>}
              {item.accepts_trade && <span className="text-emerald-400 font-semibold">• Permuta</span>}
            </div>
          </div>

          {/* Botón WhatsApp */}
          {cleanWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all"
              title="Consultar por WhatsApp"
            >
              <MessageCircle size={14} className="fill-white" />
              <span>Contactar</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
