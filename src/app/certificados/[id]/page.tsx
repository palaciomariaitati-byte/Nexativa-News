"use client";

import React, { use } from 'react';
import Link from 'next/link';

interface CertProps {
  params: Promise<{ id: string }>;
}

export default function CertificadoPage({ params }: CertProps) {
  const { id } = use(params);

  // Datos mock / dinámicos para el certificado de prueba
  const certData = {
    code: `NEX-ORO-2026-${id.slice(0, 4).toUpperCase()}`,
    recipientName: id === '3' ? 'Carlos "Charly" Benítez' : 'Pedro González',
    tradeCategory: id === '3' ? 'Electricista Domiciliario Matriculado' : 'Plomero / Gasista Matriculado',
    noraScore: id === '3' ? 5.0 : 4.95,
    reviewsCount: id === '3' ? 32 : 28,
    badgeLevel: id === '3' ? 'ORGULLO REGIONAL' : 'INSIGNIA ORO',
    city: 'Ituzaingó',
    province: 'Corrientes',
    issueDate: '02 de Agosto de 2026',
    verifyUrl: `https://www.nexativanews.com.ar/empleos`,
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    certData.verifyUrl
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 font-serif">
      {/* Botones de Acción (Ocultos al Imprimir) */}
      <div className="print:hidden max-w-4xl w-full flex items-center justify-between gap-4 mb-6 font-sans">
        <Link
          href="/empleos"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          ← Volver a Empleos
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 text-sm"
          >
            🖨️ Imprimir / Guardar en PDF (A4)
          </button>
        </div>
      </div>

      {/* Contenedor del Certificado Imprimible (A4 Horizontal Ratio) */}
      <div className="w-full max-w-4xl bg-[#FFFDF7] text-slate-900 border-[12px] border-double border-amber-600 rounded-lg p-8 sm:p-12 shadow-2xl relative overflow-hidden print:w-full print:max-w-none print:m-0 print:border-[8px] print:shadow-none print:p-8">
        {/* Marca de agua de fondo ornamental */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="text-[180px] font-bold text-amber-900 select-none">NEXATIVA</span>
        </div>

        {/* Esquinas ornamentales */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600"></div>
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600"></div>
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600"></div>
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600"></div>

        {/* Header del Certificado */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-2xl font-bold tracking-widest text-amber-800 font-sans uppercase">
              NEXATIVA NEWS
            </span>
          </div>
          <p className="text-xs font-sans tracking-widest text-slate-600 uppercase mb-4">
            Plataforma Periodística y Red Comunitaria de Ituzaingó, Corrientes
          </p>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-900 tracking-tight font-serif uppercase mb-2">
            Certificado de Excelencia Comunitaria
          </h1>
          <div className="w-32 h-1 bg-amber-600 mx-auto rounded-full"></div>
        </div>

        {/* Cuerpo Principal */}
        <div className="text-center my-8 relative z-10">
          <p className="text-sm font-sans italic text-slate-700 mb-2">
            Por cuanto la comunidad de vecinos y clientes ha calificado con la máxima distinción a:
          </p>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 my-4 font-serif underline decoration-amber-500/40 underline-offset-8">
            {certData.recipientName}
          </h2>

          <p className="text-lg font-sans font-semibold text-amber-800 mb-6">
            Especialista en: <span className="text-slate-900">{certData.tradeCategory}</span>
          </p>

          <p className="text-xs sm:text-sm font-sans text-slate-700 max-w-2xl mx-auto leading-relaxed mb-6">
            Se otorga la máxima acreditación <strong className="text-amber-900">{certData.badgeLevel}</strong> respaldada por el algoritmo de reputación transparente <strong className="text-amber-900">NoraScore™</strong>, habiendo alcanzado un puntaje promedio de <span className="font-bold text-amber-800">⭐ {certData.noraScore} / 5.0</span> en más de <span className="font-bold text-amber-800">{certData.reviewsCount} opiniones reales</span> de vecinos de {certData.city}.
          </p>
        </div>

        {/* Footer y Elementos de Verificación */}
        <div className="mt-10 pt-6 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 font-sans">
          {/* Código QR de Validación */}
          <div className="flex items-center gap-3 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="QR Validación"
              className="w-20 h-20 border-2 border-amber-600 rounded bg-white p-1"
            />
            <div>
              <span className="text-[10px] font-bold text-amber-900 block uppercase">
                Verificación Oficial QR
              </span>
              <span className="text-[9px] text-slate-600 block">
                Escaneá para validar vigencia y opiniones en vivo
              </span>
              <span className="text-[10px] font-mono text-slate-800 font-semibold block mt-1">
                Cód: {certData.code}
              </span>
            </div>
          </div>

          {/* Sello Holográfico / Firma */}
          <div className="text-center">
            <div className="w-40 border-b border-slate-800 mx-auto mb-1"></div>
            <span className="text-xs font-bold text-slate-900 block">Comité de Ética Comunitaria</span>
            <span className="text-[10px] text-slate-600 block">Nexativa News & IA Nora Engine</span>
          </div>

          {/* Fecha de Emisión */}
          <div className="text-right text-xs text-slate-600">
            <span>Fecha de Emisión:</span>
            <strong className="block text-slate-900 font-bold">{certData.issueDate}</strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">Ituzaingó, Corrientes</span>
          </div>
        </div>
      </div>

      {/* Regla CSS de Impresión */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
