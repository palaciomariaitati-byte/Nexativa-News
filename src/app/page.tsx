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
];

// -----------------------------------------------------------------
// Helper components (Server Components — zero client JS)
// -----------------------------------------------------------------
function Banner() {
  return (
    <section className="w-full">
      {banners.map((b) => (
        <Link key={b.id} href={b.link}>
          <Image
            src={b.image}
            alt={b.alt}
            width={1200}
            height={300}
            className="w-full h-auto rounded-md object-cover"
          />
        </Link>
      ))}
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="glass-panel p-4 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all duration-300 group">
      {product.image_url && (
        <div className="overflow-hidden rounded-xl h-40 w-full mb-3">
          <Image src={product.image_url} alt={product.title} width={200} height={200} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}
      <h5 className="mt-2 font-bold text-gray-100 text-lg">{product.title}</h5>
      {product.description && <p className="text-sm text-gray-400 mt-1">{product.description}</p>}
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
  return (
    <div className="glass-panel p-3 space-y-2 hover:-translate-y-1 transition-transform group">
      <h4 className="font-bold text-gray-100 group-hover:text-[var(--color-brand-accent)] transition-colors">{sponsor.name}</h4>
      <div className="flex flex-wrap gap-2 mt-2">
        {sponsor.website_url && (
          <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-[var(--color-brand-accent)] hover:text-black text-white px-3 py-1 rounded-full text-xs transition-colors">
            Sitio Web
          </a>
        )}
        {sponsor.instagram_url && (
          <a href={sponsor.instagram_url} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-80 text-white px-3 py-1 rounded-full text-xs transition-opacity">
            Instagram
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
  const [initialArticles, products, sponsors, activeStream] = await Promise.all([
    getPublishedArticles("nacional"),
    getProducts(),
    getSponsors(),
    getActiveStream(),
  ]);

  // Sticky video logic moved to <StickyVideo /> client component
  return (
    <main className="w-full flex flex-col items-center">
      {/* 1️⃣ Banner principal (Full Width) */}
      <div className="w-full max-w-[1920px]">
        <Banner />
      </div>

      {/* 🌟 Cinta Animada de Patrocinadores (Pro) */}
      <div className="w-full">
        <SponsorsMarquee sponsors={sponsors} />
      </div>

      <div className="w-full max-w-7xl px-4 lg:px-8 mt-8 space-y-16">
        {/* 2️⃣ Streaming (Prominent at top) */}
        <section className="w-full">
          <h3 className="text-white text-2xl font-bold mb-4 border-b border-[var(--color-brand-accent)] pb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span> En Vivo
          </h3>
          <div className="w-full max-w-4xl mx-auto">
            <VideoSection />
          </div>
        </section>

        {/* 3️⃣ Prensa (Horizontal Full Width) */}
        <section className="w-full">
          <h3 className="text-white text-2xl font-bold mb-4 border-b border-white/10 pb-2">Últimas Noticias</h3>
          <Suspense fallback={<NewsTabsSkeleton />}>
            <div className="w-full">
              <NewsTabs
                initialArticles={initialArticles}
                initialTab="Nacional"
              />
            </div>
          </Suspense>
        </section>

        {/* 4️⃣ Tienda (Grid Full Width) */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="text-white text-2xl font-bold">Nuestros Productos</h3>
            <Link href="/store" className="text-[var(--color-brand-accent)] hover:text-white transition-colors font-bold text-sm">Ver Todo &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No hay productos disponibles.</p>
            )}
          </div>
        </section>
      </div>

      {/* 5️⃣ Sponsors / Adhered Businesses */}
      {sponsors.length > 0 && (
        <div className="w-full max-w-7xl px-4 lg:px-8 mt-16">
          <section className="w-full">
            <h3 className="text-white text-2xl font-bold mb-6 text-center">Nuestros Comercios Adheridos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="w-full mt-16">
        <SubscriptionTiers />
      </div>
    </main>
  );
}
