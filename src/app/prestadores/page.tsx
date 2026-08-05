"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function PrestadoresContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');
  const queryName = searchParams.get('name');

  const [isOnline, setIsOnline] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [currentJobId, setCurrentJobId] = useState('');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  const [providerData, setProviderData] = useState({
    id: '1',
    name: 'Cargando perfil...',
    trade: 'Prestador Registrado',
    noraScore: 5.0,
    totalJobs: 1,
    badge: 'BRONCE',
    whatsapp: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    async function loadActiveProvider() {
      let profiles: any[] = [];
      try {
        const res = await fetch('/api/jobs/profiles');
        const data = await res.json();
        if (data.success && Array.isArray(data.profiles)) {
          profiles = data.profiles;
          setAllProfiles(profiles);
        }
      } catch (e) {}

      // 1. Si viene por query param name o id
      if (queryName || queryId) {
        const found = profiles.find(p => p.id === queryId || p.full_name.toLowerCase().includes((queryName || '').toLowerCase()));
        if (found) {
          const profileData = {
            id: found.id,
            name: found.full_name,
            trade: found.trade_category,
            noraScore: Number(found.nora_score || 5.0),
            totalJobs: Number(found.total_reviews || 1),
            badge: found.badge_level || 'BRONCE',
            whatsapp: found.whatsapp || '',
            status: found.status || 'ACTIVE',
          };
          setIsOnline(found.status !== 'BUSY');
          setProviderData(profileData);
          try {
            localStorage.setItem('nexativa_active_prestador', JSON.stringify(profileData));
          } catch (e) {}
          return;
        }
      }

      // 2. Si hay un prestador activo guardado en el teléfono
      try {
        const saved = localStorage.getItem('nexativa_active_prestador');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) {
            setIsOnline(parsed.status !== 'BUSY');
            setProviderData(parsed);
            return;
          }
        }
      } catch (e) {}

      // 3. Fallback al primer perfil de la lista o genérico
      if (profiles.length > 0) {
        const first = profiles[0];
        const profileData = {
          id: first.id,
          name: first.full_name,
          trade: first.trade_category,
          noraScore: Number(first.nora_score || 5.0),
          totalJobs: Number(first.total_reviews || 1),
          badge: first.badge_level || 'BRONCE',
          whatsapp: first.whatsapp || '',
          status: first.status || 'ACTIVE',
        };
        setIsOnline(first.status !== 'BUSY');
        setProviderData(profileData);
      } else {
        setProviderData({
          id: '1',
          name: 'Prestador de Oficio',
          trade: 'Especialista Registrado',
          noraScore: 5.0,
          totalJobs: 1,
          badge: 'BRONCE',
          whatsapp: '',
          status: 'ACTIVE',
        });
      }
    }

    loadActiveProvider();
  }, [queryId, queryName]);

  const [providerZone, setProviderZone] = useState('Ituzaingó Centro');
  const [detectingGPS, setDetectingGPS] = useState(false);

  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    const newStatus = nextState ? 'ACTIVE' : 'BUSY';

    const updatedData = { ...providerData, status: newStatus };
    setProviderData(updatedData);

    try {
      localStorage.setItem('nexativa_active_prestador', JSON.stringify(updatedData));
      
      const savedProfiles = localStorage.getItem('nexativa_job_profiles_v1');
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        if (Array.isArray(parsed)) {
          const updatedProfiles = parsed.map((p: any) => 
            p.id === providerData.id || p.full_name === providerData.name ? { ...p, status: newStatus } : p
          );
          localStorage.setItem('nexativa_job_profiles_v1', JSON.stringify(updatedProfiles));
        }
      }

      await fetch('/api/jobs/profiles/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: providerData.id, status: newStatus }),
      });
    } catch (e) {}
  };

  const handleUpdateZone = (zone: string) => {
    setProviderZone(zone);
    const updatedData = { ...providerData, city: zone };
    setProviderData(updatedData as any);
    try {
      localStorage.setItem('nexativa_active_prestador', JSON.stringify(updatedData));
    } catch (e) {}
  };

  const handleDetectGPS = () => {
    setDetectingGPS(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetectingGPS(false);
          const zoneStr = `GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`;
          handleUpdateZone(zoneStr);
          alert(`Ubicación GPS fijada: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setDetectingGPS(false);
          alert("No se pudo obtener el GPS. Seleccioná tu barrio manualmente.");
        }
      );
    } else {
      setDetectingGPS(false);
      alert("GPS no soportado en este dispositivo.");
    }
  };

  const handleSelectProfile = (profile: any) => {
    const isAct = profile.status !== 'BUSY';
    setIsOnline(isAct);
    const selected = {
      id: profile.id,
      name: profile.full_name,
      trade: profile.trade_category,
      noraScore: Number(profile.nora_score || 5.0),
      totalJobs: Number(profile.total_reviews || 1),
      badge: profile.badge_level || 'BRONCE',
      whatsapp: profile.whatsapp || '',
      status: profile.status || 'ACTIVE',
    };
    setProviderData(selected);
    try {
      localStorage.setItem('nexativa_active_prestador', JSON.stringify(selected));
    } catch (e) {}
    setShowSelectModal(false);
  };

  const handleGenerateQR = () => {
    const jobId = `JOB-${Date.now().toString().slice(-6)}`;
    setCurrentJobId(jobId);
    setShowQRModal(true);
  };

  const ratingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/calificar/${currentJobId}?providerId=${providerData.id}`
    : `https://www.nexativanews.com.ar/calificar/${currentJobId}?providerId=${providerData.id}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    ratingUrl
  )}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 sm:p-6 font-sans flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">
        {/* Header App Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-sm">
              PRO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white leading-tight">{providerData.name}</h1>
                <button
                  onClick={() => setShowSelectModal(true)}
                  className="text-[10px] text-emerald-400 font-bold underline hover:text-emerald-300"
                >
                  (Cambiar)
                </button>
              </div>
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
              type="button"
              onClick={handleToggleOnline}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm transition-all shadow-xl flex items-center justify-center gap-2.5 active:scale-95 ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 border border-emerald-400'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 border border-rose-400'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-white animate-ping' : 'bg-white'}`}></span>
              {isOnline ? '🟢 DISPONIBLE AHORA (En Vivo)' : '🔴 OCUPADO / EN TAREA'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">
            {isOnline ? '🟢 Aparecés primero en la lista de disponibles para clientes.' : '🔴 No recibirás solicitudes directas mientras estés en tarea.'}
          </p>
        </div>

        {/* Configuración de Ubicación por Cercanía */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              📍 Tu Ubicación Actual / Zona de Servicio
            </p>
            <span className="text-[11px] font-extrabold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/40">
              {providerZone}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Fijá tu ubicación para aparecer sugerido a los vecinos más cercanos en Ituzaingó:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold mb-3">
            {["Ituzaingó Centro", "Barrio Paraná", "Villa Olivari", "San Antonio", "Itá Porá", "Zona Puerto"].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => handleUpdateZone(z)}
                className={`py-2 px-3 rounded-xl border text-left transition-all ${
                  providerZone === z
                    ? "bg-cyan-600 text-white border-cyan-400 font-extrabold shadow-md"
                    : "bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700"
                }`}
              >
                📍 {z}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDetectGPS}
            className="w-full py-2.5 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            {detectingGPS ? "Detectando coordenadas GPS..." : "📡 Activar Detección Exacta por GPS"}
          </button>
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
            href={`/certificados/${providerData.id}?name=${encodeURIComponent(providerData.name)}&trade=${encodeURIComponent(providerData.trade)}&score=${providerData.noraScore}&badge=${encodeURIComponent(providerData.badge)}`}
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

      {/* Modal para Seleccionar / Cambiar Perfil Activo */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-emerald-500/40 rounded-3xl max-w-sm w-full p-6 text-gray-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 text-center">Seleccioná tu Perfil de Prestador</h3>
            <p className="text-xs text-gray-400 mb-4 text-center">Elegí tu nombre para ver tu panel personalizado:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProfile(p)}
                  className="w-full p-3 bg-gray-800 hover:bg-emerald-900/40 border border-gray-700 hover:border-emerald-500/50 rounded-xl text-left transition-colors"
                >
                  <p className="font-bold text-white text-xs">{p.full_name}</p>
                  <p className="text-[11px] text-emerald-400">{p.trade_category} ({p.city || 'Ituzaingó'})</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSelectModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
              El cliente calificará a <strong>{providerData.name}</strong> con 5 estrellas desde su teléfono sin necesidad de instalar nada.
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

export default function PrestadoresDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] text-gray-300 p-8 text-center">Cargando Panel Móvil...</div>}>
      <PrestadoresContent />
    </Suspense>
  );
}
