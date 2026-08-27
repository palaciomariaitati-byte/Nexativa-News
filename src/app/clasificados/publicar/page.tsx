"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/Classifieds/ImageUploader";
import { CompressionResult } from "@/lib/classifieds/imageCompressor";
import { uploadClassifiedPhoto, createClassified } from "@/lib/classifieds/queries";
import {
  ClassifiedCategory,
  ClassifiedCondition,
  CATEGORIES_MAP,
  CONDITIONS_MAP,
  POPULAR_LOCATIONS
} from "@/types/classifieds";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  MessageCircle,
  Tag,
  DollarSign
} from "lucide-react";

export default function PublicarClasificadoPage() {
  const router = useRouter();

  // Estados del Formulario
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ClassifiedCategory>("vehiculos");
  const [condition, setCondition] = useState<ClassifiedCondition>("buen_estado");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [acceptsTrade, setAcceptsTrade] = useState(false);
  const [location, setLocation] = useState("Ituzaingó, Corrientes");
  const [customLocation, setCustomLocation] = useState("");
  const [description, setDescription] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerWhatsapp, setSellerWhatsapp] = useState("");

  // Imágenes seleccionadas y comprimidas
  const [compressedPhotos, setCompressedPhotos] = useState<CompressionResult[]>([]);

  // Estados de Proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Asistente Nora para redacción
  const handleNoraGenerateDescription = async () => {
    if (!title.trim()) {
      setErrorMsg("Escribe primero un título básico (ej: 'Chevrolet Corsa 2012') para que Nora pueda redactar.");
      return;
    }
    setIsGeneratingAi(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/clasificados/nora-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          condition: CONDITIONS_MAP[condition],
          price,
          currency,
          notes: description
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          setDescription(data.description);
        }
      }
    } catch (err) {
      console.warn("[Nora Assist Error]:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Envío del Formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Por favor ingresa el título del artículo.");
      return;
    }
    if (!sellerName.trim()) {
      setErrorMsg("Por favor ingresa tu nombre de contacto.");
      return;
    }
    if (!sellerPhone.trim()) {
      setErrorMsg("Por favor ingresa tu número de teléfono o WhatsApp.");
      return;
    }
    if (compressedPhotos.length === 0) {
      setErrorMsg("Por favor sube al menos 1 foto del artículo.");
      return;
    }

    setIsSubmitting(true);
    setUploadStep(`Subiendo ${compressedPhotos.length} fotos optimizadas...`);

    try {
      // 1. Subir fotos a Supabase Storage
      const uploadedUrls: string[] = [];
      for (let i = 0; i < compressedPhotos.length; i++) {
        setUploadStep(`Subiendo foto ${i + 1} de ${compressedPhotos.length}...`);
        const photoUrl = await uploadClassifiedPhoto(compressedPhotos[i].blob, i + 1);
        if (photoUrl) {
          uploadedUrls.push(photoUrl);
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error("No se pudieron subir las imágenes. Por favor verifica tu conexión.");
      }

      setUploadStep("Guardando aviso en Clasificados Nexativa...");

      // 2. Guardar en Base de Datos
      const finalLocation = location === "Otra localidad" ? customLocation.trim() || "Ituzaingó, Corrientes" : location;
      const finalWhatsapp = (sellerWhatsapp.trim() || sellerPhone.trim()).replace(/\D/g, "");

      const result = await createClassified({
        title,
        category,
        condition,
        price: parseFloat(price) || 0,
        currency,
        is_negotiable: isNegotiable,
        accepts_trade: acceptsTrade,
        location: finalLocation,
        description: description.trim() || "Sin descripción adicional. Consultar por WhatsApp.",
        images: uploadedUrls,
        seller_name: sellerName,
        seller_phone: sellerPhone,
        seller_whatsapp: finalWhatsapp
      });

      if (result.success && result.id) {
        router.push(`/clasificados/${result.id}?published=true`);
      } else {
        throw new Error(result.error || "Error al publicar el aviso");
      }
    } catch (err: any) {
      console.error("[Publish Classified Error]:", err);
      setErrorMsg(err?.message || "Ocurrió un error al publicar el aviso. Intenta nuevamente.");
      setIsSubmitting(false);
      setUploadStep("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Cabecera y Volver */}
        <div className="space-y-3">
          <Link
            href="/clasificados"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver a Clasificados</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Publicar Artículo en <span className="text-cyan-400">Nexativa</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Completá los datos y subí hasta 10 fotos. Tu aviso se publicará gratis para toda la región.
          </p>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
          
          {/* 1. SECCIÓN DE FOTOS */}
          <div className="pb-6 border-b border-slate-800">
            <ImageUploader onImagesSelected={setCompressedPhotos} maxImages={10} />
          </div>

          {/* 2. DATOS DEL ARTÍCULO */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag size={18} className="text-cyan-400" />
              <span>Información del Producto</span>
            </h2>

            {/* Título */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Título del Aviso *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Volkswagen Gol Trend 2018 1.6 MSI o Soldadora Inverter Gamma 200A"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Categoría y Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ClassifiedCategory)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  {Object.entries(CATEGORIES_MAP).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estado del Producto *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ClassifiedCondition)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  {Object.entries(CONDITIONS_MAP).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Precio, Moneda y Opciones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Precio (0 para consultar)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {currency === "ARS" ? "$" : "USD"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej: 8500000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "ARS" | "USD")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ARS">🇦🇷 Pesos ($ ARS)</option>
                  <option value="USD">🇺🇸 Dólares (USD)</option>
                </select>
              </div>
            </div>

            {/* Checkboxes Negociable y Permuta */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Precio Negociable</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptsTrade}
                  onChange={(e) => setAcceptsTrade(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-emerald-400 font-semibold">Acepto Permuta por menor o igual valor</span>
              </label>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ubicación del Artículo *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
              >
                {POPULAR_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {location === "Otra localidad" && (
                <input
                  type="text"
                  required
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Escribe la ciudad y provincia (ej: Santo Tomé, Corrientes)"
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              )}
            </div>

            {/* Descripción + Asistente Nora */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Descripción Detallada
                </label>
                <button
                  type="button"
                  onClick={handleNoraGenerateDescription}
                  disabled={isGeneratingAi || !title.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles size={13} className={isGeneratingAi ? "animate-spin" : ""} />
                  <span>{isGeneratingAi ? "Nora redactando..." : "✨ Redactar con Nora IA"}</span>
                </button>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Escribe los detalles: kilómetros, año, mantenimiento, papeles al día, motivo de venta o lo que consideres importante..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* 3. DATOS DE CONTACTO */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageCircle size={18} className="text-emerald-400" />
              <span>Datos de Contacto Directo</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tu Nombre o Apodo *
                </label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Número de Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={sellerPhone}
                  onChange={(e) => {
                    setSellerPhone(e.target.value);
                    if (!sellerWhatsapp) setSellerWhatsapp(e.target.value);
                  }}
                  placeholder="Ej: 3786412345 (Con código de área)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botón Publicar */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:opacity-90 active:scale-98 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin text-slate-950" />
                  <span>{uploadStep || "Publicando..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Publicar Aviso en Clasificados Nexativa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
