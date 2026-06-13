/* src/app/page.tsx */
export const dynamic = 'force-dynamic';
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { getPublishedArticles, getProducts, getSponsors } from "@/lib/supabase/serverQueries";
import type { Product, Sponsor } from "@/lib/types";
import NewsTabs from "@/components/NewsTabs/NewsTabs";
import VideoSection from "@/components/VideoSection";
import SubscriptionTiers from "@/components/SubscriptionTiers";
import SponsorsMarquee from "@/components/SponsorsMarquee";
import TopBusBar from "@/components/TopBusBar";
import SponsorTabs from "@/components/SponsorTabs";
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
            className="w-full h-auto object-contain rounded-xl shadow-2xl border border-white/5 pointer-events-none"
            draggable={false}
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
        <div className="overflow-hidden rounded-xl h-40 w-full mb-3 relative">
          <Image src={product.image_url} alt={product.title} width={200} height={200} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none" draggable={false} />
        </div>
      )}
      <h5 className="mt-2 font-bold text-gray-100 text-lg line-clamp-1">{product.title}</h5>
      {product.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>}
      <div className="mt-auto pt-4 flex items-center justify-between">
        <p className="text-[var(--color-brand-accent)] font-bold text-xl">${Number(product.price).toFixed(2)}</p>
        {product.buy_url && (
          <a href={product.buy_url} target="_blank" rel="noopener noreferrer" className="bg-[var(--color-brand-accent)] text-black font-bold px-4 py-2 rounded-lg hover:bg-white transition-colors relative z-10">
            Comprar
          </a>
        )}
      </div>
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
  const [initialArticles, products, sponsors] = await Promise.all([
    getPublishedArticles("nacional"),
    getProducts(),
    getSponsors(),
  ]);

  // Sticky video logic moved to <StickyVideo /> client component

  return (
    <main className="w-full flex flex-col items-center pb-24 overflow-x-hidden relative">
      {/* 1️⃣ Banner principal */}
      <div className="w-full">
        <Banner />
      </div>

      {/* 🚌 Barra Modo Bus (Atajos y Redes Sociales) */}
      <TopBusBar />

      {/* 🌟 Cinta Animada de Patrocinadores */}
      {sponsors.length > 0 && (
        <div className="w-full mt-6">
          <SponsorsMarquee sponsors={sponsors} />
        </div>
      )}

      <div className="w-full max-w-7xl px-2 sm:px-4 lg:px-8 mt-8 sm:mt-12 space-y-10 sm:space-y-16 relative">
        {/* 2️⃣ Streaming (Prominent at top) */}
        <section className="w-full relative">
          <h3 className="text-white text-xl sm:text-2xl font-bold mb-4 border-b border-[var(--color-brand-accent)] pb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span> En Vivo
          </h3>
          <div className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl border border-white/10 relative">
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
          <div className="overflow-hidden w-full relative">
            {products.length > 0 ? (
              <div 
                className="flex w-max animate-marquee-shop hover:[animation-play-state:paused] gap-4 pb-4"
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
                {/* Duplicado para crear el efecto infinito sin cortes */}
                {products.map((p) => (
                  <ProductCard key={p.id + "-clone"} product={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 w-full text-center">No hay productos disponibles.</p>
            )}
          </div>
        </section>
      </div>

      {/* 5️⃣ Sponsors / Adhered Businesses (Tabs) */}
      <div className="w-full max-w-[1200px] px-2 sm:px-4 lg:px-8 mt-10 sm:mt-16" id="sponsors-section-wrapper">
        <SponsorTabs sponsors={sponsors} />
      </div>

      <div className="w-full mt-16">
        <SubscriptionTiers />
      </div>
    </main>
  );
}
