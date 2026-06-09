/* src/app/page.tsx */

import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { getPublishedArticles, getProducts, getSponsors, getActiveStream } from "@/lib/supabase/serverQueries";
import type { Article, Product, Sponsor, StreamVideo } from "@/lib/types";
import NewsTabs from "@/components/NewsTabs/NewsTabs";
import MarqueeHeader from "@/components/MarqueeHeader";
import VideoSection from "@/components/VideoSection";
import SubscriptionTiers from "@/components/SubscriptionTiers";
import StickyVideo from "@/components/StickyVideo";
import SponsorsMarquee from "@/components/SponsorsMarquee";
import TopBusBar from "@/components/TopBusBar";
// -----------------------------------------------------------------
// Mock data (static) — kept for non-news columns
// -----------------------------------------------------------------
const banners = [
  {
    id: 1,
    image: "/banner-nexativa.jpg",
    alt: "Nexativa – Lo nuestro para el mundo",
    link: "#",
  },
];// -----------------------------------------------------------------
// Helper components (Server Components — zero client JS)
// -----------------------------------------------------------------
function Banner() {
  return (
    <section className="w-full px-2 sm:px-4 lg:px-8 mt-4">
      {banners.map((b) => (
        <Link key={b.id} href={b.link} className="block w-full max-w-[1400px] mx-auto">
          <Image
            src={b.image}
            alt={b.alt}
            width={1920}
            height={600}
            className="w-full h-auto object-contain rounded-xl shadow-2xl border border-white/5"
            priority
          />
        </Link>
      ))}
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="glass-panel p-3 sm:p-4 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all duration-300 group min-w-[200px] sm:min-w-0 flex-shrink-0 snap-center">
      {product.image_url && (
        <div className="overflow-hidden rounded-xl h-40 w-full mb-3">
          <Image src={product.image_url} alt={product.title} width={200} height={200} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}
      <h5 className="mt-2 font-bold text-gray-100 text-lg line-clamp-1">{product.title}</h5>
      {product.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>}
      <div className="mt-auto pt-4 flex items-center justify-between">
        <p className="text-[var(--color-brand-accent)] font-bold text-xl">${Number(product.price).toFixed(2)}</p>
        {product.buy_url && (
          <a href={product.buy_url} target="_blank" rel="noopener noreferrer" className="bg-[var(--color-brand-accent)] text-black font-bold px-4 py-2 rounded-lg hover:bg-white transition-colors">
            Comprar
          </a>
        )}
      </div>
    </div>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  // Use the tracking API as a bridge for links
  const getTrackingUrl = (url: string, type: string) => {
    return `/api/track-click?sponsor_id=${sponsor.id}&type=${type}&url=${encodeURIComponent(url)}`;
  };

  const cardContent = (
    <>
      {sponsor.banner_url ? (
        <img 
          src={sponsor.banner_url} 
          alt={sponsor.name} 
          className="w-full h-32 object-cover rounded-md mb-2 shadow-md"
        />
      ) : sponsor.logo_url ? (
        <img 
          src={sponsor.logo_url} 
          alt={sponsor.name} 
          className="w-full h-24 object-contain rounded-md mb-2 bg-white/5 shadow-md p-2"
        />
      ) : null}
      
      <h4 className="font-bold text-gray-100 group-hover:text-[var(--color-brand-accent)] transition-colors text-center w-full truncate">
        {sponsor.name}
      </h4>
      
      {/* Botones de redes (solo visibles en PC para evitar clics accidentales al deslizar en el móvil) */}
      <div className="hidden sm:flex flex-wrap justify-center gap-2 mt-2 w-full">
        {sponsor.website_url && (
          <a href={getTrackingUrl(sponsor.website_url, 'website')} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-[var(--color-brand-accent)] hover:text-black text-white px-3 py-1 rounded-full text-xs transition-colors">
            Sitio Web
          </a>
        )}
        {sponsor.instagram_url && (
          <a href={getTrackingUrl(sponsor.instagram_url, 'instagram')} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-80 text-white px-3 py-1 rounded-full text-xs transition-opacity">
            Instagram
          </a>
        )}
      </div>
    </>
  );

  // En móvil, hacemos que toda la tarjeta sea clickeable hacia su sitio principal,
  // para que siga siendo funcional sin necesidad de los botones chicos.
  const mainLink = sponsor.website_url || sponsor.instagram_url;

  if (mainLink) {
    return (
      <a href={getTrackingUrl(mainLink, 'card_click')} target="_blank" rel="noopener noreferrer" className="glass-panel p-3 space-y-2 hover:-translate-y-1 transition-transform group flex flex-col items-center min-w-[160px] sm:min-w-0 flex-shrink-0 snap-center border border-white/5 cursor-pointer">
        {cardContent}
      </a>
    );
  }

  return (
    <div className="glass-panel p-3 space-y-2 hover:-translate-y-1 transition-transform group flex flex-col items-center min-w-[160px] sm:min-w-0 flex-shrink-0 snap-center border border-white/5">
      {cardContent}
    </div>
  );
}

// Skeleton for the NewsTabs while loading on the server
function NewsTabsSkeleton() {
  return (
    <div className="glass-panel overflow-hidden animate-pulse">
      <div className="flex border-b border-white/10 bg-black/20">
        {["Nacional", "Internacional", "Local"].map((label) => (
          <div key={label} className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-px bg-white/10 mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// Main page (Server Component — async, fetches data on the server)
// -----------------------------------------------------------------
export default async function HomePage() {
  // Fetch everything in parallel on the server
  const [initialArticles, products, sponsors, activeStream] = await Promise.all([
    getPublishedArticles("nacional"),
    getProducts(),
    getSponsors(),
    getActiveStream(),
  ]);

  // Sticky video logic moved to <StickyVideo /> client component
  return (
    <main className="w-full flex flex-col items-center pb-24 overflow-x-hidden">
      {/* 1️⃣ Banner principal */}
      <div className="w-full">
        <Banner />
      </div>

      {/* 🚌 Barra Modo Bus (Atajos y Redes Sociales) */}
      <TopBusBar />

      {/* 🌟 Cinta Animada de Patrocinadores (Pro) */}
      <div className="w-full mt-6">
        <SponsorsMarquee sponsors={sponsors} />
      </div>

      <div className="w-full max-w-7xl px-2 sm:px-4 lg:px-8 mt-8 sm:mt-12 space-y-10 sm:space-y-16">
        {/* 2️⃣ Streaming (Prominent at top) */}
        <section className="w-full">
          <h3 className="text-white text-xl sm:text-2xl font-bold mb-4 border-b border-[var(--color-brand-accent)] pb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span> En Vivo
          </h3>
          <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <VideoSection />
          </div>
        </section>

        {/* 3️⃣ Prensa (Horizontal Full Width) */}
        <section className="w-full">
          <h3 className="text-white text-xl sm:text-2xl font-bold mb-4 border-b border-white/10 pb-2">Últimas Noticias</h3>
          <Suspense fallback={<NewsTabsSkeleton />}>
            <div className="w-full max-w-[1200px] mx-auto">
              <NewsTabs
                initialArticles={initialArticles}
                initialTab="Nacional"
              />
            </div>
          </Suspense>
        </section>

        {/* 4️⃣ Tienda (Grid o Carrusel Horizontal Móvil) */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="text-white text-xl sm:text-2xl font-bold">Nuestros Productos</h3>
            <Link href="/store" className="text-[var(--color-brand-accent)] hover:text-white transition-colors font-bold text-sm">Ver Todo &rarr;</Link>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory hide-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {products.length > 0 ? (
              products.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <p className="text-sm text-gray-500 min-w-full">No hay productos disponibles.</p>
            )}
          </div>
        </section>
      </div>

      {/* 5️⃣ Sponsors / Adhered Businesses (Grid o Carrusel) */}
      {sponsors.length > 0 && (
        <div className="w-full max-w-7xl px-2 sm:px-4 lg:px-8 mt-10 sm:mt-16 space-y-8 sm:space-y-12">
          {["Hotelería", "Turismo", "Gastronomía", "Servicios", "Otros"].map((cat) => {
            const catSponsors = sponsors.filter((s) => (s.category || 'Servicios') === cat);
            if (catSponsors.length === 0) return null;
            return (
              <section key={cat} id={`cat-${cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className="w-full scroll-mt-24">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <h3 className="text-white text-xl sm:text-2xl font-bold">{cat}</h3>
                </div>
                <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory hide-scrollbar sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
                  {catSponsors.map((sponsor) => (
                    <SponsorCard key={sponsor.id} sponsor={sponsor} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="w-full mt-16">
        <SubscriptionTiers />
      </div>
    </main>
  );
}
