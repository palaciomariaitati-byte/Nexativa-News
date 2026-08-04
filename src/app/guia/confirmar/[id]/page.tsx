"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, Building2, MapPin, Phone, Mail, Globe, ArrowRight, Sparkles, ExternalLink, Edit3, Save, X } from "lucide-react";

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  status: string;
  tier: string;
}

export default function ConfirmarFichaPage() {
  const params = useParams();
  const businessId = params?.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Estado editable
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    description: "",
    address: "",
    whatsapp: "",
    phone: "",
    email: "",
    website: "",
  });

  useEffect(() => {
    async function loadBusiness() {
      if (!businessId) return;

      try {
        const res = await fetch(`/api/guia/confirm?id=${businessId}`);
        const data = await res.json();

        if (data.success && data.business) {
          setBusiness(data.business);
          setEditForm({
            name: data.business.name || "",
            category: data.business.category || "",
            description: data.business.description || "",
            address: data.business.address || "Ituzaingó, Corrientes",
            whatsapp: data.business.whatsapp || "",
            phone: data.business.phone || "",
            email: data.business.email || "",
            website: data.business.website || "",
          });
          if (data.business.status === "ACTIVE") {
            setActivated(true);
          }
        } else {
          // Fallback de datos si es demostración
          const demoObj = {
            id: businessId,
            name: "Tu Comercio Socio",
            category: "Servicios Generales & Comercio",
            description: "Ficha comercial pre-aprobada para la Guía Comunitaria de Nexativa News.",
            address: "Ituzaingó, Corrientes",
            city: "Ituzaingó",
            province: "Corrientes",
            phone: "5493786401122",
            whatsapp: "5493786401122",
            email: "contacto@comercio.com.ar",
            website: "",
            status: "DRAFT",
            tier: "BRONCE",
          };
          setBusiness(demoObj);
          setEditForm({
            name: demoObj.name,
            category: demoObj.category,
            description: demoObj.description,
            address: demoObj.address,
            whatsapp: demoObj.whatsapp,
            phone: demoObj.phone,
            email: demoObj.email,
            website: demoObj.website,
          });
        }
      } catch (err: any) {
        console.warn("Error cargando ficha:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [businessId]);

  const handleActivate = async () => {
    setActivating(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/guia/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: businessId,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActivated(true);
        setIsEditing(false);
        if (data.business) {
          setBusiness(data.business);
        }
      } else {
        setErrorMsg(data.error || "No se pudo activar la ficha.");
      }
    } catch (err: any) {
      setErrorMsg("Error de conexión al activar la ficha.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="text-center text-slate-400 text-sm">Cargando vista previa institucional...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header Institucional */}
        <div className="text-center mb-8 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Invitación Institucional de Cortesía • Nexativa News</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Confirmación & Edición de Ficha Comercial
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Verificá o edita los datos de tu empresa antes de ser publicada oficialmente en las Páginas Amarillas 2.0.
          </p>
        </div>

        {/* Mensaje de Bienvenida Institucional */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-6 leading-relaxed text-sm text-slate-300 shadow-xl">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <span>🏛️</span>
            <span>Estimado referente de {editForm.name || business?.name}:</span>
          </h2>
          <p className="mb-3">
            Desde la Redacción de <strong>Nexativa News</strong> (nexativanews.com.ar), seleccionamos a tu empresa para otorgarle una <strong>Ficha Digital de Cortesía 100% Gratuita</strong> en nuestra Guía Comercial.
          </p>
          <p className="text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            ✏️ <strong>Podés ajustar tus datos:</strong> Si querés modificar el nombre, rubro, WhatsApp o descripción, presioná <strong>"Editar Mis Datos"</strong> abajo antes de activar.
          </p>
        </div>

        {/* Tarjeta Vista Previa o Formulario Editable del Comercio */}
        {business && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 mb-2 inline-block">
                  {editForm.category || business.category}
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  {editForm.name || business.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!activated && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Ver Previa" : "Editar Mis Datos"}</span>
                  </button>
                )}
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⭐ CORTESÍA DESTACADA
                </span>
              </div>
            </div>

            {/* MODO EDICIÓN PREVIA */}
            {isEditing ? (
              <div className="space-y-4 mb-6 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nombre Comercial / Razón Social *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold focus:border-cyan-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Rubro / Categoría *</label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">WhatsApp de Ventas *</label>
                    <input
                      type="text"
                      placeholder="Ej: 549378640..."
                      value={editForm.whatsapp}
                      onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Descripción del Negocio & Ofertas</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-cyan-500 outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Dirección Física</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              /* MODO VISTA PREVIA NORMAL */
              <div>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  "{editForm.description || business.description}"
                </p>

                <div className="space-y-2 text-xs text-slate-300 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{editForm.address || business.address}</span>
                  </div>
                  {(editForm.whatsapp || business.whatsapp) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>WhatsApp de Ventas: +{editForm.whatsapp || business.whatsapp}</span>
                    </div>
                  )}
                  {(editForm.email || business.email) && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span>{editForm.email || business.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estado e Interacción */}
            {activated ? (
              <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-5 text-center text-emerald-200 space-y-3">
                <div className="inline-flex p-2 bg-emerald-500/20 rounded-full text-emerald-400 mb-1">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">¡Ficha Comercial Activada y Publicada!</h4>
                <p className="text-xs text-emerald-300">
                  Tu comercio ya se encuentra activo públicamente en las Páginas Amarillas 2.0.
                </p>
                <div className="pt-2">
                  <Link
                    href="/guia"
                    target="_blank"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <span>🌐 Ver Mi Ficha Pública en /guia</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-950/80 border border-rose-700/50 text-rose-300 text-xs rounded-xl">
                    {errorMsg}
                  </div>
                )}
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="w-full py-4 px-6 rounded-xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-base shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>
                    {activating ? "Activando Ficha Comercial..." : "🚀 CONFIRMAR Y ACTIVAR MI FICHA GRATIS"}
                  </span>
                </button>

                <p className="text-[11px] text-center text-slate-400 leading-tight">
                  Al hacer clic en Confirmar, autorizás la publicación gratuita de tus datos de contacto comercial en Nexativa News. Podés modificar o dar de baja tu ficha en cualquier momento.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Institucional */}
        <div className="text-center border-t border-slate-800/80 pt-6 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Nexativa News • Periodismo de Cercanía & Marketplace Local</p>
          <p className="text-[11px]">Ituzaingó, Corrientes, Argentina • nexativanews.com.ar</p>
        </div>
      </div>
    </div>
  );
}
