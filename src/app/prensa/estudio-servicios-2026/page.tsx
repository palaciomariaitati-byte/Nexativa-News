import React from "react";
import Metadata from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, CheckCircle2, FileText, Sparkles, TrendingUp, Users, ShieldCheck, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Estudio Nexativa 2026: Crece un +42% la demanda de servicios locales e independientes en Argentina",
  description: "Barómetro Digital exclusivo de Nexativa News sobre la reconversión de la economía de cercanía, digitalización de PYMEs y asistencia conversacional.",
  openGraph: {
    title: "Estudio Nexativa 2026: +42% en Servicios Independientes",
    description: "Informe exclusivo sobre el impacto del trabajo independiente y comercio local en Argentina.",
    url: "https://nexativanews.com.ar/prensa/estudio-servicios-2026",
    siteName: "Nexativa News",
    type: "article",
  },
};

export default function EstudioPrensa2026Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Background Decorator Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Header / Banner */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent font-black text-xl tracking-tight">
              NEXATIVA
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full">
              Prensa & Reports
            </span>
          </Link>

          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            <span>Sumar mi Comercio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        
        {/* Badge Category */}
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>INFORME DE PRENSA EXCLUSIVO • FEBRERO 2026</span>
        </div>

        {/* H1 Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-6">
          Estudio Nexativa 2026: Se dispara un{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            +42% la demanda
          </span>{" "}
          de servicios independientes y comercio local
        </h1>

        {/* Subtitle / Lead */}
        <p className="text-lg sm:text-xl text-slate-300 font-light leading-relaxed mb-8 border-l-4 border-cyan-500 pl-4 bg-slate-900/40 py-2 rounded-r-xl">
          El Barómetro Digital de la plataforma híbrida Nexativa revela un giro estructural en las preferencias del consumidor argentino: agilidad, contacto directo por WhatsApp y vitrinas digitales de cercanía.
        </p>

        {/* Action Bar / Share & Downloads */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-12">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Publicado por:</span>
            <span>Unidad de Inteligencia Inbound & PR Nexativa</span>
            <span>•</span>
            <span>4 min de lectura</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/feeds/noticias-pro?format=json"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ver Raw Feed (JSON)</span>
            </a>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-4xl font-black text-white mb-1">+42%</div>
            <div className="text-sm font-semibold text-cyan-300 mb-2">Demanda Directa</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crecimiento neto en consultas de presupuestos y contrataciones en el Marketplace.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="text-4xl font-black text-white mb-1">&lt; 10 min</div>
            <div className="text-sm font-semibold text-indigo-300 mb-2">Cierre de Ventas</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              El 68% de las contrataciones se cierran en menos de 10 minutos al usar asistentes conversacionales.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-teal-500/50 transition-colors">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-4xl font-black text-white mb-1">4 Rubros</div>
            <div className="text-sm font-semibold text-teal-300 mb-2">Sectores Líderes</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arquitectura, Estética, Joyería Registrada y Soluciones Corporativas encabezan la tendencia.
            </p>
          </div>
        </section>

        {/* Editorial Body Content */}
        <article className="prose prose-invert max-w-none space-y-6 text-slate-300 leading-relaxed font-normal">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-3">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Análisis del Fenómeno: La Economía de Cercanía Digital</span>
          </h2>

          <p>
            El relevamiento procesado por el ecosistema de inteligencia de <strong>Nexativa News</strong> demuestra que la dinámica del comercio independiente está sufriendo una metamorfosis irreversible. Los consumidores argentinos han migrado rápidamente de las búsquedas tradicionales en navegadores saturados hacia vitrinas digitales de cercanía respaldadas por noticias verificadas.
          </p>

          <p>
            En palabras de la Dirección de Innovación & Estrategia Digital de Nexativa:
          </p>

          <blockquote className="my-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border border-slate-800 border-l-4 border-l-cyan-400 italic text-slate-200">
            &ldquo;No estamos ante una moda pasajera, sino ante una reconversión estructural del comercio local en Argentina. Los profesionales independientes ya no buscan intermediarios costosos: exigen visibilidad directa, contacto directo por WhatsApp y contenido periodístico que respalde su reputación.&rdquo;
          </blockquote>

          <h3 className="text-xl font-bold text-white mt-8 mb-4">
            Democratización Digital para PYMEs y Profesionales
          </h3>

          <p>
            Gracias al modelo de suscripciones transparentes (Planes Bronce, Plata y Oro), pequeños comercios de rubros como <em>Arquitectura, Estética, Joyería Registrada y Servicios B2B</em> pueden posicionarse a la par de grandes marcas nacionales en un entorno curado y libre de desinformación.
          </p>
        </article>

        {/* High Conversion Box -> Subscription Tiers */}
        <section className="mt-16 p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64 text-cyan-400" />
          </div>

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Oportunidad Comercial
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 mb-4">
              ¿Tenés un Comercio o Brindás Servicios?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base mb-8">
              Sumate hoy al Marketplace de Nexativa y posicioná tus productos con asistencia inteligente de NORA y cobertura periodística garantizada.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/checkout"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-base shadow-xl shadow-cyan-500/20 transition-transform active:scale-95"
              >
                <span>Ver Planes de Suscripción</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Plan Bronce, Plata u Oro</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Asistencia NORA 24/7</span>
            </div>
          </div>
        </section>

        {/* Legal & AI Transparency Disclaimer */}
        <footer className="mt-16 pt-8 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <span>Informe elaborado con respaldo de Inteligencia Artificial (NORA) y curaduría periodística humana.</span>
          </div>
          <div>
            <span>Cumplimiento Ley N° 11.723 & Ley N° 25.326</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
