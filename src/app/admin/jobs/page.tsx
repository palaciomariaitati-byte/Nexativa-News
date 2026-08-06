"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ImportBusinessesModal from '@/components/Admin/ImportBusinessesModal';

interface Profile {
  id: string;
  full_name: string;
  trade_category: string;
  city: string;
  whatsapp: string;
  nora_score: number;
  total_reviews: number;
  badge_level: string;
  status: string;
  cv_url?: string;
  cv_filename?: string;
}

export default function AdminJobsPage() {
  const [activeTab, setActiveTab] = useState<'oficios' | 'busquedas' | 'reseñas'>('oficios');

  const defaultProfiles: Profile[] = [
    {
      id: '1',
      full_name: 'Pedro González',
      trade_category: 'Plomero / Gasista Matriculado',
      city: 'Ituzaingó',
      whatsapp: '5493786401122',
      nora_score: 4.95,
      total_reviews: 28,
      badge_level: 'ORO',
      status: 'ACTIVE',
    },
    {
      id: '2',
      full_name: 'María Luisa Fernández',
      trade_category: 'Costura & Confección',
      city: 'Ituzaingó',
      whatsapp: '5493786403344',
      nora_score: 4.85,
      total_reviews: 14,
      badge_level: 'PLATA',
      status: 'ACTIVE',
    },
    {
      id: '3',
      full_name: 'Carlos "Charly" Benítez',
      trade_category: 'Electricista Domiciliario',
      city: 'Ituzaingó',
      whatsapp: '5493786405566',
      nora_score: 5.00,
      total_reviews: 32,
      badge_level: 'ORGULLO_REGIONAL',
      status: 'ACTIVE',
    },
  ];

  const [profiles, setProfiles] = useState<Profile[]>(defaultProfiles);
  const [loading, setLoading] = useState(true);

  const [offers] = useState([
    {
      id: '101',
      title: 'Se busca Ayudante de Cocina / Mozo',
      category: 'Gastronomía',
      employer: 'Don Luis Parrilla',
      whatsapp: '5493786409900',
      status: 'ACTIVE',
    },
    {
      id: '102',
      title: 'Búsqueda de Cajero/a para Minimarket',
      category: 'Comercio',
      employer: 'Minimarket San Jorge',
      whatsapp: '5493786408877',
      status: 'ACTIVE',
    },
  ]);

  const loadProfiles = async () => {
    setLoading(true);
    let localBuffer: Profile[] = [];
    try {
      const saved = localStorage.getItem('nexativa_job_profiles_v1');
      if (saved) {
        localBuffer = JSON.parse(saved) || [];
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/jobs/profiles');
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
        const apiMapped: Profile[] = data.profiles.map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          trade_category: p.trade_category,
          city: p.city || 'Ituzaingó',
          whatsapp: p.whatsapp,
          nora_score: Number(p.nora_score || 5.0),
          total_reviews: Number(p.total_reviews || 0),
          badge_level: p.badge_level || 'BRONCE',
          status: p.status || 'ACTIVE',
          cv_url: p.cv_url || undefined,
          cv_filename: p.cv_filename || undefined,
        }));

        setProfiles((prev) => {
          const apiIds = new Set(apiMapped.map((p) => p.id));
          const filteredLocal = localBuffer.filter((l) => !apiIds.has(l.id));
          const combined = [...apiMapped, ...filteredLocal];
          const combinedIds = new Set(combined.map((c) => c.id));
          const filteredDefault = defaultProfiles.filter((d) => !combinedIds.has(d.id));
          return [...combined, ...filteredDefault];
        });
      } else if (localBuffer.length > 0) {
        setProfiles((prev) => {
          const bufferIds = new Set(localBuffer.map((l) => l.id));
          const filteredDefault = defaultProfiles.filter((d) => !bufferIds.has(d.id));
          return [...localBuffer, ...filteredDefault];
        });
      }
    } catch (err) {
      if (localBuffer.length > 0) setProfiles(localBuffer);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleDeleteProfile = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${name}" de la consola de empleos?`)) return;

    try {
      await fetch('/api/jobs/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {}

    // Eliminar de localStorage
    try {
      const saved = localStorage.getItem('nexativa_job_profiles_v1');
      if (saved) {
        const parsed = JSON.parse(saved) || [];
        const filtered = parsed.filter((p: any) => p.id !== id);
        localStorage.setItem('nexativa_job_profiles_v1', JSON.stringify(filtered));
      }
    } catch (e) {}

    setProfiles((prev) => prev.filter((p) => p.id !== id));
    alert(`¡Postulante "${name}" eliminado exitosamente!`);
  };

  return (
    <div className="space-y-6 text-gray-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-serif text-emerald-400 tracking-wider uppercase">
            💼 Consola de Empleos & NoraScore™
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Administración de trabajadores, postulantes en vivo, calificaciones comunitarias y emisión de certificados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportBusinessesModal />
          <Link
            href="/prestadores"
            target="_blank"
            className="px-3 py-1.5 bg-emerald-700/50 hover:bg-emerald-600/60 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/40 transition-colors flex items-center gap-1"
          >
            📱 Panel Móvil (/prestadores)
          </Link>
          <Link
            href="/empleos"
            target="_blank"
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold border border-gray-700 transition-colors"
          >
            🌐 Ver Vista Pública (/empleos)
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 text-sm font-bold">
        <button
          onClick={() => setActiveTab('oficios')}
          className={`pb-3 ${
            activeTab === 'oficios'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🛠️ Trabajadores & Postulantes ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('busquedas')}
          className={`pb-3 ${
            activeTab === 'busquedas'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          💼 Búsquedas Laborales ({offers.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'oficios' ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Cargando postulantes en tiempo real...</div>
          ) : (
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-800/80 text-gray-200 uppercase font-semibold border-b border-gray-700">
                <tr>
                  <th className="p-3">Nombre / Rubro</th>
                  <th className="p-3">Ciudad</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">NoraScore™</th>
                  <th className="p-3">Insignia</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {profiles.map((p) => {
                  const welcomeMessage = `¡Hola, ${p.full_name}! 👋 Te damos la bienvenida a Nexativa Empleos & Oficios en ${p.city}.\n\nTu perfil profesional en el rubro *${p.trade_category}* ya se encuentra activo.\n\n📱 Podés gestionar tus servicios y mostrar tu QR de reputación en tu Panel Móvil aquí:\n👉 https://www.nexativanews.com.ar/prestadores`;
                  const waUrl = `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(welcomeMessage)}`;
                  const certUrl = `/certificados/${p.id}?name=${encodeURIComponent(p.full_name)}&trade=${encodeURIComponent(p.trade_category)}&city=${encodeURIComponent(p.city)}&score=${p.nora_score}&badge=${encodeURIComponent(p.badge_level)}`;

                  return (
                    <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        {p.full_name}
                        <span className="block text-[11px] text-emerald-400 font-normal">{p.trade_category}</span>
                      </td>
                      <td className="p-3">{p.city}</td>
                      <td className="p-3 font-mono">{p.whatsapp}</td>
                      <td className="p-3 font-bold text-amber-400">
                        ⭐ {p.nora_score} ({p.total_reviews} votos)
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          {p.badge_level}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {p.cv_url && (
                          <a
                            href={p.cv_url}
                            download={p.cv_filename || `CV_${p.full_name}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 rounded border border-indigo-500/40 font-bold"
                            title="Ver / Descargar Currículum Vitae del postulante"
                          >
                            📄 CV
                          </a>
                        )}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 rounded border border-emerald-500/40 font-bold"
                          title="Enviar mensaje de bienvenida por WhatsApp con el link del Panel Móvil"
                        >
                          💬 Contactar
                        </a>
                        <Link
                          href={certUrl}
                          target="_blank"
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 font-bold"
                        >
                          📜 Certificado
                        </Link>
                        <button
                          onClick={() => handleDeleteProfile(p.id, p.full_name)}
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded border border-red-500/30 font-bold"
                          title="Borrar postulante de la consola"
                        >
                          🗑️ Borrar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-800/80 text-gray-200 uppercase font-semibold border-b border-gray-700">
              <tr>
                <th className="p-3">Título de la Búsqueda</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Empleador</th>
                <th className="p-3">Contacto</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {offers.map((o) => (
                <tr key={o.id} className="hover:bg-gray-800/40">
                  <td className="p-3 font-semibold text-white">{o.title}</td>
                  <td className="p-3">{o.category}</td>
                  <td className="p-3 font-bold text-gray-200">{o.employer}</td>
                  <td className="p-3 font-mono">{o.whatsapp}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      ACTIVA
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
