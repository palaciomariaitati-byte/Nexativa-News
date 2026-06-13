import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

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
      <div className="bg-black/30 border border-white/10 rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-8">
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-white/10" />
        ) : (
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/5 border-4 border-white/10 flex items-center justify-center text-gray-500">Sin Logo</div>
        )}
        <div className="flex-1 text-center md:text-left space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white">{store.name}</h1>
          <p className="text-gray-300 text-lg max-w-2xl">{store.description}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            {store.address && <span className="bg-white/5 px-4 py-2 rounded-lg text-sm border border-white/10">📍 {store.address}</span>}
            {store.whatsapp && <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="bg-green-600/20 text-green-400 px-4 py-2 rounded-lg text-sm border border-green-500/30 font-bold">💬 WhatsApp</a>}
            {store.instagram && <a href={store.instagram} target="_blank" className="bg-pink-600/20 text-pink-400 px-4 py-2 rounded-lg text-sm border border-pink-500/30 font-bold">📸 Instagram</a>}
            {store.facebook && <a href={store.facebook} target="_blank" className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg text-sm border border-blue-500/30 font-bold">📘 Facebook</a>}
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 pb-4 mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Catálogo de Productos</h2>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="glass-panel p-3 sm:p-4 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all duration-300 group">
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
