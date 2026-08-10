"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Star,
  MessageSquare,
  AlertCircle,
  Home,
  ShieldCheck,
  Send,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";

export default function AppInquilinoPage() {
  const [reservationCode, setReservationCode] = useState("");
  const [authenticatedGuest, setAuthenticatedGuest] = useState<any>(null);

  // Estados del Inquilino
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkOutDone, setCheckOutDone] = useState(false);

  // Formulario de Valoración y Reclamo
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [claimText, setClaimText] = useState("");
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const handleSearchReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationCode.trim()) return;

    // Simular o cargar reserva activa
    const guestData = {
      code: reservationCode.trim(),
      property_title: "Cabaña La Ribera del Paraná",
      address: "Barrio San Jorge s/n, Ituzaingó, Corrientes",
      owner_name: "Carlos Alberto Rodríguez",
      owner_phone: "3786401199",
      check_in_date: "2026-08-10",
      check_out_date: "2026-08-15",
    };
    setAuthenticatedGuest(guestData);
  };

  const handleCheckIn = () => {
    setCheckInDone(true);
    alert("¡Check-In Digital confirmado! Tu llegada ha sido notificada al propietario y registrada en el sistema.");
  };

  const handleCheckOut = () => {
    setCheckOutDone(true);
    alert("¡Check-Out Digital confirmado! Gracias por tu estadía.");
  };

  const handleSendReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewSubmitted(true);
  };

  const handleSendClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) return;
    setClaimSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* HEADER APP INQUILINO */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              🧳
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">App Inquilino & Check-In</h1>
              <p className="text-[10px] text-slate-400 font-mono">Nexativa News • Alquileres Verificados</p>
            </div>
          </div>

          <Link
            href="/guia/inmuebles"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-cyan-500/30"
          >
            🌐 Portal de Alquileres
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* BÚSQUEDA DE RESERVA */}
        {!authenticatedGuest ? (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white">Portal del Inquilino</h2>
              <p className="text-xs text-slate-400">
                Ingresá tu código de reserva o DNI para gestionar tu Check-In, Check-Out y calificaciones.
              </p>
            </div>

            <form onSubmit={handleSearchReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Código de Reserva o DNI del Inquilino *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: RES-1092 u tu DNI"
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm shadow-xl shadow-emerald-500/20"
              >
                📲 Acceder a Mi Estadía
              </button>
            </form>
          </div>
        ) : (
          /* PANEL DE ESTADÍA DEL INQUILINO */
          <div className="space-y-8">
            
            {/* FICHA DE LA RESERVA ACTIVA */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] uppercase">
                    Reserva Confirmada
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">{authenticatedGuest.property_title}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{authenticatedGuest.address}</span>
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-slate-300">
                  <p>Código: <strong className="text-amber-400">{authenticatedGuest.code}</strong></p>
                  <p className="text-slate-400">Titular: {authenticatedGuest.owner_name}</p>
                </div>
              </div>

              {/* BOTONES DE CHECK-IN Y CHECK-OUT DIGITAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Check-In */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Check-In: {authenticatedGuest.check_in_date}
                    </span>
                    {checkInDone ? (
                      <span className="text-emerald-400 font-black">✓ Realizado</span>
                    ) : (
                      <span className="text-amber-400">Pendiente</span>
                    )}
                  </div>
                  <button
                    onClick={handleCheckIn}
                    disabled={checkInDone}
                    className="w-full py-3 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 text-slate-950 disabled:text-emerald-400 border border-emerald-500/40 transition-all"
                  >
                    {checkInDone ? "✓ Check-In Confirmado" : "📲 Realizar Check-In Digital"}
                  </button>
                </div>

                {/* Check-Out */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-rose-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Check-Out: {authenticatedGuest.check_out_date}
                    </span>
                    {checkOutDone ? (
                      <span className="text-emerald-400 font-black">✓ Realizado</span>
                    ) : (
                      <span className="text-slate-400">Pendiente</span>
                    )}
                  </div>
                  <button
                    onClick={handleCheckOut}
                    disabled={checkOutDone}
                    className="w-full py-3 rounded-xl font-black text-xs bg-rose-500 hover:bg-rose-400 disabled:bg-rose-950 text-slate-950 disabled:text-rose-400 border border-rose-500/40 transition-all"
                  >
                    {checkOutDone ? "✓ Check-Out Confirmado" : "📲 Realizar Check-Out Digital"}
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: VALORACIÓN Y RESEÑA (1-5 ESTRELLAS) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-amber-400 font-black text-base">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>Valoración y Reseña de tu Estadía</span>
              </div>

              {reviewSubmitted ? (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-bold text-center space-y-1">
                  <p className="text-sm font-black text-white">¡Gracias por tu opinión!</p>
                  <p>Tu valoración de {rating} estrellas ha sido enviada para calificar la trayectoria del propietario.</p>
                </div>
              ) : (
                <form onSubmit={handleSendReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Calificación (1 a 5 Estrellas)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-400 transition-colors"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Comentario sobre la propiedad y atención *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Contanos tu experiencia (limpieza, veracidad del calendario, atención del propietario)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl font-black bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs shadow-lg"
                  >
                    ⭐ Enviar Reseña y Puntuación
                  </button>
                </form>
              )}
            </div>

            {/* SECCIÓN 2: CANAL DIRECTO DE SUGERENCIA / RECLAMO */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-cyan-400 font-black text-base">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <span>Sugerencia o Reclamo Directo</span>
              </div>

              {claimSubmitted ? (
                <div className="p-4 bg-cyan-950/80 border border-cyan-500/40 rounded-2xl text-cyan-200 text-xs font-bold text-center space-y-1">
                  <p className="text-sm font-black text-white">Reclamo / Sugerencia Registrada</p>
                  <p>El equipo de soporte de Nexativa News ha recibido tu mensaje para auditar el caso.</p>
                </div>
              ) : (
                <form onSubmit={handleSendClaim} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Describí tu sugerencia o eventualidad *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Detallá cualquier observación o reclamo sobre tu estadía..."
                      value={claimText}
                      onChange={(e) => setClaimText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs shadow-lg"
                  >
                    📩 Enviar a Soporte
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
