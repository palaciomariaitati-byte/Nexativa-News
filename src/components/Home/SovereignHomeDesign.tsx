'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Menu,
  X,
  Sun,
  Moon,
  TrendingUp,
  Share2,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Users,
  MapPin,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
  Clock,
  Send,
  CheckCircle2,
  Phone,
  Briefcase,
  Tv,
  ShoppingBag,
  Building,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import type { Article, Sponsor, Product } from '@/lib/types';
import type { VerifiedProperty } from '@/lib/supabase/serverQueries';
import NewsTabs from '@/components/NewsTabs/NewsTabs';
import SponsorsMarquee from '@/components/SponsorsMarquee';
import VideoSection from '@/components/VideoSection';

// ==========================================
// MOCK DATA CONTRACTS & INTERFACES
// ==========================================
interface MarketTicker {
  symbol: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface SportsMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'LIVE' | 'FINISHED' | 'SCHEDULED';
  timeInfo: string;
}

interface PropertyListing {
  id: string;
  title: string;
  location: string;
  pricePerNightUSD: number;
  rating: number;
  reviewsCount: number;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  isVerified: boolean;
  imageUrl: string;
}

interface CommercialProvider {
  id: string;
  category: string;
  name: string;
  description: string;
  contactText: string;
  verified: boolean;
  phone?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  priceARS: number;
  period: string;
  highlighted?: boolean;
  badge?: string;
  features: string[];
  ctaText: string;
}

// ==========================================
// STATIC PRESETS & FALLBACKS
// ==========================================
const MOCK_TICKERS: MarketTicker[] = [
  { symbol: 'USD/ARS', value: '$1.220', change: '+0.4%', isPositive: true },
  { symbol: 'EUR/ARS', value: '$1.325', change: '-0.1%', isPositive: false },
  { symbol: 'CCL', value: '$1.245', change: '+1.2%', isPositive: true },
  { symbol: 'MERVAL', value: '1.842.100', change: '+2.1%', isPositive: true },
  { symbol: 'M² ITUZAINGÓ', value: 'US$ 1.680', change: '+0.1%', isPositive: true },
];

const MOCK_SPORTS: SportsMatch[] = [
  {
    id: 'sp-01',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Man. City',
    homeScore: 1,
    awayScore: 1,
    status: 'LIVE',
    timeInfo: "82' EN JUEGO",
  },
  {
    id: 'sp-02',
    league: 'Liga Profesional',
    homeTeam: 'Boca Juniors',
    awayTeam: 'River Plate',
    homeScore: 2,
    awayScore: 1,
    status: 'FINISHED',
    timeInfo: 'FINALIZADO',
  },
  {
    id: 'sp-03',
    league: 'LaLiga EA Sports',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 3,
    awayScore: 2,
    status: 'FINISHED',
    timeInfo: 'FINALIZADO',
  },
];

const MOCK_PROPERTIES: PropertyListing[] = [
  {
    id: 'prop-01',
    title: 'Villa Serena: Residencia Costera con Muelle Privado',
    location: 'Rincón de las Aves, Ituzaingó',
    pricePerNightUSD: 180,
    rating: 4.98,
    reviewsCount: 38,
    bedrooms: 4,
    bathrooms: 3,
    capacity: 8,
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prop-02',
    title: 'Penthouse Mirador • Frente a Playa Punta Norte',
    location: 'Playas del Paraná, Ituzaingó',
    pricePerNightUSD: 135,
    rating: 4.94,
    reviewsCount: 22,
    bedrooms: 2,
    bathrooms: 2,
    capacity: 4,
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prop-03',
    title: 'Cabaña Boutique Los Lapachos & Solarium Climatizado',
    location: 'Bosque Urbano Ituzaingó',
    pricePerNightUSD: 95,
    rating: 4.96,
    reviewsCount: 19,
    bedrooms: 3,
    bathrooms: 2,
    capacity: 6,
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prop-04',
    title: 'Executive Loft Centro • Estilo & Conectividad 500MB',
    location: 'Centro Histórico, Ituzaingó',
    pricePerNightUSD: 70,
    rating: 4.91,
    reviewsCount: 45,
    bedrooms: 1,
    bathrooms: 1,
    capacity: 2,
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  },
];

const MOCK_PROVIDERS: CommercialProvider[] = [
  {
    id: 'pr-01',
    category: 'ARQUITECTURA & URBANISMO',
    name: 'Estudio Nexus • Proyectos a Medida',
    description: 'Asesoramiento integral de obra, cómputo métrico y cálculo estructural para el corredor Ituzaingó-Posadas.',
    contactText: 'Presupuesto sin cargo',
    verified: true,
  },
  {
    id: 'pr-02',
    category: 'BIENESTAR & ESTÉTICA',
    name: 'Perfilado, Laminado & Lash Lifting',
    description: 'Atención personalizada con insumos hipoalergénicos certificados, cejas y manicuría rusa de alta gama.',
    contactText: 'Consultar Turnos',
    verified: true,
  },
  {
    id: 'pr-03',
    category: 'ALTA JOYERÍA DE AUTOR',
    name: 'Orfebrería en Plata 925 Genuina',
    description: 'Piezas únicas forjadas a mano con sello de contraste notarial e incrustaciones de piedras naturales del litoral.',
    contactText: 'Catálogo Exclusivo',
    verified: true,
  },
  {
    id: 'pr-04',
    category: 'EDICIONES DE COLECCIÓN',
    name: 'Anuarios Nexativa (Ed. 35, 36 & 37)',
    description: 'Compilados de crónicas impresas en papel ilustración mate, ensayos económicos y fotografías del Río Paraná.',
    contactText: 'Stock Limitado',
    verified: true,
  },
];

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-bronce',
    name: 'Plan Bronce',
    priceARS: 2500,
    period: '/ mes',
    features: [
      'Acceso ilimitado a noticias del portal',
      'Alertas en tiempo real vía Telegram',
      'Descuentos en alquileres verificados seleccionados',
      'Reportes financieros matutinos breves',
    ],
    ctaText: 'Suscribirse a Bronce',
  },
  {
    id: 'plan-oro',
    name: 'Oro VIP',
    badge: 'MÁS ELEGIDO POR EMPRESARIOS',
    priceARS: 7900,
    period: '/ mes',
    highlighted: true,
    features: [
      'Acceso total e irrestricto sin publicidad',
      'Soporte prioritario 24/7 y Línea directa editorial',
      '15% OFF garantizado en Alquileres Verificados',
      'Anuarios impresos sin costo de despacho',
      'Voto en el Pálpito de la Fecha con premios de peña',
      'Acceso anticipado a Dossiers de Inversión',
    ],
    ctaText: 'Suscribirse a Plan Oro VIP',
  },
  {
    id: 'plan-plata',
    name: 'Plan Plata',
    priceARS: 4800,
    period: '/ mes',
    features: [
      'Acceso completo a notas de archivo histórico',
      'Boletín semanal económico exclusivo',
      '10% de descuento en Guía Nexora Store',
      'Insignia digital Pro en comentarios de debate',
    ],
    ctaText: 'Suscribirse a Plata',
  },
];

interface SovereignHomeDesignProps {
  initialArticles?: Article[];
  sponsors?: Sponsor[];
  newsFlashes?: Array<{ id: string; title: string; content?: string; created_at?: string }>;
  products?: Product[];
  properties?: VerifiedProperty[];
  stores?: any[];
}

export default function SovereignHomeDesign({
  initialArticles = [],
  sponsors = [],
  newsFlashes = [],
  products = [],
  properties = [],
  stores = [],
}: SovereignHomeDesignProps) {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mobileSportsOpen, setMobileSportsOpen] = useState<boolean>(false);
  const [palpitoBoca, setPalpitoBoca] = useState<number>(2);
  const [palpitoRiver, setPalpitoRiver] = useState<number>(1);
  const [commentInput, setCommentInput] = useState<string>('');
  const [palpitoSent, setPalpitoSent] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [sportsMatches, setSportsMatches] = useState<SportsMatch[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadScores() {
      try {
        const res = await fetch('/api/sports/scores');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.matches) && json.matches.length > 0) {
            const mapped: SportsMatch[] = json.matches.map((m: any) => ({
              id: m.id || String(Math.random()),
              league: m.leagueName || 'Fútbol',
              homeTeam: m.homeTeam || 'Local',
              awayTeam: m.awayTeam || 'Visitante',
              homeScore: typeof m.homeScore === 'number' ? m.homeScore : 0,
              awayScore: typeof m.awayScore === 'number' ? m.awayScore : 0,
              status: m.status === 'EN VIVO' ? 'LIVE' : m.status === 'FINALIZADO' ? 'FINISHED' : 'SCHEDULED',
              timeInfo: m.status === 'EN VIVO' ? (m.minute || 'EN DIRECTO') : m.status === 'FINALIZADO' ? 'FINALIZADO' : m.time ? `${m.time} HS` : 'HOY',
            }));
            if (isMounted) setSportsMatches(mapped);
          }
        }
      } catch (e) {
        console.error('Error fetching live sports:', e);
      }
    }
    loadScores();
    const timer = setInterval(loadScores, 60000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleOpenNora = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-nora-chat'));
    }
  };

  // 1. Resolve Primary Main Article (from Supabase or Editorial Fallback)
  const realMain = initialArticles[0];
  const mainArticle = {
    id: realMain ? String(realMain.id) : 'art-01',
    badge: realMain?.category?.toUpperCase() || 'POLÍTICA & DESARROLLO REGIONAL',
    headline: realMain?.title || 'Acuerdo Estratégico en el Alto Paraná y Proyecciones Económicas 2026',
    lead:
      realMain?.excerpt ||
      (realMain?.content ? realMain.content.slice(0, 240) + '...' : null) ||
      'Las comitivas binacionales ratificaron las pautas de inversión hidroeléctrica, la ampliación portuaria comercial en Ituzaingó y el nuevo marco tributario para el transporte fluvial regional. Análisis exclusivo sobre el impacto crediticio y la reactivación inmobiliaria costera.',
    author: {
      name: 'Redacción Nexativa',
      role: 'Corresponsal Ituzaingó & Litoral',
      avatarInitials: 'NX',
    },
    readTime: '6 min de lectura',
    imageUrl:
      realMain?.image_url ||
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=80',
    imageCaption: realMain?.title
      ? `Cobertura especial de Nexativa: ${realMain.title}`
      : 'Firma de memorándum de entendimiento trilateral para el dragado de la Hidrovía Paraná-Paraguay.',
    href: realMain ? `/noticias/${realMain.id}` : '#dossier',
  };

  // 2. Resolve Secondary Articles
  const realSecondary = initialArticles.slice(1, 4);
  const secondaryArticles = [
    {
      id: realSecondary[0] ? String(realSecondary[0].id) : 'art-02',
      category: realSecondary[0]?.category?.toUpperCase() || 'FINANZAS & DÓLAR',
      title: realSecondary[0]?.title || 'El Banco Central flexibiliza cuotas para bienes durables de importación directa',
      summary:
        realSecondary[0]?.excerpt ||
        (realSecondary[0]?.content ? realSecondary[0].content.slice(0, 140) + '...' : null) ||
        'Las PyMEs del sector metalmecánico proyectan ajustes en inventarios ante la recalibración de tasas pasivas del tesoro.',
      readTime: '4 min',
      imageUrl:
        realSecondary[0]?.image_url ||
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
      href: realSecondary[0] ? `/noticias/${realSecondary[0].id}` : '#',
    },
    {
      id: realSecondary[1] ? String(realSecondary[1].id) : 'art-03',
      category: realSecondary[1]?.category?.toUpperCase() || 'ECOTURISMO ESTEROS',
      title: realSecondary[1]?.title || 'El Iberá registra reserva récord para el corredor Ituzaingó–Carlos Pellegrini',
      summary:
        realSecondary[1]?.excerpt ||
        (realSecondary[1]?.content ? realSecondary[1].content.slice(0, 140) + '...' : null) ||
        'La inversión hotelera sustentable triplica la demanda de turismo extranjero con base en el portal norte.',
      readTime: '3 min',
      imageUrl:
        realSecondary[1]?.image_url ||
        'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
      href: realSecondary[1] ? `/noticias/${realSecondary[1].id}` : '#',
    },
    {
      id: realSecondary[2] ? String(realSecondary[2].id) : 'art-04',
      category: realSecondary[2]?.category?.toUpperCase() || 'TRANSPORTE & LOGÍSTICA',
      title: realSecondary[2]?.title || 'Obras del Parque Industrial Ituzaingó incorporan enlace a Ruta Nacional 12',
      summary:
        realSecondary[2]?.excerpt ||
        (realSecondary[2]?.content ? realSecondary[2].content.slice(0, 140) + '...' : null) ||
        'El nuevo ramal directo al puerto metropolitano reduce un 22% los fletes en la zona del corredor forestoindustrial.',
      readTime: '5 min',
      imageUrl:
        realSecondary[2]?.image_url ||
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      href: realSecondary[2] ? `/noticias/${realSecondary[2].id}` : '#',
    },
  ];

  // 3. Resolve Breaking News Flash
  const latestFlash = newsFlashes[0];
  const breakingNewsText = latestFlash
    ? `${latestFlash.title} — ${latestFlash.content || ''}`
    : 'Ituzaingó Norte licita nuevo polo biotecnológico sobre Autopista del Oeste con inversión privada garantizada.';

  // 4. Resolve Verified Real Estate Properties (From Supabase or Fallback to Sovereign Mock)
  const resolvedProperties: PropertyListing[] = (properties && properties.length > 0)
    ? properties.map((p) => ({
        id: p.id,
        title: p.title,
        location: p.location || 'Ituzaingó, Corrientes',
        pricePerNightUSD: p.pricePerNightUSD || 85,
        rating: p.rating || 4.95,
        reviewsCount: p.reviewsCount || 18,
        bedrooms: p.bedrooms || 2,
        bathrooms: p.bathrooms || 1,
        capacity: p.capacity || 4,
        isVerified: p.isVerified ?? true,
        imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      }))
    : MOCK_PROPERTIES;

  // 5. Resolve Commercial Providers (Stores + Sponsors with Sovereign Fallback)
  const realStoresProviders = (stores && stores.length > 0)
    ? stores.map((st: any) => ({
        id: String(st?.id || Math.random()),
        category: String(st?.category || 'COMERCIO HABILITADO').toUpperCase(),
        name: String(st?.name || 'Comercio Registrado'),
        description: String(st?.description || st?.slogan || 'Comercio formal verificado en la Guía Comercial de Ituzaingó.'),
        contactText: 'Ver en Guía',
        verified: true,
        phone: st?.whatsapp || st?.phone || undefined,
      }))
    : [];

  const realSponsorsProviders = sponsors.map((sp) => ({
    id: sp?.id || String(Math.random()),
    category: String(sp?.category || 'COMERCIO DESTACADO').toUpperCase(),
    name: String(sp?.name || 'Comercio Auspiciante'),
    description: String(sp?.slogan || (sp as any)?.description || 'Comercio auspiciante oficial de Nexativa News en el corredor del Litoral.'),
    contactText: 'Contactar Comercio',
    verified: true,
    phone: sp?.whatsapp || undefined,
  }));

  const allRealProviders = [...realStoresProviders, ...realSponsorsProviders];
  const combinedProviders: CommercialProvider[] =
    allRealProviders.length > 0 ? allRealProviders.slice(0, 8) : MOCK_PROVIDERS;

  const renderSportsContent = () => (
    <div className="space-y-6">
      {/* Live Sports Card */}
      <div
        className={`rounded-2xl border p-6 ${
          darkMode ? 'bg-[#0f141b] border-[#1e2633]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-bold text-sm tracking-wide uppercase">Central de Resultados</h3>
          </div>
          <span className="text-[11px] text-amber-500 font-mono font-semibold">EN VIVO</span>
        </div>

        {/* Match list */}
        <div className="divide-y divide-gray-800/60 mt-3">
          {(sportsMatches.length > 0 ? sportsMatches : MOCK_SPORTS).slice(0, 5).map((match) => (
            <div key={match.id} className="py-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                <span className="font-semibold text-amber-500/90">{match.league}</span>
                <span
                  className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${
                    match.status === 'LIVE'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse font-bold'
                      : match.status === 'SCHEDULED'
                      ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {match.timeInfo}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/95 truncate max-w-[170px]">{match.homeTeam}</span>
                  <span className="text-white/80 truncate max-w-[170px]">{match.awayTeam}</span>
                </div>
                <div className="font-mono text-base font-bold bg-[#131923] px-2.5 py-1 rounded border border-gray-800 flex flex-col items-center min-w-[36px]">
                  <span className="text-amber-400">{match.status === 'SCHEDULED' ? '-' : match.homeScore}</span>
                  <span className="text-gray-400">{match.status === 'SCHEDULED' ? '-' : match.awayScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pálpito de la Fecha Interactive Widget */}
      {(() => {
        const featuredMatch = sportsMatches.find(m => m.status === 'SCHEDULED' || m.status === 'LIVE') || sportsMatches[0];
        const teamA = featuredMatch ? featuredMatch.homeTeam : 'Boca Juniors';
        const teamB = featuredMatch ? featuredMatch.awayTeam : 'River Plate';
        const leagueTitle = featuredMatch ? featuredMatch.league : 'Liga Profesional';

        return (
          <div
            className={`rounded-2xl border p-6 ${
              darkMode ? 'bg-[#0f141b] border-[#1e2633]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pálpito de la Fecha ({leagueTitle})</span>
              <span className="text-[11px] text-gray-400">1.842 votos</span>
            </div>
            <h4 className="text-sm font-semibold mb-4">Pronosticá el partido de hoy con la peña</h4>

            <div className="flex items-center justify-around bg-[#131923] p-4 rounded-xl border border-gray-800 mb-4">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-blue-400 mb-1 truncate max-w-[110px] text-center">{teamA}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPalpitoBoca(Math.max(0, palpitoBoca - 1))}
                    className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-xl font-bold text-amber-400 w-6 text-center">{palpitoBoca}</span>
                  <button
                    onClick={() => setPalpitoBoca(palpitoBoca + 1)}
                    className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <span className="text-gray-500 font-bold text-xs uppercase">VS</span>

              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-rose-400 mb-1 truncate max-w-[110px] text-center">{teamB}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPalpitoRiver(Math.max(0, palpitoRiver - 1))}
                    className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-xl font-bold text-amber-400 w-6 text-center">{palpitoRiver}</span>
                  <button
                    onClick={() => setPalpitoRiver(palpitoRiver + 1)}
                    className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPalpitoSent(true);
                setTimeout(() => setPalpitoSent(false), 3000);
              }}
              disabled={palpitoSent}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                palpitoSent
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
              }`}
            >
              {palpitoSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> ¡Pálpito Registrado!
                </>
              ) : (
                'Enviar Pronóstico'
              )}
            </button>
          </div>
        );
      })()}

      {/* Community Debate Live Card */}
      <div
        className={`rounded-2xl border p-6 ${
          darkMode ? 'bg-[#0f141b] border-[#1e2633]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm tracking-wide uppercase">Debate Comunitario</h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            MODERADO
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="bg-[#121822] p-3 rounded-xl border border-gray-800/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span className="font-bold text-amber-400">@mariano_ituzaingo</span>
              <span>Hace 12 min</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              &quot;Excelente el nuevo muelle sobre el Paraná, era una obra que la ciudad necesitaba hace 15 años.&quot;
            </p>
          </div>

          <div className="bg-[#121822] p-3 rounded-xl border border-gray-800/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span className="font-bold text-amber-400">@laura_posadas</span>
              <span>Hace 34 min</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              &quot;¿Cuándo abren las inscripciones para el corredor gastronómico del verano?&quot;
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 pt-4">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commentInput.trim()) {
                alert('¡Comentario enviado a moderación de la peña!');
                setCommentInput('');
              }
            }}
            placeholder="Dejá tu opinión futbolera..."
            className={`flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none border ${
              darkMode ? 'bg-[#121822] border-gray-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          <button
            onClick={() => {
              if (commentInput.trim()) {
                alert('¡Comentario enviado a moderación de la peña!');
                setCommentInput('');
              }
            }}
            className="p-2 rounded-lg bg-amber-500 text-black hover:brightness-110 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-[#0a0e14] text-[#e2e8f0]' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}
    >
      {/* 1. TOP TICKER & FINANCIAL BAR */}
      <header
        className={`border-b text-xs transition-colors ${
          darkMode ? 'bg-[#0f141b] border-[#1e2633] text-gray-400' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
            <span
              className={`font-semibold tracking-wider flex items-center gap-1.5 uppercase shrink-0 ${
                darkMode ? 'text-[#e5b242]' : 'text-amber-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Cotizaciones:
            </span>
            {MOCK_TICKERS.map((t, idx) => (
              <div key={idx} className="flex items-center gap-1.5 shrink-0">
                <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{t.symbol}</span>
                <span className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-950'}`}>{t.value}</span>
                <span className={t.isPositive ? 'text-emerald-500 font-mono font-bold' : 'text-rose-500 font-mono font-bold'}>
                  {t.change}
                </span>
                {idx < MOCK_TICKERS.length - 1 && <span className={darkMode ? 'text-gray-700 mx-1' : 'text-slate-300 mx-1'}>•</span>}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <span className={`hidden md:inline-block ${darkMode ? 'text-gray-400' : 'text-slate-600 font-medium'}`}>
              Edición Soberana 2026 • Litoral & Global
            </span>
            <button
              onClick={toggleTheme}
              aria-label="Cambiar modo de color"
              className={`p-1.5 rounded-md border flex items-center gap-1 transition cursor-pointer ${
                darkMode
                  ? 'border-[#2a3444] bg-[#171f2b] text-[#e5b242] hover:bg-[#1f2a3a]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono">{darkMode ? 'LIGHT' : 'DARK'}</span>
            </button>
            <Link
              href="/checkout?tier=oro"
              className="font-semibold text-xs tracking-wider px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 transition shadow-sm"
            >
              CLUB VIP
            </Link>
          </div>
        </div>
      </header>

      {/* 2. PRIMARY NAVBAR & MASTHEAD (CON ACCESO DIRECTO A TODOS LOS PORTALES) */}
      <nav
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
          darkMode ? 'bg-[#0a0e14]/95 border-[#1e2633]' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-3 py-3 min-h-[5.5rem]">
            {/* Mobile menu trigger */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition ${
                  darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-slate-700 hover:text-black hover:bg-slate-100'
                }`}
                aria-label="Menú móvil"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link
                href="/news"
                className={`p-2 rounded-lg transition ${
                  darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-slate-700 hover:text-black hover:bg-slate-100'
                }`}
              >
                <Search className="w-5 h-5" />
              </Link>
            </div>

            {/* Editorial Brand Masthead */}
            <div className="flex flex-col items-center justify-center flex-1 lg:flex-initial py-1">
              <Link href="/" className="flex flex-col items-center group text-center px-1">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight leading-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  <span className={darkMode ? 'text-white' : 'text-slate-950 font-black'}>NEXATIVA </span>
                  <span className="text-[#e5b242] italic font-black">NEWS</span>
                </span>
                <span
                  className={`text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.2em] font-sans font-semibold mt-1 leading-snug line-clamp-1 transition ${
                    darkMode ? 'text-gray-400 group-hover:text-amber-400' : 'text-slate-600 group-hover:text-amber-700'
                  }`}
                >
                  Investigación Rigurosa & Inteligencia Institucional
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links (TODOS LOS PORTALES CLAVE CON CONTRASTE ALTO) */}
            <div className="hidden lg:flex items-center space-x-3 text-xs font-bold uppercase tracking-wider">
              <Link
                href="/"
                className="text-[#e5b242] border-b-2 border-[#e5b242] pb-0.5 font-black"
              >
                Inicio
              </Link>
              <Link
                href="/noticias"
                className={`py-1 transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-slate-800 hover:text-black font-extrabold'
                }`}
              >
                Noticias
              </Link>
              <Link
                href="/empleos"
                className={`py-1 px-3 rounded-full text-xs font-black tracking-wider transition-all flex items-center gap-1.5 border shadow-sm ${
                  darkMode
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-400 font-black'
                }`}
                title="Bolsa Laboral & Prestadores de Oficios"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span>EMPLEOS</span>
              </Link>
              <Link
                href="/guia/inmuebles"
                className={`py-1 px-3 rounded-full text-xs font-black tracking-wider transition-all flex items-center gap-1.5 border shadow-sm ${
                  darkMode
                    ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-500/50'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-400 font-black'
                }`}
                title="Alquileres Temporarios Verificados"
              >
                <Building className="w-3.5 h-3.5 text-rose-500" />
                <span>INMUEBLES</span>
              </Link>
              <Link
                href="/guia"
                className={`py-1 px-3 rounded-full text-xs font-black tracking-wider transition-all flex items-center gap-1.5 border shadow-sm ${
                  darkMode
                    ? 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-500/50'
                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-400 font-black'
                }`}
                title="Guía Comercial de Comercios & Servicios"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>GUÍA</span>
              </Link>
              <Link
                href="/cultura"
                className={`py-1 transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-slate-800 hover:text-black font-extrabold'
                }`}
              >
                Cultura
              </Link>
              <Link
                href="/clasificados"
                className={`py-1 transition-colors ${
                  darkMode ? 'text-amber-300 hover:text-amber-200' : 'text-amber-800 hover:text-amber-950 font-extrabold'
                }`}
              >
                Clasificados
              </Link>
              <Link
                href="/noticias?categoria=Deportes"
                className={`py-1 transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-slate-800 hover:text-black font-extrabold'
                }`}
              >
                Deportes
              </Link>
              <Link
                href="/#streaming"
                className={`py-1 px-2.5 rounded-full text-xs font-black tracking-wider transition-all flex items-center gap-1.5 border shadow-sm ${
                  darkMode
                    ? 'bg-red-950/80 text-red-300 border-red-500/50 hover:bg-red-900'
                    : 'bg-red-50 text-red-900 border-red-400 hover:bg-red-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span>EN VIVO</span>
              </Link>
            </div>

            {/* Actions / Search & Nora */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/news"
                className={`relative flex items-center rounded-full border px-3.5 py-1.5 text-xs transition shadow-sm ${
                  darkMode
                    ? 'bg-[#131923] border-[#222d3d] text-gray-300 hover:border-gray-500'
                    : 'bg-white border-slate-300 text-slate-800 hover:border-slate-500'
                }`}
              >
                <Search className="w-3.5 h-3.5 mr-2 text-gray-400" />
                <span className={darkMode ? 'text-gray-400 text-xs' : 'text-slate-500 text-xs font-medium'}>
                  Buscar notas, dossiers...
                </span>
              </Link>
              <button
                onClick={handleOpenNora}
                className={`p-2 rounded-full border transition cursor-pointer shadow-sm ${
                  darkMode
                    ? 'border-[#222d3d] text-[#e5b242] hover:text-white hover:bg-[#161f2c]'
                    : 'border-amber-400/60 text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
                title="Hablar con Nora IA"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer con rutas reales dinámicas y autogestión */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-b px-5 py-4 space-y-2 ${
              darkMode ? 'bg-[#0f141b] border-[#1e2633]' : 'bg-white border-slate-200 shadow-xl'
            }`}
          >
            {[
              { label: 'Portada Principal', href: '/' },
              { label: '📰 Prensa & Archivo Noticioso', href: '/noticias' },
              { label: '💼 Portal de Empleos & Oficios (Buscar)', href: '/empleos', highlight: darkMode ? 'text-emerald-400 font-bold' : 'text-emerald-800 font-extrabold' },
              { label: '🛠️ Mi Perfil de Oficio / CV (Autogestión)', href: '/prestadores', highlight: darkMode ? 'text-emerald-300 font-black bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg' : 'text-emerald-950 font-black bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg' },
              { label: '🏠 Alquileres Verificados Ituzaingó', href: '/guia/inmuebles', highlight: darkMode ? 'text-rose-400 font-bold' : 'text-rose-800 font-extrabold' },
              { label: '🔑 Panel de Propietario (Autogestión)', href: '/guia/inmuebles/propietario', highlight: darkMode ? 'text-rose-300 font-black bg-rose-950/70 border border-rose-500/40 px-2.5 py-1 rounded-lg' : 'text-rose-950 font-black bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-lg' },
              { label: '📑 Mis Reservas / Inquilino', href: '/guia/inmuebles/inquilino', highlight: darkMode ? 'text-gray-300' : 'text-slate-700' },
              { label: '📖 Guía Comercial de Ituzaingó', href: '/guia', highlight: darkMode ? 'text-cyan-400 font-bold' : 'text-cyan-800 font-extrabold' },
              { label: '🏪 Registrar Comercio en la Guía', href: '/guia/registro', highlight: darkMode ? 'text-cyan-300 font-black bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 rounded-lg' : 'text-cyan-950 font-black bg-cyan-100 border border-cyan-300 px-2.5 py-1 rounded-lg' },
              { label: '🎨 Espacio Cultural Regional', href: '/cultura' },
              { label: '🏷️ Avisos Clasificados', href: '/clasificados' },
              { label: '⚽ Central Deportiva', href: '/noticias?categoria=Deportes' },
              { label: '📺 Transmisión Streaming En Vivo', href: '/#streaming', highlight: 'text-red-500 font-black' },
              { label: '👑 Planes de Membresía VIP', href: '/checkout?tier=oro', highlight: 'text-amber-500 font-black' },
            ].map((link, i) => (
              <Link
                key={i}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-xs sm:text-sm font-semibold py-2 border-b transition ${
                  darkMode ? 'border-gray-800/60' : 'border-slate-100'
                } ${
                  link.highlight || (darkMode ? 'text-gray-300 hover:text-[#e5b242]' : 'text-slate-800 hover:text-black')
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* 3. BREAKING NEWS TICKER (LIMPIO Y SIN SOLAPAMIENTO) */}
      <div
        className={`border-b text-xs relative z-20 transition-colors shadow-sm ${
          darkMode ? 'bg-[#131a24] border-[#1e2633]' : 'bg-amber-50/95 border-amber-200 text-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
          <span className="bg-[#b45309] text-white px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider shrink-0 uppercase animate-pulse shadow-sm">
            ÚLTIMA HORA
          </span>
          <p className="truncate text-xs">
            <span className={darkMode ? 'font-bold text-amber-400' : 'font-extrabold text-amber-800'}>FLASH INFORMATIVO:</span>{' '}
            <span className={darkMode ? 'text-gray-300' : 'text-slate-800 font-medium'}>{breakingNewsText}</span>
          </p>
        </div>
      </div>

      {/* 4. CINTA ANIMADA DE PATROCINADORES OFICIALES */}
      {sponsors.length > 0 && (
        <div className="w-full">
          <SponsorsMarquee sponsors={sponsors} />
        </div>
      )}

      {/* 5. SOVEREIGN MOBILE ACTION PILLS (STICKY JUMP BAR) */}
      <div className={`lg:hidden sticky top-0 z-30 backdrop-blur-md border-b py-2.5 px-3 overflow-x-auto no-scrollbar flex items-center gap-2 shadow-lg transition-colors ${
        darkMode ? 'bg-[#0a0e14]/95 border-gray-800/90' : 'bg-white/95 border-slate-300'
      }`}>
        <Link
          href="#noticias-panel"
          className="shrink-0 px-3 py-1.5 rounded-full bg-slate-900 border border-gray-700 text-[11px] font-bold text-slate-100 active:scale-95 transition"
        >
          📰 Prensa
        </Link>
        <Link
          href="/empleos"
          className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/70 text-[11px] font-black text-emerald-200 active:scale-95 transition"
        >
          💼 Empleos
        </Link>
        <Link
          href="/prestadores"
          className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-600 text-slate-950 text-[11px] font-black active:scale-95 transition shadow-sm"
          title="Autogestionar perfil de prestador"
        >
          🛠️ Mi Perfil
        </Link>
        <Link
          href="/guia/inmuebles"
          className="shrink-0 px-3 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/70 text-[11px] font-black text-rose-200 active:scale-95 transition"
        >
          🏠 Inmuebles
        </Link>
        <Link
          href="/guia/inmuebles/propietario"
          className="shrink-0 px-3 py-1.5 rounded-full bg-rose-600 text-slate-950 text-[11px] font-black active:scale-95 transition shadow-sm"
          title="Panel de Propietario para autogestionar inmuebles"
        >
          🔑 Propietario
        </Link>
        <Link
          href="/guia"
          className="shrink-0 px-3 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/70 text-[11px] font-black text-cyan-200 active:scale-95 transition"
        >
          📖 Guía
        </Link>
        {products.length > 0 && (
          <Link
            href="#tienda"
            className="shrink-0 px-3 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/70 text-[11px] font-black text-amber-200 active:scale-95 transition"
          >
            🛍️ Tienda
          </Link>
        )}
        <Link
          href="#membresias"
          className="shrink-0 px-3 py-1.5 rounded-full bg-yellow-950/90 border border-yellow-500/70 text-[11px] font-black text-yellow-200 active:scale-95 transition"
        >
          👑 Club VIP
        </Link>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12 sm:space-y-16">
        {/* ====================================================
            SECTION 1: HERO EDITORIAL (8 COLS) + SPORTS SIDEBAR (4 COLS)
           ==================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 8 COLUMNS: MAIN ARTICLE & REGIONAL DOSSIERS */}
          <div className="lg:col-span-8 space-y-8">
            <article
              className={`rounded-2xl border p-6 sm:p-8 transition ${
                darkMode ? 'bg-[#0f141b] border-[#1e2633]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <Link
                  href={`/noticias?categoria=${encodeURIComponent(realMain?.category || 'General')}`}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider uppercase bg-amber-500/10 text-[#e5b242] border border-[#e5b242]/30 hover:bg-amber-500/20 transition cursor-pointer"
                >
                  {mainArticle.badge}
                </Link>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {mainArticle.readTime}
                  </span>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: mainArticle.headline, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                        alert('¡Enlace de nota copiado!');
                      }
                    }}
                    className="hover:text-amber-400 transition cursor-pointer"
                    aria-label="Compartir"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="hover:text-amber-400 transition cursor-pointer" aria-label="Guardar nota">
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold leading-tight mb-4 tracking-tight"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <Link href={mainArticle.href} className="hover:text-[#e5b242] transition-colors">
                  {mainArticle.headline}
                </Link>
              </h1>

              <p className={`text-base sm:text-lg leading-relaxed mb-6 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                {mainArticle.lead}
              </p>

              {/* Author Attribution */}
              <div className="flex items-center justify-between border-y py-3 mb-6 border-gray-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#e5b242] text-black font-bold flex items-center justify-center text-xs">
                    {mainArticle.author.avatarInitials}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold leading-none">{mainArticle.author.name}</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">{mainArticle.author.role}</p>
                  </div>
                </div>
                <Link
                  href={mainArticle.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#e5b242] hover:underline"
                >
                  LEER COBERTURA COMPLETA <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Main Photo Banner */}
              <Link href={mainArticle.href} className="block relative rounded-xl overflow-hidden group">
                <img
                  src={mainArticle.imageUrl}
                  alt={mainArticle.headline}
                  className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-xs text-gray-300 backdrop-blur-md bg-black/40 px-3 py-2 rounded-lg border border-white/10">
                  <span className="font-semibold text-amber-400">DOC. REF #NX-2026: </span> {mainArticle.imageCaption}
                </div>
              </Link>
            </article>

            {/* Secondary 3-Column Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {secondaryArticles.map((sec) => (
                <div
                  key={sec.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition hover:-translate-y-1 ${
                    darkMode ? 'bg-[#0f141b] border-[#1e2633]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="relative h-32 rounded-lg overflow-hidden mb-3 group">
                      <Link href={sec.href} className="block w-full h-full">
                        <img
                          src={sec.imageUrl}
                          alt={sec.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        />
                      </Link>
                      <Link
                        href={`/noticias?categoria=${encodeURIComponent(sec.category)}`}
                        className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 hover:bg-amber-500 hover:text-black text-amber-400 uppercase tracking-wider backdrop-blur-sm transition z-10"
                      >
                        {sec.category}
                      </Link>
                    </div>
                    <h3 className="font-serif font-bold text-sm leading-snug mb-2 line-clamp-2">
                      <Link href={sec.href} className="hover:text-[#e5b242] transition-colors">
                        {sec.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">{sec.summary}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-800/40">
                    <span>{sec.readTime}</span>
                    <Link href={sec.href} className="text-[#e5b242] font-semibold flex items-center gap-0.5">
                      Ver Nota <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: CENTRAL DE RESULTADOS & COMMUNITY */}
          <aside className="lg:col-span-4" id="deportes">
            {/* MOBILE COMPACT ACCORDION */}
            <div className="lg:hidden rounded-2xl border border-gray-800 bg-[#0f141b] p-4 shadow-xl mb-4">
              <button
                onClick={() => setMobileSportsOpen(!mobileSportsOpen)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
                aria-expanded={mobileSportsOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      CENTRAL DEPORTIVA & COMUNIDAD
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      Resultados En Vivo • Pálpito de la Fecha
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-1 shrink-0">
                  {mobileSportsOpen ? 'Cerrar' : 'Ver Fixture'}{' '}
                  {mobileSportsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {mobileSportsOpen && (
                <div className="mt-4 pt-4 border-t border-gray-800/80">
                  {renderSportsContent()}
                </div>
              )}
            </div>

            {/* DESKTOP FULL SIDEBAR */}
            <div className="hidden lg:block space-y-6">
              {renderSportsContent()}
            </div>
          </aside>
        </section>

        {/* ====================================================
            TRANSMISIÓN EN VIVO: STREAMING TV & RADIO DEL LITORAL
           ==================================================== */}
        <section id="streaming" className="space-y-4 pt-6 border-t border-gray-800/60 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping shrink-0" />
              <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-red-500 flex items-center gap-1.5">
                  TRANSMISIÓN CONTINUA • SEÑAL OFICIAL 2026
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mt-0.5"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Nexativa TV & Radio <span className="text-[#e5b242] italic">En Vivo</span>
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold tracking-wider uppercase animate-pulse">
                ● SEÑAL AL AIRE
              </span>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-white/10 overflow-hidden bg-slate-950 shadow-2xl p-2 sm:p-4">
            <VideoSection />
          </div>
        </section>

        {/* ====================================================
            SECTION 2: GRAN PANEL DE PRENSA & NOTICIAS (NEWSTABS)
           ==================================================== */}
        <section id="noticias-panel" className="space-y-4 pt-4 border-t border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-amber-500">
                REDACCIÓN DIGITAL DE NEXATIVA
              </span>
              <h2
                className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mt-0.5"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Prensa & Archivo Noticioso
              </h2>
            </div>
            <Link
              href="/news"
              className="text-xs font-bold text-[#e5b242] hover:underline flex items-center gap-1"
            >
              Ver Todas las Noticias &rarr;
            </Link>
          </div>

          <div className="w-full rounded-2xl border border-white/10 overflow-hidden bg-[#0f141b] shadow-xl">
            <NewsTabs initialArticles={initialArticles} initialTab="Nacional" />
          </div>
        </section>

        {/* ====================================================
            SECTION 3: PORTAL DE EMPLEOS & OFICIOS REGIONAL
           ==================================================== */}
        <section id="empleos" className="space-y-6 pt-4 border-t border-gray-800/60">
          <div className="w-full bg-gradient-to-r from-slate-950 via-emerald-950/40 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                <Briefcase className="w-3.5 h-3.5" />
                <span>RED DE EMPLEO & OFICIOS CALIFICADOS DE ITUZAINGÓ</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Bolsa Laboral & Prestadores de <span className="text-emerald-400 underline">Oficios</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Conectamos a profesionales, técnicos, trabajadores de oficios y comerciantes con vecinos y empresas del
                Litoral. Perfiles verificados, calificaciones comunitarias y contacto directo sin comisiones abusivas.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Carga de CV digital
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Búsquedas laborales activas
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sistema de reseñas comunitarias
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
              <Link
                href="/empleos"
                className="px-5 py-3 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 text-center flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" /> Buscar Trabajo
              </Link>
              <Link
                href="/empleos"
                className="px-5 py-3 rounded-2xl font-black bg-slate-900 border border-emerald-500/50 hover:bg-slate-800 text-emerald-300 text-xs sm:text-sm transition-all text-center flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" /> Publicar Búsqueda
              </Link>
              <Link
                href="/prestadores"
                className="px-5 py-3 rounded-2xl font-black bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-900 text-emerald-200 text-xs sm:text-sm transition-all text-center flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02]"
                title="Accedé a tu panel móvil para activar disponibilidad, subir CV y compartir tu QR"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Mi Perfil (Autogestión)</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 4: REAL ESTATE & VERIFIED RENTALS (ITUZAINGÓ)
           ==================================================== */}
        <section id="inmuebles" className="space-y-6 pt-4 border-t border-gray-800/60">
          <div
            className={`rounded-2xl border p-6 sm:p-8 ${
              darkMode ? 'bg-gradient-to-r from-[#0d131a] to-[#121a24] border-[#1e2633]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Sistema Notarial con Calendario 100% Verificado
                  </span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-serif font-bold tracking-tight"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Alquileres Temporarios & Inmuebles en Ituzaingó
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
                  Propiedades auditadas con contrato de fianza inmediato. Prohibidas las superposiciones de reservas
                  mediante firma digital respaldada por Nexativa Trust Engine.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  href="/guia/inmuebles"
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
                    darkMode
                      ? 'border-gray-700 bg-gray-900/60 hover:border-amber-400 text-gray-200'
                      : 'border-slate-300 bg-slate-100 hover:border-slate-400 text-slate-800 shadow-sm'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Ver Disponibilidad
                </Link>
                <Link
                  href="/guia/inmuebles/registro"
                  className="px-3.5 py-2 text-xs font-black rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 transition shadow-sm flex items-center gap-1"
                >
                  <Building className="w-3.5 h-3.5" /> Adherir Propiedad
                </Link>
                <Link
                  href="/guia/inmuebles/propietario"
                  className="px-3.5 py-2 text-xs font-black rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm flex items-center gap-1.5 hover:scale-[1.02]"
                  title="Panel de Propietario para autogestionar tarifas, fotos y reservas desde el móvil"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Panel Propietario (Autogestión)</span>
                </Link>
                <Link
                  href="/guia/inmuebles/inquilino"
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition ${
                    darkMode
                      ? 'border-gray-800 text-gray-400 hover:text-white'
                      : 'border-slate-300 text-slate-700 hover:text-black bg-white shadow-sm'
                  }`}
                  title="Consultá tus reservas y contratos"
                >
                  Inquilino
                </Link>
              </div>
            </div>

            {/* Quick Search Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0a0e14]/60 p-3 rounded-xl border border-gray-800/80 mb-6 text-xs">
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#121822] border border-gray-800">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-gray-300 truncate">Todas las zonas de Ituzaingó</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#121822] border border-gray-800">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-gray-300 truncate">Temporada 2026 (5 Noches)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#121822] border border-gray-800">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-gray-300 truncate">4 Huéspedes • Familiar</span>
              </div>
              <Link
                href="/guia/inmuebles"
                className="w-full bg-[#e5b242] hover:bg-amber-400 text-black font-bold py-2 rounded transition flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Filtrar Calendarios
              </Link>
            </div>

            {/* Responsive Showcase: Mobile Swipe Carousel / Desktop Grid */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              {resolvedProperties.map((prop) => (
                <div
                  key={prop.id}
                  className={`w-[84vw] max-w-[320px] shrink-0 snap-center sm:w-auto sm:max-w-none rounded-xl border overflow-hidden transition group hover:-translate-y-1 ${
                    darkMode ? 'bg-[#0b1016] border-[#1e2633]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Link href="/guia/inmuebles" className="block relative h-44 overflow-hidden">
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 text-emerald-400 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" /> NOTARIAL
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-amber-400 text-[10px] font-bold backdrop-blur-sm">
                      ★ {prop.rating}
                    </div>
                  </Link>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[11px] font-mono uppercase text-gray-400">{prop.location}</p>
                      <h4 className="font-serif font-bold text-sm leading-snug line-clamp-2 mt-0.5">
                        <Link href="/guia/inmuebles" className="hover:text-amber-400 transition-colors">
                          {prop.title}
                        </Link>
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1 border-t border-gray-800/40">
                      <span>{prop.bedrooms} Dorm.</span>
                      <span>•</span>
                      <span>{prop.bathrooms} Baños</span>
                      <span>•</span>
                      <span>Hasta {prop.capacity} p.</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                      <div>
                        <span className="text-xs text-gray-400">Tarifa: </span>
                        <span className="font-bold text-base text-amber-400">USD ${prop.pricePerNightUSD}</span>
                        <span className="text-[10px] text-gray-400"> /noche</span>
                      </div>
                      <Link
                        href="/guia/inmuebles"
                        className="text-xs font-bold text-[#e5b242] hover:underline flex items-center"
                      >
                        Ver Fechas <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile swipe helper text */}
            <div className="sm:hidden flex items-center justify-between text-[11px] text-gray-400 pt-2 px-1">
              <span>← Deslizá para ver más alojamientos</span>
              <Link href="/guia/inmuebles" className="text-amber-400 font-bold hover:underline">
                Ver todos &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 5: COMMERCIAL DIRECTORY & QUALIFIED PROVIDERS
           ==================================================== */}
        <section id="guia" className="space-y-6 pt-4 border-t border-gray-800/60">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-amber-500">
                ECOSISTEMA DE COMERCIOS & DIRECTIVAS REGIONALES
              </span>
              <h2
                className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mt-1"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Guía Comercial & Proveedores Calificados
              </h2>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <Link
                href="/guia"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-black shrink-0 hover:bg-cyan-400 transition"
              >
                Ver Toda la Guía &rarr;
              </Link>
              {['Todos', 'Arquitectura', 'Bienestar & Estética', 'Joyería de Autor', 'Editorial'].map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-amber-500 text-black font-bold'
                      : darkMode
                      ? 'bg-[#121822] text-gray-300 hover:bg-[#1a2332]'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Responsive Showcase: Mobile Swipe Carousel / Desktop Grid */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {(activeCategory === 'Todos'
              ? combinedProviders
              : combinedProviders.filter((p) => {
                  const cat = (p?.category || '').toLowerCase();
                  const name = (p?.name || '').toLowerCase();
                  const target = (activeCategory || '').toLowerCase();
                  return cat.includes(target) || name.includes(target);
                })
            ).map((prov) => (
              <div
                key={prov.id}
                className={`w-[78vw] max-w-[290px] shrink-0 snap-center sm:w-auto sm:max-w-none rounded-xl border p-5 flex flex-col justify-between transition hover:-translate-y-1 ${
                  darkMode ? 'bg-[#0f141b] border-[#1e2633]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {prov.category}
                    </span>
                    {prov.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <h4 className="font-serif font-bold text-base mb-2 leading-snug">
                    <Link
                      href={prov.phone ? `https://wa.me/${prov.phone}` : '/guia'}
                      target={prov.phone ? '_blank' : '_self'}
                      className="hover:text-amber-400 transition-colors"
                    >
                      {prov.name}
                    </Link>
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{prov.description}</p>
                </div>
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200">{prov.contactText}</span>
                  <Link
                    href={prov.phone ? `https://wa.me/${prov.phone}` : '/guia'}
                    target={prov.phone ? '_blank' : '_self'}
                    className="p-1.5 rounded bg-[#161f2c] hover:bg-amber-500 hover:text-black transition"
                    title="Contactar por WhatsApp"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile swipe helper */}
          <div className="sm:hidden flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span>← Deslizá para descubrir más comercios</span>
            <Link href="/guia" className="text-cyan-400 font-bold hover:underline">
              Ver Guía ({combinedProviders.length}) &rarr;
            </Link>
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href="/guia/registro"
              className="px-6 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/30 font-bold text-xs uppercase tracking-wider transition"
            >
              ➕ ¿Tenés un comercio o servicio? Sumate a la Guía Oficial
            </Link>
          </div>
        </section>

        {/* ====================================================
            SECTION 7: TIENDA & PRODUCTOS LOCALES
           ==================================================== */}
        {products.length > 0 && (
          <section id="tienda" className="space-y-4 pt-4 border-t border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-amber-500">
                  MARKETPLACE REGIONAL
                </span>
                <h3 className="text-white text-xl sm:text-2xl font-bold mt-0.5">Nuestros Productos</h3>
              </div>
              <Link
                href="/store"
                className="text-[var(--color-brand-accent)] hover:text-white transition-colors font-bold text-xs uppercase tracking-wider flex items-center gap-1"
              >
                Ver Tienda Completa &rarr;
              </Link>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {products.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="w-[68vw] max-w-[250px] shrink-0 snap-center sm:w-auto sm:max-w-none rounded-xl border border-white/10 bg-[#0f141b] p-3 flex flex-col justify-between hover:border-amber-500/40 transition"
                >
                  {p.image_url && (
                    <div className="h-32 rounded-lg overflow-hidden mb-2">
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h4 className="font-bold text-sm text-gray-100 line-clamp-1">{p?.title || 'Producto'}</h4>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">{p?.description || ''}</p>
                  <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-sm">${Number(p?.price || 0).toFixed(2)}</span>
                    <Link
                      href={`/product/${p?.id || '#'}`}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px]"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile swipe helper text */}
            <div className="sm:hidden flex items-center justify-between text-[11px] text-gray-400 px-1">
              <span>← Deslizá para ver más productos</span>
              <Link href="/store" className="text-amber-400 font-bold hover:underline">
                Ir a la Tienda &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* ====================================================
            SECTION 8: VIP SUBSCRIPTION TIERS (MEMBRESIAS)
           ==================================================== */}
        <section id="membresias" className="space-y-8 pt-6 border-t border-gray-800/60">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              ACCESO IRRESTRICTO AL PERIODISMO RIGUROSO
            </span>
            <h2
              className="text-3xl sm:text-4xl font-serif font-bold tracking-tight"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Planes de Suscripción Nexativa
            </h2>
            <p className="text-sm text-gray-400">
              Elegí tu nivel de membresía para acceder a análisis macroeconómicos confidenciales, descuentos notariales y
              coberturas en tiempo real sin pauta invasiva.
            </p>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 no-scrollbar -mx-2 px-2 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 items-stretch">
            {MOCK_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`w-[85vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none rounded-2xl border p-6 sm:p-8 flex flex-col justify-between relative transition duration-300 ${
                  plan.highlighted
                    ? 'border-[#e5b242] bg-gradient-to-b from-[#18212e] to-[#0f141b] shadow-xl md:-translate-y-3'
                    : darkMode
                    ? 'border-[#1e2633] bg-[#0f141b]'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-serif font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                      ${plan.priceARS.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-gray-400 font-sans">{plan.period} ARS</span>
                  </div>
                  <ul className="space-y-3 text-xs text-gray-300 my-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plan.highlighted ? 'text-[#e5b242]' : 'text-gray-500'
                          }`}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={handleOpenNora}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 shadow-lg'
                      : darkMode
                      ? 'bg-[#182230] text-gray-200 hover:bg-[#202c3e] border border-gray-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>

          <div className="md:hidden text-center text-[11px] text-gray-400">
            ← Deslizá horizontalmente para comparar planes de membresía →
          </div>
        </section>
      </main>


      {/* ====================================================
          FOOTER INSTITUCIONAL
         ==================================================== */}
      <footer
        className={`border-t text-xs mt-20 transition-colors ${
          darkMode ? 'bg-[#080c12] border-[#1a2332] text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Editorial Brand Info */}
            <div className="space-y-3">
              <span className="text-xl font-serif font-black tracking-wider text-white">
                NEXATIVA <span className="text-[#e5b242] italic">NEWS</span>
              </span>
              <p className="text-xs leading-relaxed text-gray-400">
                Periodismo independiente, análisis financiero de alta fidelidad, portal de empleo y oficios, centro de
                transmisiones deportivas y la red de alquileres garantizados de la región.
              </p>
              <div className="text-[11px] text-gray-500">
                <span>ISSN 2953-481X</span> • <span>DNDA En trámite</span>
              </div>
            </div>

            {/* Column 1: Secciones */}
            <div className="space-y-2">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Portales Principales</h5>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/" className="hover:text-amber-400">
                    Portada Global
                  </Link>
                </li>
                <li>
                  <Link href="/news" className="hover:text-amber-400">
                    Prensa & Noticias
                  </Link>
                </li>
                <li>
                  <Link href="/empleos" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                    💼 Portal de Empleos & Oficios
                  </Link>
                </li>
                <li>
                  <Link href="/guia/inmuebles" className="text-rose-400 hover:text-rose-300 font-semibold">
                    🏠 Inmuebles Verificados Ituzaingó
                  </Link>
                </li>
                <li>
                  <Link href="/guia" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                    📖 Guía Comercial de Proveedores
                  </Link>
                </li>
                <li>
                  <Link href="/cultura" className="hover:text-amber-400">
                    🎨 Espacio Cultural
                  </Link>
                </li>
                <li>
                  <Link href="/clasificados" className="hover:text-amber-400">
                    🏷️ Clasificados
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Servicios & Alianzas */}
            <div className="space-y-2">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Servicios Notariales</h5>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/guia/inmuebles" className="hover:text-amber-400">
                    Garantía de Fechas & Inquilino
                  </Link>
                </li>
                <li>
                  <Link href="/guia/inmuebles/registro" className="hover:text-amber-400">
                    Publicar Inmueble con Verificación
                  </Link>
                </li>
                <li>
                  <Link href="/guia/registro" className="hover:text-amber-400">
                    Sumar Comercio a la Guía
                  </Link>
                </li>
                <li>
                  <Link href="/empleos" className="hover:text-amber-400">
                    Publicar Aviso de Empleo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contacto & Redacción */}
            <div className="space-y-2">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Mesa de Redacción</h5>
              <p className="text-gray-400 leading-relaxed">
                Edificio Corporativo Ituzaingó, Planta Editorial III. Corrientes / Buenos Aires, Argentina.
              </p>
              <div className="pt-2">
                <span className="font-semibold text-gray-300 block">Canal Seguro de Denuncias:</span>
                <a href="mailto:redaccion@nexativa.com.ar" className="text-amber-400 hover:underline">
                  redaccion@nexativa.com.ar
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
            <p>© 2024–2026 Nexativa Multimedia Group S.A. Todos los derechos reservados.</p>
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Desarrollado por <strong className="text-amber-400 font-semibold">Nexora One</strong>
              </span>
              <span className="hidden sm:inline text-gray-700">•</span>
              <Link href="/legal-and-ip/terminos" className="hover:underline">
                Términos del Servicio
              </Link>
              <Link href="/legal-and-ip/politica-privacidad" className="hover:underline">
                Políticas de Privacidad
              </Link>
              <Link href="/legal-and-ip" className="hover:underline">
                Código Deontológico
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
