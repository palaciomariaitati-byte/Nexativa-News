"use client";

import React from 'react';
import Link from 'next/link';

export default function BrochureComercialPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans flex flex-col items-center justify-center">
      {/* Action Bar (Oculto al Imprimir) */}
      <div className="print:hidden max-w-4xl w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          href="/"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          ← Volver al Portal
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="/BROCHURE_COMERCIAL_NEXATIVA_NEWS_2026.pdf"
            download
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 text-sm"
          >
            📥 Descargar PDF Comercial
          </a>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 text-sm"
          >
            🖨️ Imprimir Dossier (A4)
          </button>
        </div>
      </div>

      {/* Dossier Comercial Contenedor A4 */}
      <div className="w-full max-w-4xl bg-white text-slate-900 border-4 border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden print:w-full print:max-w-none print:m-0 print:border-none print:shadow-none print:p-6">
        {/* Header institucional */}
        <div className="border-b-4 border-emerald-600 pb-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase block mb-1">
              DOSSIER COMERCIAL & ALIANZAS ESTRATÉGICAS 2026
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Nexativa News <span className="text-emerald-600">& IA Nora</span>
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              La Plataforma Periodística, Marketplace & Inteligencia Artificial Regional de Mayor Crecimiento
            </p>
          </div>
          <div className="text-right sm:text-right hidden sm:block">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
              🟢 Cobertura Regional
            </span>
          </div>
        </div>

        {/* Métricas Destacadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">+50.000</span>
            <span className="text-xs font-bold text-slate-600">Lectores Mensuales</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">&lt; 14 min</span>
            <span className="text-xs font-bold text-slate-600">Resp. Comercial Nora IA</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 block">⭐ 98.4%</span>
            <span className="text-xs font-bold text-slate-600">Conformidad NoraScore™</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">100%</span>
            <span className="text-xs font-bold text-slate-600">Alcance Orgánico Celulares</span>
          </div>
        </div>

        {/* Sección 1: Propuesta de Valor */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3 border-l-4 border-emerald-600 pl-3">
            📌 ¿Por qué Nexativa News es la Opción Preferida por las Marcas?
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            Combinamos el impacto periodístico regional con la potencia tecnológica de la Inteligencia Artificial. Tu marca no solo aparece en una web: se distribuye de manera omnipresente en <strong>Google Discover</strong>, <strong>Estados de WhatsApp</strong> e <strong>Instagram Stories</strong>.
          </p>
        </div>

        {/* Sección 2: Tabla de Soluciones Comerciales */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4 border-l-4 border-emerald-600 pl-3">
            🛠️ Opciones de Pauta & Espacios de Patrocinio
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-50 text-slate-900 border-b-2 border-emerald-600">
                  <th className="p-3 font-bold">MODALIDAD DE PAUTA</th>
                  <th className="p-3 font-bold">BENEFICIOS INCLUIDOS</th>
                  <th className="p-3 font-bold">IMPACTO EN VENTAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="p-3 font-bold text-slate-900">🥇 Sponsor ORO Nexativa</td>
                  <td className="p-3">Banner Principal Header + Presencia en Noticias Top + Mención en Noticiero Flash.</td>
                  <td className="p-3 font-bold text-emerald-700">Visibilidad Masiva 24/7</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">🥈 Guía Comercial & NoraScore™</td>
                  <td className="p-3">Ficha Destacada en Páginas Amarillas 2.0 + Sello "Nora Verified" + Botón WhatsApp Directo.</td>
                  <td className="p-3 font-bold text-emerald-700">Leads Directos a WhatsApp</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">🤖 Nora Pro Agent para Empresas</td>
                  <td className="p-3">Agente de IA dedicado 24/7 que responde consultas y pre-califica clientes en menos de 14 min.</td>
                  <td className="p-3 font-bold text-emerald-700">Automatización de Ventas</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">📜 Certificado de Excelencia</td>
                  <td className="p-3">Acreditación física imprimible en A4 con QR de validación en vivo para colgar en tu local.</td>
                  <td className="p-3 font-bold text-amber-700">Prestigio & Confianza Local</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección 3: Contacto e Identidad */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 text-center print:bg-slate-900 print:text-white">
          <h3 className="text-lg font-extrabold mb-2 text-emerald-400">
            💼 DIRECCIÓN COMERCIAL & ALIANZAS REGIONALES
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            Agendá una presentación ejecutiva con nuestro equipo para sumar tu empresa a la red de mayor impacto.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-300 font-mono">
            <span>🌐 nexativanews.com.ar</span>
            <span>💬 WA: +54 9 3786 40-1122</span>
            <span>📍 Ituzaingó, Corrientes, Argentina</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[10px] text-slate-500">
          Nexativa News © 2026 | Desarrollado por MyJNexoraVisual & IA Nora Engine | Todos los derechos reservados.
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
