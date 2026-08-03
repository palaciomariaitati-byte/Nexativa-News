"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PrestadoresDashboardPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentJobId, setCurrentJobId] = useState('');

  const providerData = {
    name: 'Don Pedro González',
    trade: 'Plomero / Gasista Matriculado',
    noraScore: 4.95,
    totalJobs: 28,
    badge: 'ORO',
    whatsapp: '5493786401122',
  };

  const handleGenerateQR = () => {
    // Generar un ID dinámico único para la sesión de trabajo
    const jobId = `JOB-${Date.now().toString().slice(-6)}`;
    setCurrentJobId(jobId);
    setShowQRModal(true);
  };

  const ratingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/calificar/${currentJobId}`
    : `https://www.nexativanews.com.ar/calificar/${currentJobId}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    ratingUrl
  )}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 sm:p-6 font-sans flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">
        {/* Header App Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
              PRO
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{providerData.name}</h1>
              <p className="text-xs text-emerald-400 font-semibold">{providerData.trade}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            🥇 {providerData.badge}
          </span>
        </div>

        {/* Switch de Disponibilidad Estilo Uber Driver */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 shadow-xl text-center">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
            Estado de Disponibilidad en Vivo
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                isOnline
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-300 animate-ping' : 'bg-rose-500'}`}></span>
              {isOnline ? '🟢 DISPONIBLE PARA TRABAJOS' : '🔴 OCUPADO / NO DISPONIBLE'}
            </button>
          </div>
        </div>

        {/* Métricas NoraScore™ */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-gray-400 font-semibold block mb-1">NoraScore™</span>
            <div className="flex items-center justify-center gap-1">
              <span className="text-amber-400 text-lg">⭐</span>
              <span className="text-2xl font-extrabold text-white">{providerData.noraScore}</span>
            </div>
          </div>
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-gray-400 font-semibold block mb-1">Trabajos Verificados</span>
            <span className="text-2xl font-extrabold text-emerald-400">{providerData.totalJobs}</span>
          </div>
        </div>

        {/* Botón Principal: Finalizar Trabajo y Mostrar QR */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 mb-6 text-center shadow-xl">
          <h2 className="text-xl font-bold text-white mb-2">⚡ ¿Terminaste un Trabajo?</h2>
          <p className="text-xs text-gray-300 mb-6">
            Muestrale el Código QR a tu cliente para que te califique en el acto y sumes estrellas a tu perfil.
          </p>

          <button
            onClick={handleGenerateQR}
            className="w-full py-4 px-6 rounded-xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            📱 GENERAR QR DE CALIFICACIÓN INSTANTÁNEA
          </button>
        </div>

        {/* Links útiles */}
        <div className="space-y-2 mb-8">
          <Link
            href={`/certificados/3`}
            className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2 transition-colors"
          >
            📜 Mi Certificado de Excelencia Imprimible
          </Link>
          <Link
            href="/empleos"
            className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-semibold text-center block transition-colors"
          >
            🌐 Ver Mi Perfil Público en Nexativa Empleos
          </Link>
        </div>
      </div>

      {/* Footer Legal Shield Disclaimer */}
      <div className="max-w-md mx-auto w-full pt-4 border-t border-gray-800/60 text-center">
        <p className="text-[10px] text-gray-500 leading-tight">
          ⚖️ <strong>Aviso Legal y Deslinde de Responsabilidad:</strong> Nexativa News e IA Nora actúan únicamente como soporte tecnológico y nexo comunitario gratuito de contacto entre particulares independientes. Nexativa News no asume responsabilidad civil, laboral ni comercial sobre la ejecución de los trabajos.
        </p>
      </div>

      {/* Modal QR de Cobro / Calificación en Vivo */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-emerald-500/40 rounded-3xl max-w-sm w-full p-6 text-center text-gray-100 shadow-2xl">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Calificación en el Momento
            </span>
            <h3 className="text-xl font-extrabold text-white mb-4">
              Pedile a tu cliente que escanee este QR
            </h3>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrApiUrl}
              alt="QR de Calificación Instantánea"
              className="w-60 h-60 mx-auto bg-white p-3 rounded-2xl shadow-xl border-4 border-emerald-500/30 mb-4"
            />

            <p className="text-xs text-gray-300 mb-6">
              El cliente calificará con 5 estrellas desde su teléfono sin necesidad de instalar nada.
            </p>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-sm"
            >
              Cerrar Pantalla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
