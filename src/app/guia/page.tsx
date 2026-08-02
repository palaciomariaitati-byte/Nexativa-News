import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Building2 } from "lucide-react";
import supabaseAdmin from "@/lib/supabase/admin";
import GuiaClient, { DirectoryItem } from "@/components/Guia/GuiaClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Páginas Amarillas 2.0: Guía Comercial & Servicios de Cercanía | Nexativa News",
  description: "Directorio comercial inteligente geolocalizado. Encontrá profesionales, comercios y prestadores de servicios cerca tuyo con asistencia de NORA.",
  openGraph: {
    title: "Páginas Amarillas 2.0 | Nexativa News",
    description: "Guía Comercial Inteligente con geolocalización y contacto directo por WhatsApp.",
    url: "https://nexativanews.com.ar/guia",
    siteName: "Nexativa News",
    type: "website",
  },
};

// Curated default businesses from real local sectors
const FALLBACK_BUSINESSES: DirectoryItem[] = [
  {
    id: "1",
    name: "Estudio de Arquitectura & Construcción",
    category: "Arquitectura",
    address: "Av. San Martín 1420",
    city: "Ituzaingó",
    whatsapp: "5493786611250",
    phone: "3786611250",
    description: "Proyectos residenciales, loteos y dirección técnica de obra. Atención personalizada.",
    tier: "ORO",
    isVerified: true,
    distance: "A 350 metros",
  },
  {
    id: "2",
    name: "Centro de Estética & Cosmetología",
    category: "Estética",
    address: "Calle Buenos Aires 850",
    city: "Ituzaingó",
    whatsapp: "5493786611250",
    phone: "3786611250",
    description: "Tratamientos faciales, corporales, cosmetología y relajación. Turnos por WhatsApp.",
    tier: "PLATA",
    isVerified: true,
    distance: "A 500 metros",
  },
  {
    id: "3",
    name: "Joyería & Relojería Registrada",
    category: "Joyería",
    address: "Peatonal Centenario 430",
    city: "Ituzaingó",
    whatsapp: "5493786611250",
    phone: "3786611250",
    description: "Piezas exclusivas en oro, plata, alhajas registradas y servicio técnico de precisión.",
    tier: "ORO",
    isVerified: true,
    distance: "A 800 metros",
  },
  {
    id: "4",
    name: "Soluciones Corporativas & Asesoría B2B",
    category: "Soluciones Corporativas",
    address: "Belgrano 1120",
    city: "Ituzaingó",
    whatsapp: "5493786611250",
    phone: "3786611250",
    description: "Consultoría contable, legal, sistemas de facturación y estrategias digitales para PYMEs.",
    tier: "ORO",
    isVerified: true,
    distance: "A 1.2 km",
  },
  {
    id: "5",
    name: "Gastronomía & Sabores Regionales",
    category: "Gastronomía",
    address: "Costanera Norte 210",
    city: "Ituzaingó",
    whatsapp: "5493786611250",
    phone: "3786611250",
    description: "Pescados de río, cocina regional, envíos a domicilio y reservas para eventos.",
    tier: "PLATA",
    isVerified: true,
    distance: "A 1.5 km",
  },
];

async function getActiveDirectoryBusinesses(): Promise<DirectoryItem[]> {
  try {
    const { data: directoryData, error: dirError } = await supabaseAdmin
      .from("directory_businesses")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (!dirError && directoryData && directoryData.length > 0) {
      return directoryData.map((b: any) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        address: b.address || "Ituzaingó, Corrientes",
        city: b.city || "Ituzaingó",
        whatsapp: b.whatsapp || b.phone || "5493786611250",
        phone: b.phone || "3786611250",
        description: b.description || `Comercio adherido en el rubro ${b.category}.`,
        tier: b.tier || "BRONCE",
        isVerified: b.is_verified ?? true,
        distance: "Cerca de ti",
      }));
    }

    const { data: sponsorsData } = await supabaseAdmin.from("sponsors").select("*").limit(10);
    if (sponsorsData && sponsorsData.length > 0) {
      return sponsorsData.map((s: any, idx: number) => ({
        id: s.id || `sponsor-${idx}`,
        name: s.name,
        category: s.category || "Servicios Locales",
        address: s.address || "Ituzaingó, Corrientes",
        city: "Ituzaingó",
        whatsapp: s.whatsapp || "5493786611250",
        phone: s.phone || "3786611250",
        description: s.description || s.slogan || `Comercio auspiciante oficial en ${s.category || 'Ituzaingó'}.`,
        tier: idx % 2 === 0 ? "ORO" : "PLATA",
        isVerified: true,
        distance: `A ${(idx + 1) * 350} metros`,
      }));
    }
  } catch (err) {
    console.warn("[Guía] Usando fallback para la guía comercial:", err);
  }

  return FALLBACK_BUSINESSES;
}

export default async function GuiaComercialPage() {
  const businesses = await getActiveDirectoryBusinesses();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      
      {/* Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent font-black text-xl tracking-tight">
              NEXATIVA
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full">
              Páginas Amarillas 2.0
            </span>
          </Link>

          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            <Building2 className="w-4 h-4" />
            <span>Sumar mi Comercio</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DIRECTORIO COMERCIAL GEOLOCALIZADO & IA</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
          Páginas Amarillas{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            Digitales 2.0
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto mb-8 font-light">
          Encontrá los mejores profesionales, comercios y servicios ordenados por distancia cerca tuyo, con verificación de reputación y WhatsApp directo.
        </p>
      </section>

      {/* Main Interactive Client Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <GuiaClient initialBusinesses={businesses} />

        {/* Bottom Banner: Sumar mi Comercio */}
        <section className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              ¿Querés que tu negocio aparezca destacado en las Páginas Amarillas 2.0?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Posicionate en los primeros lugares de búsqueda por geolocalización y sumá asistencia inteligente por WhatsApp con los planes Bronce, Plata y Oro.
            </p>
          </div>

          <Link
            href="/checkout"
            className="w-full md:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm transition-transform active:scale-95 shadow-xl shadow-cyan-500/20"
          >
            <span>Publicar mi Negocio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </main>
    </div>
  );
}
