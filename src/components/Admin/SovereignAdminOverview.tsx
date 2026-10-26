'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Home,
  Briefcase,
  BookOpen,
  Palette,
  Newspaper,
  Radio,
  Zap,
  Scissors,
  Users,
  QrCode,
  TrendingUp,
  Megaphone,
  CreditCard,
  Cpu,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
  Activity
} from 'lucide-react';

interface AdminKpi {
  id: string;
  label: string;
  value: string;
  subtext: string;
  badgeType: 'positive' | 'neutral' | 'live' | 'currency';
  href: string;
}

interface ActivityLogItem {
  id: string;
  time: string;
  module: string;
  action: string;
  operator: string;
  status: 'Transmitido' | 'Aprobado' | 'En Emisión' | 'Pendiente';
  statusColor: 'emerald' | 'amber' | 'cyan' | 'slate';
}

const MOCK_KPIS: AdminKpi[] = [
  {
    id: 'kpi-1',
    label: 'INMUEBLES ACTIVOS',
    value: '42',
    subtext: '+3 hoy',
    badgeType: 'positive',
    href: '/admin/inmuebles',
  },
  {
    id: 'kpi-2',
    label: 'NOTAS PUBLICADAS HOY',
    value: '18',
    subtext: '100% SEO Valid',
    badgeType: 'neutral',
    href: '/admin/news',
  },
  {
    id: 'kpi-3',
    label: 'CORRESPONSALES EN VIVO',
    value: '5',
    subtext: 'TRANSMITIENDO',
    badgeType: 'live',
    href: '/admin/news/live',
  },
  {
    id: 'kpi-4',
    label: 'PIPELINE MRR PAUTA',
    value: '$1.84M',
    subtext: 'ARS Mensual',
    badgeType: 'currency',
    href: '/admin/accounting',
  },
];

const MOCK_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    time: '17:41:22',
    module: 'LIVE EDITOR',
    action: 'Despacho de Urgencia: Temporal en Costanera Ituzaingó',
    operator: 'Corresponsal #4 (Móvil 2)',
    status: 'Transmitido',
    statusColor: 'emerald',
  },
  {
    id: 'log-2',
    time: '17:38:05',
    module: 'INMUEBLES',
    action: 'Validación de Escritura Propiedad ID #492 (Barrio Belgrano)',
    operator: 'Admin Central',
    status: 'Aprobado',
    statusColor: 'emerald',
  },
  {
    id: 'log-3',
    time: '17:30:00',
    module: 'FLASH NOTICIOSO',
    action: 'Compilación de Boletín de las 17:30 hs (Audio Neural 3 min)',
    operator: 'Nora Synthesizer v2',
    status: 'En Emisión',
    statusColor: 'cyan',
  },
  {
    id: 'log-4',
    time: '17:15:40',
    module: 'VALEN CEO',
    action: 'Detección de 3 leads corporativos forestales en Virasoro',
    operator: 'Growth Engine AI',
    status: 'Pendiente',
    statusColor: 'amber',
  },
];

interface SovereignAdminOverviewProps {
  role: string;
}

export default function SovereignAdminOverview({ role }: SovereignAdminOverviewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      window.location.reload();
    }, 600);
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="space-y-8 font-sans text-[#e2e8f0]">
      {/* ====================================================
          HEADER ACTION SECTION & STATUS
      ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2633]">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Centro de Control General
            </h1>
            <span className="text-xl font-serif text-[#e5b242] italic hidden lg:inline">
              • Nexativa Admin
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
            <span className="font-mono text-gray-500">ROL ASIGNADO:</span>
            <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 uppercase">
              {role}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Terminal Ituzaingó Core Node #01
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-gray-500 font-mono">TLS 1.3 SOVEREIGN</span>
          </div>
        </div>

        {/* Global Search & Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar módulos..."
              className="w-full bg-[#131923] border border-[#232d3d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#e5b242]/70 transition"
            />
          </div>

          <button
            onClick={handleSync}
            className="px-3.5 py-1.5 rounded-lg border border-[#2a364a] bg-[#121924] hover:bg-[#192333] text-gray-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            title="Recargar métricas y sincronización"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#e5b242]' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          <Link
            href="/admin/news/editor"
            className="px-4 py-1.5 rounded-lg bg-[#e5b242] hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Nota</span>
          </Link>
        </div>
      </div>

      {/* ====================================================
          TOP KPI RIBBON (4 METRICS)
      ==================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_KPIS.map((kpi) => (
          <Link
            key={kpi.id}
            href={kpi.href}
            className="bg-[#121822] border border-[#1e2633] rounded-xl p-4 flex flex-col justify-between hover:border-[#2e3b4e] hover:-translate-y-0.5 transition block group"
          >
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider group-hover:text-amber-400 transition-colors">
              {kpi.label}
            </span>
            <div className="flex items-baseline justify-between mt-3">
              <span
                className="text-2xl sm:text-3xl font-serif font-black text-white"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {kpi.value}
              </span>
              <div className="text-right">
                {kpi.badgeType === 'positive' && (
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    {kpi.subtext}
                  </span>
                )}
                {kpi.badgeType === 'neutral' && (
                  <span className="text-xs font-mono text-emerald-400 font-semibold">{kpi.subtext}</span>
                )}
                {kpi.badgeType === 'live' && (
                  <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    {kpi.subtext}
                  </span>
                )}
                {kpi.badgeType === 'currency' && (
                  <span className="text-xs font-mono text-amber-400 font-semibold">{kpi.subtext}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* ====================================================
          MODULAR ROW 1: SERVICIOS & COMUNIDAD
      ==================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-rose-500/30">
          <h2 className="font-bold uppercase tracking-wider flex items-center gap-2 text-rose-300">
            <Layers className="w-4 h-4 text-rose-400" /> SERVICIOS & COMUNIDAD
          </h2>
          <span className="hidden sm:inline text-gray-500">
            Gestión de Alquileres, Bolsas de Trabajo y Páginas Amarillas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Inmuebles Verificados */}
          {matchesSearch('inmuebles alquileres verificados') && (
            <Link
              href="/admin/inmuebles"
              className="bg-[#121822] border border-rose-500/30 hover:border-rose-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <h3 className="font-bold text-sm text-rose-200 group-hover:text-rose-100 transition">
                      Inmuebles Verificados
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded font-bold">
                    42 Activos
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Supervisión notarial de alquileres, marcas de estado (Disponible/Ocupado/En Mantenimiento) y sanciones preventivas a locadores.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633] text-gray-400">
                <span className="font-mono text-[11px]">3 en revisión técnica</span>
                <span className="text-rose-400 font-bold group-hover:underline flex items-center gap-1">
                  Auditar Catálogo <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )}

          {/* Card 2: Empleos & Oficios */}
          {matchesSearch('empleos oficios trabajo norascore cv') && (
            <Link
              href="/admin/jobs"
              className="bg-[#121822] border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h3 className="font-bold text-sm text-emerald-300 group-hover:text-emerald-200 transition">
                      Empleos & Oficios (NoraScore)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded font-bold">
                    128 Postulantes
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Gestión de postulantes, búsquedas laborales, calificaciones comprobadas con NoraScore y certificaciones digitales de oficio.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633] text-gray-400">
                <span className="font-mono text-[11px]">9 vacantes abiertas</span>
                <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-1">
                  Abrir Portal <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )}

          {/* Card 3: Guía Comercial */}
          {matchesSearch('guía comercial páginas amarillas comercios proveedores') && (
            <Link
              href="/admin/press"
              className="bg-[#121822] border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h3 className="font-bold text-sm text-cyan-200 group-hover:text-cyan-100 transition">
                      Guía Comercial & Catálogo
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded font-bold">
                    34 Adheridos
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Directorio geolocalizado, comercios adheridos con QR de beneficio barrial y distribución de comunicados de prensa.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633] text-gray-400">
                <span className="font-mono text-[11px]">6 nuevas solicitudes</span>
                <span className="text-cyan-400 font-bold group-hover:underline flex items-center gap-1">
                  Ver Directorio <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ====================================================
          MODULAR ROW 2: PERIODISMO & COBERTURAS
      ==================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-red-500/30">
          <h2 className="font-bold uppercase tracking-wider flex items-center gap-2 text-red-400">
            <Newspaper className="w-4 h-4 text-red-400" /> PERIODISMO & COBERTURAS
          </h2>
          <span className="hidden sm:inline text-gray-500">Pipeline de redacción y coberturas en tiempo real</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Redacción de Noticias */}
          {matchesSearch('redacción noticias articulos notas cms') && (
            <div className="bg-[#121822] border border-[#1e2633] hover:border-[#2e3b4e] rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-white">Redacción de Noticias</h3>
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                    CMS Pro
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Redactá y publicá artículos periodísticos en el portal principal con auditoría de estilo soberano, asignación de autores y SEO asistido.
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#1e2633]">
                <Link href="/admin/news" className="text-xs text-gray-300 hover:text-white font-mono hover:underline">
                  Ver Notas →
                </Link>
                <Link
                  href="/admin/news/editor"
                  className="px-3 py-1.5 rounded-lg bg-[#182230] hover:bg-[#233144] text-[#e5b242] text-xs font-bold flex items-center gap-1 transition border border-[#2d3d52]"
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva Nota
                </Link>
              </div>
            </div>
          )}

          {/* Card 2: Nora Live Editor */}
          {matchesSearch('nora live editor móvil corresponsales') && (
            <Link
              href="/admin/news/live"
              className="bg-[#121822] border border-red-500/30 hover:border-red-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <h3 className="font-bold text-sm text-white group-hover:text-red-300 transition">
                      Nora Live Editor
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-950/80 text-rose-400 border border-rose-800/60 px-2 py-0.5 rounded font-bold uppercase">
                    Live Feed
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Editor móvil de asistencia periodística en vivo para corresponsales. Genera bajadas de última hora, titula con urgencia y coordina alertas push.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633]">
                <span className="text-rose-400 font-mono font-semibold">2 móviles transmitiendo</span>
                <span className="text-gray-300 font-bold group-hover:text-white flex items-center gap-1">
                  Entrar a Mesa Live <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )}

          {/* Card 3: Flash Noticioso */}
          {matchesSearch('flash noticioso audio neural síntesis') && (
            <div className="bg-[#121822] border border-[#1e2633] hover:border-[#2e3b4e] rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <h3 className="font-bold text-sm text-white">Flash Noticioso (1–5 min)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">Audio Neural</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Emisión de noticieros en síntesis generados automáticamente por Nora Clipper y locución neural con acento regional calibrado.
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#1e2633]">
                <span className="text-xs font-mono text-gray-400">Último corte: 16:30</span>
                <Link
                  href="/admin/news/flashes"
                  className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 text-xs font-bold transition"
                >
                  Compilar
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================
          MODULAR ROW 3: CRECIMIENTO & MARKETING (GROWTH)
      ==================================================== */}
      {(role === 'admin' || role === 'operator') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-indigo-500/30">
            <h2 className="font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-300">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> CRECIMIENTO & MARKETING (GROWTH)
            </h2>
            <span className="hidden sm:inline text-gray-500">IA de Prospección B2B y Performance de Pauta</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: VALEN CEO */}
            {matchesSearch('valen growth ceo leads b2b') && (
              <Link
                href="/admin/valen"
                className="bg-[#121822] border border-indigo-500/30 hover:border-indigo-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-200 transition">
                      VALEN — Growth Executive CEO
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Motor de escaneo en redes sociales, prospectación B2B y captación de clientes de alto valor inmobiliario y corporativo.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633]">
                  <span className="font-mono text-cyan-400">48 leads detectados</span>
                  <span className="text-white font-bold group-hover:underline flex items-center gap-1">
                    Ver Pipeline <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            )}

            {/* Card 2: Marketing & Ads AI */}
            {matchesSearch('marketing ads publicidad campañas viral') && (
              <Link
                href="/admin/marketing"
                className="bg-[#121822] border border-amber-500/30 hover:border-amber-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div>
                  <h3 className="font-bold text-sm text-amber-400 mb-3 group-hover:text-amber-300 transition">
                    Marketing & Ads AI
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Generación asistida de campañas publicitarias, segmentación geográfica en Ituzaingó y creación de piezas virales hiperlocales.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633]">
                  <span className="font-mono text-gray-400">CTR Promedio: 4.8%</span>
                  <span className="text-amber-400 font-bold group-hover:underline">Configurar Ads →</span>
                </div>
              </Link>
            )}

            {/* Card 3: Auspiciantes & Stats */}
            {matchesSearch('auspiciantes sponsors stats métricas anunciantes') && (
              <Link
                href="/admin/sponsors"
                className="bg-[#121822] border border-[#1e2633] hover:border-[#2e3b4e] rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div>
                  <h3 className="font-bold text-sm text-white mb-3 group-hover:text-amber-400 transition">
                    Auspiciantes & Stats
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Métricas de banners rotativos, click-through rate, anunciantes en tienda Nexora y liquidación de facturas comerciales del mes.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633]">
                  <span className="font-mono text-gray-400">14 cuentas activas</span>
                  <span className="text-gray-300 font-bold group-hover:text-white">Métricas →</span>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ====================================================
          MODULAR ROW 4: COMERCIO & GESTIÓN DE EQUIPO
      ==================================================== */}
      {(role === 'admin' || role === 'operator') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-cyan-500/30">
            <h2 className="font-bold uppercase tracking-wider flex items-center gap-2 text-cyan-300">
              <CreditCard className="w-4 h-4 text-cyan-400" /> COMERCIO, FINANZAS & STAFF
            </h2>
            <span className="hidden sm:inline text-gray-500">Tienda, Facturación y Cuentas de Personal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tienda */}
            {matchesSearch('tienda productos ecommerce catalogo store stock') && (
              <Link
                href="/admin/store"
                className="bg-[#121822] border border-[#1e2633] hover:border-cyan-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-200 transition">
                      Tienda & Catálogo Regional
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Administración de productos locales, inventario, precios y órdenes de compra con checkout integrado.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633]">
                  <span className="font-mono text-gray-400">E-Commerce Activo</span>
                  <span className="text-cyan-400 font-bold group-hover:underline flex items-center gap-1">
                    Gestionar Tienda <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            )}

            {/* Contabilidad (solo admin) */}
            {role === 'admin' && matchesSearch('contabilidad finanzas balance ingresos egresos') && (
              <Link
                href="/admin/accounting"
                className="bg-[#121822] border border-amber-500/30 hover:border-amber-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-200 transition">
                      Contabilidad & Finanzas
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Libro contable, registro de ingresos/egresos, conciliación bancaria y flujo de caja consolidado.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633]">
                  <span className="font-mono text-amber-400 font-bold">$1.84M ARS</span>
                  <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-1">
                    Abrir Libro <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            )}

            {/* Staff (solo admin) */}
            {role === 'admin' && matchesSearch('personal staff equipo operadores roles usuarios') && (
              <Link
                href="/admin/staff"
                className="bg-[#121822] border border-rose-500/30 hover:border-rose-400/60 rounded-xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-rose-400" />
                    <h3 className="font-bold text-sm text-white group-hover:text-rose-200 transition">
                      Gestión de Personal & Roles
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Alta y administración de cuentas de equipo, asignación de permisos y PINs de seguridad para terminales.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1e2633]">
                  <span className="font-mono text-gray-400">Equipo Seguro</span>
                  <span className="text-rose-400 font-bold group-hover:underline flex items-center gap-1">
                    Gestionar Staff <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ====================================================
          SECTION: REGISTRO DE ACTIVIDAD EDITORIAL EN VIVO
      ==================================================== */}
      <section className="bg-[#121822] border border-[#1e2633] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2
              className="font-serif font-bold text-lg text-white"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Registro de Actividad Editorial en Vivo
            </h2>
            <p className="text-xs text-gray-400">
              Eventos de corresponsalía y despacho automático procesados por Nexativa Core
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 font-mono text-[11px] font-semibold shrink-0">
            Actualización Continua
          </span>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e2633] text-gray-500 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">HORA</th>
                <th className="py-2.5 px-3">MÓDULO</th>
                <th className="py-2.5 px-3">EVENTO / ACCIÓN</th>
                <th className="py-2.5 px-3">OPERADOR / AGENTE</th>
                <th className="py-2.5 px-3 text-right">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182230]">
              {MOCK_LOGS.map((item) => (
                <tr key={item.id} className="hover:bg-[#161f2c] transition">
                  <td className="py-3 px-3 font-mono text-gray-400">{item.time}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#1c2635] text-gray-300 font-semibold">
                      {item.module}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-200 font-medium">{item.action}</td>
                  <td className="py-3 px-3 text-gray-400">{item.operator}</td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        item.statusColor === 'emerald'
                          ? 'text-emerald-400'
                          : item.statusColor === 'cyan'
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
