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
            📥 Descargar PDF Comercial (2 Páginas)
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
      <div className="w-full max-w-4xl bg-[#FFFDF9] text-slate-900 border-4 border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden print:w-full print:max-w-none print:m-0 print:border-none print:shadow-none print:p-6 space-y-12">
        
        {/* ========================================================================= */}
        {/* PÁGINA 1: PORTADA & MANIFIESTO COMUNITARIO */}
        {/* ========================================================================= */}
        <section className="min-h-[900px] flex flex-col justify-between border-b-2 border-slate-200 pb-12 print:border-none print:pb-0">
          <div>
            {/* Header institucional periodístico */}
            <div className="border-b-4 border-emerald-700 pb-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black tracking-widest text-emerald-700 uppercase block mb-1">
                  DOSSIER COMERCIAL DE IMPACTO SOCIAL & DESARROLLO REGIONAL 2026
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif">
                  Nexativa News <span className="text-emerald-700 font-sans">& IA Nora</span>
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                  Plataforma Periodística, Marketplace PyME y Ecosistema de Inteligencia Artificial Regional
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold border border-emerald-300">
                  🌱 Red Comunitaria Activa
                </span>
              </div>
            </div>

            {/* Declaración de Propósito Humano */}
            <div className="bg-emerald-950/5 border border-emerald-800/20 rounded-2xl p-6 mb-6">
              <h2 className="text-base font-bold text-slate-900 mb-2 font-serif">
                🌱 Manifiesto Institucional: Tecnología con Propósito Humano y Desarrollo Social
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                En un entorno mediático saturado de contenido automatizado sin alma, <strong>Nexativa News</strong> (<code>nexativanews.com.ar</code>) se consolidó como el motor digital y comunitario de mayor impacto en la región. Nuestra misión es poner la tecnología más avanzada al servicio del <strong>desarrollo humano integral</strong>: conectamos trabajadores independientes con vecinos que necesitan sus servicios sin comisiones, democratizamos la visibilidad para las PyMEs locales y garantizamos periodismo veraz sin intermediarios a más de 50.000 lectores mensuales.
              </p>
            </div>

            {/* Indicadores de Crecimiento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 block">+50.000</span>
                <span className="text-[11px] font-bold text-slate-600">Lectores Mensuales</span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-xl sm:text-2xl font-black text-emerald-700 block">&lt; 14 MIN</span>
                <span className="text-[11px] font-bold text-slate-600">Resp. Nora IA</span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-xl sm:text-2xl font-black text-amber-600 block">⭐ 98.4%</span>
                <span className="text-[11px] font-bold text-slate-600">Conformidad NoraScore™</span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 block">100%</span>
                <span className="text-[11px] font-bold text-slate-600">Alcance Orgánico Celulares</span>
              </div>
            </div>

            {/* Tríptico de Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-xs text-slate-700">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <h3 className="font-bold text-slate-900 text-sm mb-1">🛠️ 1. Trabajo & Dignidad</h3>
                <p className="leading-relaxed">Permitimos a plomeros, electricistas y artesanos ofrecer sus servicios gratis, recibiendo reseñas comunitarias y su Certificado A4 para enmarcar.</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <h3 className="font-bold text-slate-900 text-sm mb-1">🏢 2. Comercio Local</h3>
                <p className="leading-relaxed">Las PyMEs se integran a la Guía Comercial 2.0 con la IA Nora respondiendo consultas de clientes en menos de 14 minutos vía WhatsApp.</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <h3 className="font-bold text-slate-900 text-sm mb-1">🎤 3. Periodismo Real</h3>
                <p className="leading-relaxed">Corresponsales y vecinos reportan en vivo desde las calles. Noticias de impacto positivo que impulsan la cultura y economía local.</p>
              </div>
            </div>

            {/* Galería Fotográfica de Historias Reales (3 Fotos) */}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 mb-3 border-l-4 border-emerald-700 pl-3">
                📸 Galería de Historias Reales de Nuestra Comunidad
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-center">
                  <div className="relative h-36 w-full bg-slate-100">
                    <Image src="/images/brochure_tradesman.png" alt="Don Pedro Plomero" fill className="object-cover" />
                  </div>
                  <div className="p-2.5">
                    <span className="text-[11px] font-bold text-slate-900 block">Don Pedro (Plomero)</span>
                    <span className="text-[10px] text-slate-500 block">Orgulloso con su Certificado A4 en su taller.</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-center">
                  <div className="relative h-36 w-full bg-slate-100">
                    <Image src="/images/brochure_merchant.png" alt="Comerciante Local" fill className="object-cover" />
                  </div>
                  <div className="p-2.5">
                    <span className="text-[11px] font-bold text-slate-900 block">Comercio de Barrio</span>
                    <span className="text-[10px] text-slate-500 block">Atención cercana y directa vía WhatsApp.</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-center">
                  <div className="relative h-36 w-full bg-slate-100">
                    <Image src="/images/brochure_journalist.png" alt="Periodistas Movileros" fill className="object-cover" />
                  </div>
                  <div className="p-2.5">
                    <span className="text-[11px] font-bold text-slate-900 block">Movileros en Vivo</span>
                    <span className="text-[10px] text-slate-500 block">Cobertura transparente desde las calles.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-4 border-t border-slate-200 pt-2">
            Nexativa News © 2026 | Dossier Comercial Oficial - Página 1 de 2
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PÁGINA 2: TECNOLOGÍA NORA, MATRIZ COMERCIAL & CONTACTO */}
        {/* ========================================================================= */}
        <section className="min-h-[900px] flex flex-col justify-between pt-6 print:pt-0">
          <div>
            <div className="border-b-4 border-emerald-700 pb-4 mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
                Soluciones de Patrocinio & Estrategia Omnipresente
              </h2>
              <span className="text-xs font-bold text-emerald-700">Página 2 de 2</span>
            </div>

            {/* Sección Tecnología Nora */}
            <div className="mb-6">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2 border-l-4 border-emerald-700 pl-3">
                🤖 La Ventaja Tecnológica: Motor Nora IA & Distribución Omnipresente
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed mb-3">
                A diferencia de los medios tradicionales, Nexativa News cuenta con <strong>Nora</strong>, la Inteligencia Artificial periodística desarrollada por <strong>MyJNexoraVisual</strong>. Al anunciarte en Nexativa, activa una red de difusión inteligente:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                <li className="bg-white border border-slate-200 rounded-xl p-3">
                  <strong className="text-emerald-800 block mb-1">📱 Google Discover</strong>
                  Aparición gratuita en la pantalla de inicio de celulares Android e iOS.
                </li>
                <li className="bg-white border border-slate-200 rounded-xl p-3">
                  <strong className="text-emerald-800 block mb-1">📊 Encuestas 9:16</strong>
                  Inyección dinámica de avisos en WhatsApp e Instagram Stories.
                </li>
                <li className="bg-white border border-slate-200 rounded-xl p-3">
                  <strong className="text-amber-800 block mb-1">⭐ NoraScore™ Anti-Spam</strong>
                  Verificación de opiniones reales por WhatsApp para tu negocio.
                </li>
              </ul>
            </div>

            {/* Matriz Completa de Soluciones Comerciales */}
            <div className="mb-6">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 border-l-4 border-emerald-700 pl-3">
                💼 Matriz de Propuestas de Auspicio y Servicios para Empresas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-100/70 text-slate-900 border-b-2 border-emerald-700">
                      <th className="p-2.5 font-bold">MODALIDAD DE PAUTA</th>
                      <th className="p-2.5 font-bold">VALOR EXCLUSIVO PARA TU MARCA</th>
                      <th className="p-2.5 font-bold">RETORNO E IMPACTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">🥇 Sponsor ORO Nexativa</td>
                      <td className="p-2.5">Banner Principal Header + Mención en Noticieros Flash + Coberturas de Prensa Exclusivas.</td>
                      <td className="p-2.5 font-bold text-emerald-800">Visibilidad Masiva 24/7</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">🥈 Guía Comercial 2.0</td>
                      <td className="p-2.5">Ficha destacada en Páginas Amarillas + Sello "Nora Verified" + Enlace directo a tu WhatsApp.</td>
                      <td className="p-2.5 font-bold text-emerald-800">Leads Directos a Venta</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">🤖 Nora Pro Agent (Empresas)</td>
                      <td className="p-2.5">Asistente de IA dedicado que atiende a tus clientes en &lt; 14 minutos las 24 horas del día.</td>
                      <td className="p-2.5 font-bold text-emerald-800">Automatización 24/7</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">📜 Certificados de Excelencia</td>
                      <td className="p-2.5">Patrocinio de la acreditación enmarcable A4 otorgada a los mejores trabajadores de la zona.</td>
                      <td className="p-2.5 font-bold text-amber-800">Prestigio RSE Local</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">💼 Búsquedas Laborales PyME</td>
                      <td className="p-2.5">Publicación destacada de solicitudes de empleo con recepción de candidaturas directas.</td>
                      <td className="p-2.5 font-bold text-emerald-800">Reclutamiento Rápido</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preguntas Frecuentes */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 mb-2">❓ Preguntas Frecuentes para Auspiciantes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <p><strong>• ¿Cómo recibo las consultas?</strong> Llegan directamente a tu celular de WhatsApp sin intermediarios ni comisiones.</p>
                <p><strong>• ¿Puedo cambiar mis promociones?</strong> Sí, el equipo comercial y Nora actualizan tus avisos en tiempo real.</p>
              </div>
            </div>
          </div>

          {/* Caja Oficial de Contacto Directo */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 text-center shadow-xl print:bg-slate-900 print:text-white">
            <h3 className="text-base font-extrabold mb-2 text-emerald-400 uppercase tracking-wider font-serif">
              🤝 CONTACTO DIRECTO & ALIANZAS COMERCIALES REGIONALES
            </h3>
            <p className="text-xs text-slate-300 mb-4 max-w-lg mx-auto">
              Agendá una reunión presencial con nuestro equipo para sumar tu marca a la red de mayor crecimiento.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-xs text-slate-200 font-mono">
              <span className="font-bold text-emerald-400">
                💬 WhatsApp Comercial Nexativa: +54 9 3786 61-1250
              </span>
              <span className="text-slate-300">
                ⚙️ MyJNexoraVisual (IA Nora): +54 9 3786 41-4533
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-mono">
              🌐 nexativanews.com.ar | 📍 Ituzaingó, Corrientes, Argentina
            </div>
          </div>

          {/* Footer Final */}
          <div className="mt-4 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-2">
            Nexativa News © 2026 | Tecnología con Propósito Humano por MyJNexoraVisual & IA Nora Engine | Página 2 de 2
          </div>
        </section>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}
