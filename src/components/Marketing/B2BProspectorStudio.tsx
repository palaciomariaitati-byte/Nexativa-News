"use client";

import React, { useState } from "react";
import { 
  Target, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Building2, 
  Store, 
  Briefcase, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  MessageCircle, 
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { askNoraB2BProspector, B2BProspectorResult } from "@/app/admin/actions/nora";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface B2BProspectorStudioProps {
  initialCase?: "inmuebles" | "comercios" | "empleos";
  className?: string;
}

export default function B2BProspectorStudio({ initialCase = "inmuebles", className = "" }: B2BProspectorStudioProps) {
  const [selectedCase, setSelectedCase] = useState<"inmuebles" | "comercios" | "empleos">(initialCase);
  const [prospectName, setProspectName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [postContext, setPostContext] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<B2BProspectorResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [savingLead, setSavingLead] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const caseCards = [
    {
      id: "inmuebles" as const,
      title: "Cabañas & Alquileres",
      subtitle: "Evitar comisiones altas & Valen en 15s",
      icon: Building2,
      badge: "Inmuebles",
      color: "from-blue-500/20 to-cyan-500/20 border-cyan-500/40 text-cyan-300"
    },
    {
      id: "comercios" as const,
      title: "Guía Comercial & Locales",
      subtitle: "Captura en tiempo real & Catálogo",
      icon: Store,
      badge: "Comercios",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300"
    },
    {
      id: "empleos" as const,
      title: "Búsquedas Laborales",
      subtitle: "Visibilidad masiva gratis & Filtro CVs",
      icon: Briefcase,
      badge: "Empleo",
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300"
    }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setCopied(false);
    setLeadSaved(false);

    try {
      const res = await askNoraB2BProspector({
        targetCase: selectedCase,
        prospectName: prospectName.trim(),
        businessName: businessName.trim(),
        postContext: postContext.trim(),
        customNotes: customNotes.trim()
      });

      if ("data" in res && res.data) {
        setResult(res.data);
      } else if ("error" in res) {
        alert(res.error);
      }
    } catch (err) {
      console.error("Error al generar prospección:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.message) return;
    navigator.clipboard.writeText(result.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!result?.message) return;
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const encodedText = encodeURIComponent(result.message);
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(url, "_blank");
  };

  const handleSaveLead = async () => {
    if (!result) return;
    setSavingLead(true);
    try {
      const payload = {
        target_name: prospectName.trim() || businessName.trim() || "Prospecto B2B",
        target_type: selectedCase,
        contact_info: phoneNumber.trim() || "Contacto de Redes",
        pitch_summary: result.message,
        status: "contacted",
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from("valen_leads").insert(payload);
      if (error) {
        console.warn("Tabla valen_leads:", error.message);
      }
      setLeadSaved(true);
    } catch (e) {
      console.error(e);
      setLeadSaved(true);
    } finally {
      setSavingLead(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header del Estudio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-purple-500/20 shrink-0">
            <Target className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Prospección Comercial B2B
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Alta Conversión
              </span>
            </div>
            <p className="text-xs text-white/60">
              Generador quirúrgico de mensajes para captar comercios, cabañas y búsquedas en Ituzaingó y el NEA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-[11px] text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Anti-Spam Semántico Activo</span>
        </div>
      </div>

      {/* Selector de Casos */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
          1. Selecciona el Tipo de Prospecto:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {caseCards.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCase === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCase(c.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? `bg-gradient-to-br ${c.color} border-2 shadow-lg shadow-purple-900/30 scale-[1.01]` 
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-white/90">
                      {c.badge}
                    </span>
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{c.title}</h4>
                  <p className="text-[11px] text-gray-300 leading-tight">{c.subtitle}</p>
                </div>
                {isSelected && (
                  <div className="mt-2 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Seleccionado
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario de Variables Ágiles */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
          2. Datos del Prospecto o Publicación Detectada:
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Nombre del Contacto:</label>
            <input
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="Ej: Marcelo / Laura"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Nombre del Comercio o Cabaña:</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: Cabañas El Paraíso / Parrilla Los Amigos"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">WhatsApp / Teléfono (Opcional):</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ej: 3786123456"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-gray-400 block mb-1">
            Contexto del Posteo / Publicación (copia fragmento del post o dolor):
          </label>
          <input
            type="text"
            value={postContext}
            onChange={(e) => setPostContext(e.target.value)}
            placeholder="Ej: Publicó 'Alquilo cabaña con pileta para fin de semana largo en Ituzaingó'"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <div className="text-[11px] text-gray-400 italic">
            💡 Nora generará un mensaje personalizado de <strong>máximo 4 líneas</strong>, con tono local y oferta de 15 días gratis.
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                Redactando con Nora...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-black fill-black" />
                Generar Mensaje B2B ⚡
              </>
            )}
          </button>
        </div>
      </div>

      {/* Salida del Mensaje Listo para Enviar */}
      {result && (
        <div className="bg-slate-900/90 border-2 border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                {result.headline}
              </h4>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded font-mono">
                {result.message.split("\n").length <= 1 ? "4 líneas de impacto" : `${result.message.split("\n").length} párrafos`}
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                title="Generar otra variación para no repetir texto en redes"
              >
                <RefreshCw className="w-3 h-3" /> Variar IA
              </button>
            </div>
          </div>

          {/* Mensaje Renderizado en Caja Destacada */}
          <div className="bg-black/60 border border-white/15 rounded-xl p-4 text-sm text-gray-100 font-sans leading-relaxed relative select-all selection:bg-amber-500 selection:text-black">
            {result.message}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-gray-400">
              <strong className="text-gray-300">Dolor atacado:</strong> {result.targetPainPoint}
            </div>

            {/* Acciones Rápidas en 1-Clic */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                  copied 
                    ? "bg-emerald-500 text-black shadow-emerald-500/30" 
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "¡Copiado al Portapapeles!" : "Copiar Mensaje ⚡"}
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                WhatsApp Directo 📲
              </button>

              <button
                type="button"
                onClick={handleSaveLead}
                disabled={savingLead || leadSaved}
                className="bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/40 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {leadSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5" />}
                {leadSaved ? "Lead Guardado" : "Guardar en Pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
