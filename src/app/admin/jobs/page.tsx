"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import ImportBusinessesModal from '@/components/Admin/ImportBusinessesModal';

export default function AdminJobsPage() {
  const [activeTab, setActiveTab] = useState<'oficios' | 'busquedas' | 'reseñas'>('oficios');

  // Datos mock de administración
  const [profiles] = useState([
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
  ]);

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

  return (
    <div className="space-y-6 text-gray-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-serif text-emerald-400 tracking-wider uppercase">
            💼 Consola de Empleos & NoraScore™
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Administración de trabajadores, búsquedas activas, calificaciones comunitarias y emisión de certificados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportBusinessesModal />
          <Link
            href="/empleos"
            target="_blank"
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold border border-gray-700 transition-colors"
          >
            🌐 Ver Vista Pública (/empleos)
          </Link>
          <Link
            href="/brochure"
            target="_blank"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            📄 Dossier Comercial
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
          🛠️ Trabajadores & Oficios ({profiles.length})
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
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/40">
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
                    <Link
                      href={`/certificados/${p.id}`}
                      target="_blank"
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 font-bold"
                    >
                      📜 Certificado
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
