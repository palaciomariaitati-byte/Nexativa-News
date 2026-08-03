"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
            🖨️ Imprimir Dossier A4
          </button>
        </div>
      </div>

      {/* Dossier Comercial Contenedor A4 */}
      <div className="w-full max-w-4xl bg-[#FFFDF9] text-slate-900 border-4 border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden print:w-full print:max-w-none print:m-0 print:border-none print:shadow-none print:p-6">
        
        {/* Header institucional periodístico */}
        <div className="border-b-4 border-emerald-700 pb-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-emerald-700 uppercase block mb-1">
              DOSSIER DE IMPACTO SOCIAL & DESARROLLO REGIONAL 2026
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif">
              Nexativa News <span className="text-emerald-700 font-sans">& IA Nora</span>
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              Impulsando el trabajo, el comercio local y la voz de nuestra comunidad en Corrientes
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold border border-emerald-300">
              🤝 Red Comunitaria Activa
            </span>
          </div>
        </div>

        {/* Declaración de Propósito Humano */}
        <div className="bg-emerald-950/5 border border-emerald-800/20 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">
            🌱 Nuestra Misión: Tecnología al Servicio de la Gente
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed font-sans">
            En un mundo saturado de contenido automatizado sin alma, <strong>Nexativa News</strong> nació con un propósito claro: poner la tecnología más avanzada al servicio del <strong>desarrollo humano regional</strong>. Conectamos a trabajadores independientes con familias que necesitan sus servicios, le damos visibilidad gratuita a los comercios de barrio y llevamos la información veraz sin intermediarios a más de 50.000 ciudadanos diarios.
          </p>
        </div>

        {/* Historias de Impacto Real (Galería Fotográfica) */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4 border-l-4 border-emerald-700 pl-3">
            ❤️ Impacto Humano en Números y Personas Reales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1: Oficios */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-48 w-full bg-slate-100">
                <Image
                  src="/images/brochure_tradesman.png"
                  alt="Trabajador independiente con su certificado"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Trabajo & Dignidad
                </span>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Oficios Verificados Sin Comisiones
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permitimos que plomeros, electricistas y costureras ofrezcan su trabajo gratis, reciban calificaciones comunitarias y reciban su Certificado Oficial para enmarcar.
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Comercio Local */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-48 w-full bg-slate-100">
                <Image
                  src="/images/brochure_merchant.png"
                  alt="Comerciante atendiendo en su negocio"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Desarrollo Comercial
                </span>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Conexión Directa con el Vecino
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Los comercios y PyMEs locales cuentan con la IA Nora que responde a sus clientes en menos de 14 minutos y los conecta de forma directa a través de WhatsApp.
                </p>
              </div>
            </div>

            {/* Tarjeta 3: Periodismo Comunitario */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-48 w-full bg-slate-100">
                <Image
                  src="/images/brochure_journalist.png"
                  alt="Periodista movilero reportando en la calle"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Voz e Información
                </span>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Periodismo Cercano y Transparente
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Movileros y vecinos reportan los hechos en vivo desde las calles. Noticias reales que impulsan la cultura y el crecimiento de la región.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Opciones de Alianzas y Auspicios */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4 border-l-4 border-emerald-700 pl-3">
            💼 Propuestas de Integración & Alianzas Comerciales
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-100/60 text-slate-900 border-b-2 border-emerald-700">
                  <th className="p-3 font-bold">MODALIDAD DE PAUTA</th>
                  <th className="p-3 font-bold">VALOR PARA TU EMPRESA</th>
                  <th className="p-3 font-bold">IMPACTO EN LA COMUNIDAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="p-3 font-bold text-slate-900">🥇 Sponsor Principal Nexativa</td>
                  <td className="p-3">Presencia de marca en Portada, Noticieros Flash e Historias automáticas.</td>
                  <td className="p-3 font-bold text-emerald-800">Posicionamiento Orgánico 24/7</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">🥈 Guía Comercial & NoraScore™</td>
                  <td className="p-3">Ficha con Sello de Confianza "Nora Verified" y botón directo a tu WhatsApp.</td>
                  <td className="p-3 font-bold text-emerald-800">Leads & Consultas Reales</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">🤖 Nora Pro Agent (Empresas)</td>
                  <td className="p-3">Asistente de IA dedicado que atiende a tus clientes en &lt; 14 minutos.</td>
                  <td className="p-3 font-bold text-emerald-800">Atención de Excelencia 24/7</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">📜 Programa Certificados de Excelencia</td>
                  <td className="p-3">Patrocinio exclusivo de los diplomas enmarcables para trabajadores de oficio.</td>
                  <td className="p-3 font-bold text-amber-800">Responsabilidad Social Empresaria</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Contacto Directo */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 text-center shadow-xl">
          <h3 className="text-lg font-extrabold mb-2 text-emerald-400 uppercase tracking-wider font-serif">
            🤝 CONECTEMOS Y HAGAMOS CRECER TU MARCA
          </h3>
          <p className="text-xs text-slate-300 mb-4 max-w-lg mx-auto">
            Contactate directamente con nuestra Dirección Comercial para coordinar una reunión presencial o recibir una propuesta a medida.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-200 font-mono">
            <span className="flex items-center gap-1.5">🌐 nexativanews.com.ar</span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              💬 WhatsApp Comercial: +54 9 3786 41-4533
            </span>
            <span className="flex items-center gap-1.5">📍 Ituzaingó, Corrientes, Argentina</span>
          </div>
        </div>

        {/* Footer legal y fecha */}
        <div className="mt-6 text-center text-[10px] text-slate-500">
          Nexativa News © 2026 | Tecnología con Propósito Humano por MyJNexoraVisual & IA Nora Engine.
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
