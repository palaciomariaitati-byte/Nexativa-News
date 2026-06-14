import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: store } = await supabase.from("stores").select("name, description, logo_url, banner_url").eq("id", id).single();
  if (!store) return { title: "Tienda no encontrada" };
  
  const image = store.banner_url || store.logo_url;
  
  return {
    title: store.name,
    description: store.description || `Bienvenido a la tienda de ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description || `Bienvenido a la tienda de ${store.name}`,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: store.name,
      description: store.description || `Bienvenido a la tienda de ${store.name}`,
      images: image ? [image] : [],
    }
  };
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (storeError || !store) {
    return notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-12 pb-32">
      {/* Banner/Header de Tienda */}
      <div className="relative bg-black/30 border border-white/10 rounded-3xl mb-12 overflow-hidden">
        {store.banner_url && (
          <div className="w-full h-48 sm:h-64 md:h-80 relative">
            <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
        )}
        <div className={`p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 ${store.banner_url ? '-mt-24' : ''}`}>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-[#1a1a1a] bg-black shadow-2xl" />
          ) : (
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-[#1a1a1a] border-4 border-black flex items-center justify-center text-gray-500 shadow-2xl">Sin Logo</div>
          )}
          <div className="flex-1 text-center md:text-left space-y-4 md:mt-12">
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{store.name}</h1>
            <p className="text-gray-300 text-lg max-w-2xl drop-shadow-md">{store.description}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              {store.address && <span className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg text-sm border border-white/10">📍 {store.address}</span>}
              {store.map_url && <a href={store.map_url} target="_blank" className="bg-white/10 backdrop-blur-md text-[var(--color-brand-accent)] px-4 py-2 rounded-lg text-sm border border-[var(--color-brand-accent)]/30 font-bold hover:bg-[var(--color-brand-accent)]/20 transition-colors">🗺️ Ubicación</a>}
              {store.whatsapp && <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="bg-green-600/30 backdrop-blur-md text-green-400 px-4 py-2 rounded-lg text-sm border border-green-500/30 font-bold hover:bg-green-600/50 transition-colors">💬 WhatsApp</a>}
              {store.instagram && <a href={store.instagram} target="_blank" className="bg-pink-600/30 backdrop-blur-md text-pink-400 px-4 py-2 rounded-lg text-sm border border-pink-500/30 font-bold hover:bg-pink-600/50 transition-colors">📸 Instagram</a>}
              {store.facebook && <a href={store.facebook} target="_blank" className="bg-blue-600/30 backdrop-blur-md text-blue-400 px-4 py-2 rounded-lg text-sm border border-blue-500/30 font-bold hover:bg-blue-600/50 transition-colors">📘 Facebook</a>}
              {store.x_url && <a href={store.x_url} target="_blank" className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm border border-white/30 font-bold hover:bg-white/20 transition-colors">𝕏 Twitter</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 pb-4 mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Catálogo de Productos</h2>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div data-nora-product={product.title} key={product.id} className="glass-panel p-3 sm:p-4 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all duration-300 group">
              <div className="overflow-hidden rounded-xl h-48 w-full mb-3 relative">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500">Sin img</div>
                )}
              </div>
              <h5 className="mt-2 font-bold text-gray-100 text-lg line-clamp-1">{product.title}</h5>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>
              <div className="mt-auto pt-4 flex flex-col gap-3">
                <p className="text-[var(--color-brand-accent)] font-bold text-xl">${Number(product.price).toFixed(2)}</p>
                <Link href={`/product/${product.id}`} className="bg-white/10 hover:bg-[var(--color-brand-accent)] hover:text-black text-center font-bold px-4 py-2 rounded-lg transition-colors">
                  Ver Detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg py-12">Esta tienda aún no tiene productos publicados.</p>
      )}
    </main>
  );
}
