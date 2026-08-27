import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchClassifiedById } from "@/lib/classifieds/queries";
import { CATEGORIES_MAP, CONDITIONS_MAP } from "@/types/classifieds";
import ClassifiedGallery from "@/components/Classifieds/ClassifiedGallery";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Sparkles,
  AlertTriangle
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassifiedDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const item = await fetchClassifiedById(resolvedParams.id);

  if (!item) {
    notFound();
  }

  const categoryInfo = CATEGORIES_MAP[item.category] || { label: "Varios", icon: "📦" };
  const conditionLabel = CONDITIONS_MAP[item.condition] || item.condition;

  const formattedPrice = item.price > 0
    ? item.currency === "USD"
      ? `USD ${item.price.toLocaleString("es-AR")}`
      : `$ ${item.price.toLocaleString("es-AR")}`
    : "Precio a Consultar";

  const cleanWhatsapp = (item.seller_whatsapp || item.seller_phone || "").replace(/\D/g, "");
  const whatsappMsg = encodeURIComponent(
    `¡Hola ${item.seller_name}! Te escribo por el aviso "${item.title}" que vi publicado en Clasificados Nexativa.`
  );
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${whatsappMsg}`;

  const formattedDate = new Date(item.created_at).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb & Volver */}
        <div className="flex items-center justify-between">
          <Link
            href="/clasificados"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver a Clasificados</span>
          </Link>

          <span className="text-xs text-slate-500 font-mono">
            Código de Aviso: #{item.id.slice(0, 8)}
          </span>
        </div>

        {/* Layout Principal: Galería (Izquierda) + Ficha Técnica y Contacto (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Galería de Fotos */}
          <div className="lg:col-span-7 space-y-6">
            <ClassifiedGallery images={item.images} title={item.title} />

            {/* Descripción Completa */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag size={18} className="text-cyan-400" />
                <span>Descripción del Artículo</span>
              </h2>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </div>
            </div>

            {/* Consejos de Seguridad */}
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <ShieldCheck size={16} />
                <span>Consejos de Seguridad para Compra-Venta Local</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>Coordiná encuentros en lugares públicos e iluminados para revisar el artículo.</li>
                <li>Verificá la documentación del vehículo antes de realizar cualquier pago o seña.</li>
                <li>Nunca envíes dinero por adelantado sin haber visto el producto en persona.</li>
              </ul>
            </div>
          </div>

          {/* Columna Derecha: Datos Clave y Contacto Directo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl">
              
              {/* Badges y Fecha */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-slate-300 border border-slate-800 font-semibold">
                  <span>{categoryInfo.icon}</span>
                  <span>{categoryInfo.label}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Calendar size={12} />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Título y Ubicación */}
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {item.title}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin size={14} className="text-cyan-400 shrink-0" />
                  <span>{item.location}</span>
                </div>
              </div>

              {/* Caja de Precio */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Precio de Venta
                </span>
                <div className="text-3xl font-black text-cyan-300 tracking-tight">
                  {formattedPrice}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.is_negotiable && (
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 text-[11px] font-semibold border border-cyan-800/40">
                      ✓ Precio Negociable
                    </span>
                  )}
                  {item.accepts_trade && (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[11px] font-semibold border border-emerald-800/40">
                      ✓ Acepta Permuta
                    </span>
                  )}
                </div>
              </div>

              {/* Ficha Técnica Rápida */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Estado</span>
                  <span className="text-xs font-semibold text-slate-200">{conditionLabel}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Ubicación</span>
                  <span className="text-xs font-semibold text-slate-200 line-clamp-1">{item.location}</span>
                </div>
              </div>

              {/* Caja de Contacto con el Vendedor */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Vendedor:</span>
                  <span className="text-sm font-bold text-white">{item.seller_name}</span>
                </div>

                {/* Botón WhatsApp Gigante */}
                {cleanWhatsapp && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <MessageCircle size={20} className="fill-white" />
                    <span>Contactar por WhatsApp</span>
                  </a>
                )}

                {/* Botón Llamar por Teléfono */}
                {item.seller_phone && (
                  <a
                    href={`tel:${item.seller_phone}`}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <Phone size={14} />
                    <span>Llamar al {item.seller_phone}</span>
                  </a>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
