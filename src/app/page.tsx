/* src/app/page.tsx */

import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Article, Product, Sponsor, StreamVideo } from "@/lib/types";
import NewsTabs from "@/components/NewsTabs/NewsTabs";
import MarqueeHeader from "@/components/MarqueeHeader";

import VideoSection from "@/components/VideoSection";
import SubscriptionTiers from "@/components/SubscriptionTiers"
import StickyVideo from "@/components/StickyVideo";
// -----------------------------------------------------------------
// Server-side data fetching (runs once per request, no client JS)
// -----------------------------------------------------------------
async function getPublishedArticles(category: string): Promise<Article[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, excerpt, image_url, category, created_at")
      .eq("category", category)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase query error:", error.message);
      return [];
    }

    return (data ?? []) as Article[];
  } catch (err) {
    console.error("Failed to fetch articles:", err);
    return [];
  }
}

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase products query error:", error.message);
      return [];
    }
    return (data ?? []) as Product[];
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

async function getSponsors(): Promise<Sponsor[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("sponsors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase sponsors query error:", error.message);
      return [];
    }
    return (data ?? []) as Sponsor[];
  } catch (err) {
    console.error("Failed to fetch sponsors:", err);
    return [];
  }
}

async function getActiveStream(): Promise<StreamVideo | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .eq("is_live", true)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Supabase streams query error:", error.message);
      return null;
    }
    return data as StreamVideo | null;
  } catch (err) {
    console.error("Failed to fetch active stream:", err);
    return null;
  }
}

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
    <section className="my-4">
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
    <div className="border border-slate-200 rounded-2xl p-2 text-center flex flex-col h-full bg-white shadow-sm hover:shadow-md hover:bg-indigo-50 transition-colors transition-transform duration-200 transform hover:scale-105">
      {product.image_url && (
        <Image src={product.image_url} alt={product.title} width={200} height={200} className="mx-auto rounded object-cover h-40 w-full" />
      )}
      <h5 className="mt-2 font-medium text-slate-900">{product.title}</h5>
      {product.description && <p className="text-sm text-gray-500">{product.description}</p>}
      <div className="mt-auto pt-2">
        <p className="text-slate-900 font-bold">${Number(product.price).toFixed(2)}</p>
        {product.buy_url && (
          <a href={product.buy_url} target="_blank" rel="noopener noreferrer" className="mt-2 block bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors">
            Comprar ahora
          </a>
        )}
      </div>
    </div>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-2 space-y-2 bg-white shadow-sm hover:shadow-md transition-shadow">
      <h4 className="font-semibold text-slate-900">{sponsor.name}</h4>
      <div className="flex flex-wrap gap-1">
        {sponsor.website_url && (
          <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="bg-slate-800 text-white px-2 py-1 rounded text-xs">
            Web
          </a>
        )}
        {sponsor.instagram_url && (
          <a href={sponsor.instagram_url} target="_blank" rel="noopener noreferrer" className="bg-slate-800 text-white px-2 py-1 rounded text-xs">
            Instagram
          </a>
        )}
      </div>
        {sponsor.map_url && (
          <p className="text-sm text-slate-500">Mapa no disponible temporalmente.</p>
        )}
    </div>
  );
}


  

// Skeleton for the NewsTabs while loading on the server
function NewsTabsSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-gradient-to-b from-gray-50/80 to-white shadow-sm overflow-hidden animate-pulse">
      <div className="flex border-b border-gray-200/60 bg-gray-50/50">
        {["Nacional", "Internacional", "Local"].map((label) => (
          <div key={label} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-300 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="p-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-px bg-gray-100 mt-2" />
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
    <main className="p-4 bg-slate-50 text-slate-900">
      {/* 1️⃣ Banner principal */}
      <Banner />

      {/* 2️⃣ Grid layout – 4 columnas (12‑col grid) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* ← Columna izquierda – Prensa */}
        <section className="col-span-1">
          <h3 className="text-slate-900 text-xl font-bold mb-2">Prensa</h3>
          <Suspense fallback={<NewsTabsSkeleton />}>
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none space-x-4 pb-4">
              <NewsTabs
                initialArticles={initialArticles}
                initialTab="Nacional"
              />
            </div>
          </Suspense>
        </section>

        {/* ← Medio‑izquierda – Tienda */}
        <section className="col-span-1">
          <h3 className="text-slate-900 text-xl font-bold mb-2">Tienda</h3>
          <div className="grid grid-cols-1 gap-4">
            {products.length > 0 ? (
              products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No hay productos disponibles.</p>
            )}
          </div>
        </section>

        {/* ← Columna derecha – Streaming */}
         <section className="col-span-1">
           <h3 className="text-slate-900 text-xl font-bold mb-2">Streaming</h3>
           <StickyVideo stream={activeStream} />
         </section>
      </div>
        <SubscriptionTiers />
    </main>
  );
}
