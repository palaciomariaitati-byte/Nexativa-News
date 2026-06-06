/* src/app/page.tsx */

import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Article } from "@/lib/types";
import NewsTabs from "@/components/NewsTabs/NewsTabs";

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

// -----------------------------------------------------------------
// Mock data (static) — kept for non-news columns
// -----------------------------------------------------------------
const banners = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1622545609490-f0cfd674574d?auto=format&fit=crop&w=1200&q=80",
    alt: "Banner Principal",
    link: "#",
  },
];

const products = [
  {
    id: 1,
    name: "Camiseta básica",
    price: "$9.99",
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    name: "Pantalón casual",
    price: "$19.99",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    name: "Zapatos sport",
    price: "$29.99",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
  },
];

const sponsors = [
  {
    id: 1,
    name: "Café Local",
    review: "Excelente atención y café artesanal.",
    contacts: {
      whatsapp: "https://wa.me/123456789",
      instagram: "https://instagram.com/cafelocal",
      facebook: "https://facebook.com/cafelocal",
      tiktok: "https://tiktok.com/@cafelocal",
      email: "mailto:info@cafelocal.com",
    },
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.123456789!2d-58.381592!3d-34.603722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1s0x95bcc3c5c0c0c0c1%3A0x7f5d5d5d5d5d5d5d!2sCaf%C3%A9%20Local!5e0!3m2!1ses!2sar!4v1700000000000",
  },
];

const videos = [
  {
    id: 1,
    title: "Resumen de noticias del día",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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

function ProductCard({ product }: { product: typeof products[0] }) {
  return (
    <div className="border rounded p-2 text-center">
      <Image src={product.image} alt={product.name} width={200} height={200} className="mx-auto rounded" />
      <h5 className="mt-2 font-medium text-black">{product.name}</h5>
      <p className="text-red-600 font-bold">{product.price}</p>
      <button className="mt-2 bg-black text-white px-3 py-1 rounded hover:bg-gray-800">
        Comprar ahora
      </button>
    </div>
  );
}

function SponsorCard({ sponsor }: { sponsor: typeof sponsors[0] }) {
  return (
    <div className="border rounded p-2 space-y-2">
      <h4 className="font-semibold text-black">{sponsor.name}</h4>
      <p className="text-sm text-gray-700">{sponsor.review}</p>
      <div className="flex flex-wrap gap-1">
        <a href={sponsor.contacts.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-2 py-1 rounded text-xs">
          WhatsApp
        </a>
        <a href={sponsor.contacts.instagram} target="_blank" rel="noopener noreferrer" className="bg-pink-600 text-white px-2 py-1 rounded text-xs">
          Instagram
        </a>
        <a href={sponsor.contacts.facebook} target="_blank" rel="noopener noreferrer" className="bg-blue-800 text-white px-2 py-1 rounded text-xs">
          Facebook
        </a>
        <a href={sponsor.contacts.tiktok} target="_blank" rel="noopener noreferrer" className="bg-black text-white px-2 py-1 rounded text-xs">
          TikTok
        </a>
        <a href={sponsor.contacts.email} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white px-2 py-1 rounded text-xs">
          Email
        </a>
      </div>
      <button className="w-full bg-black text-white px-2 py-1 rounded text-sm">Cerrar Trato</button>
      <iframe
        src={sponsor.mapEmbed}
        width="100%"
        height="150"
        allowFullScreen
        loading="lazy"
        className="rounded"
      ></iframe>
    </div>
  );
}

function VideoSection() {
  return (
    <div className="space-y-4">
      {videos.map((v) => (
        <div key={v.id} className="border rounded p-2">
          <h5 className="font-semibold text-black mb-2">{v.title}</h5>
          <div className="aspect-video">
            <iframe
              src={v.url}
              title={v.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded"
            ></iframe>
          </div>
        </div>
      ))}
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
  // Pre-fetch the default tab ("Nacional") on the server
  const initialArticles = await getPublishedArticles("nacional");

  return (
    <main className="p-4 bg-white text-black">
      {/* 1️⃣ Banner principal */}
      <Banner />

      {/* 2️⃣ Grid layout – 4 columnas (12‑col grid) */}
      <div className="grid grid-cols-12 gap-4">
        {/* ← Columna izquierda – Prensa */}
        <section className="col-span-3">
          <h3 className="font-bold text-lg mb-2">Prensa</h3>
          <Suspense fallback={<NewsTabsSkeleton />}>
            <NewsTabs
              initialArticles={initialArticles}
              initialTab="Nacional"
            />
          </Suspense>
        </section>

        {/* ← Medio‑izquierda – Tienda */}
        <section className="col-span-3">
          <h3 className="font-bold text-lg mb-2">Tienda</h3>
          <div className="grid grid-cols-1 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ← Medio‑derecha – Patrocinadores */}
        <section className="col-span-3">
          <h3 className="font-bold text-lg mb-2">Patrocinadores</h3>
          <div className="space-y-4">
            {sponsors.map((s) => (
              <SponsorCard key={s.id} sponsor={s} />
            ))}
          </div>
        </section>

        {/* ← Columna derecha – Streaming */}
        <section className="col-span-3">
          <h3 className="font-bold text-lg mb-2">Streaming</h3>
          <VideoSection />
        </section>
      </div>
    </main>
  );
}
