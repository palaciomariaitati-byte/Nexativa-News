import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, store:stores(*)")
    .eq("id", id)
    .single();

  if (error || !product) {
    return notFound();
  }

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);
  const sizes = product.sizes ? product.sizes.split(",").map((s: string) => s.trim()) : [];
  const colors = product.colors ? product.colors.split(",").map((c: string) => c.trim()) : [];
  const store = product.store;

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-12 pb-32">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Galería de Imágenes */}
        <div className="space-y-4">
          <div className="glass-panel overflow-hidden rounded-2xl aspect-square relative">
            {images[0] ? (
              <Image src={images[0]} alt={product.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500">Sin imagen</div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {images.slice(1).map((img, idx) => (
              <div key={idx} className="glass-panel aspect-square relative rounded-xl overflow-hidden">
                <Image src={img} alt={`${product.title} ${idx+2}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Detalles del Producto */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">{product.title}</h1>
            <p className="text-3xl font-bold text-[var(--color-brand-accent)]">${Number(product.price).toFixed(2)}</p>
          </div>
          
          <div className="text-gray-300 whitespace-pre-line leading-relaxed">
            {product.description}
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            {sizes.length > 0 && (
              <div>
                <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wider">Talles Disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s: string) => (
                    <span key={s} className="px-4 py-2 rounded border border-white/20 text-gray-300 hover:border-[var(--color-brand-accent)] transition-colors cursor-pointer">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div>
                <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wider">Colores</h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c: string) => (
                    <span key={c} className="px-4 py-2 rounded border border-white/20 text-gray-300 hover:border-[var(--color-brand-accent)] transition-colors cursor-pointer">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Acciones de Compra (Mock antes del Carrito global) */}
          <div className="pt-6">
            <button className="w-full bg-[var(--color-brand-accent)] text-black font-black text-xl py-4 rounded-xl hover:bg-white transition-colors uppercase tracking-widest">
              Añadir al Carrito
            </button>
            {product.buy_url && (
              <a href={product.buy_url} target="_blank" rel="noopener noreferrer" className="block text-center mt-4 text-[var(--color-brand-accent)] underline">
                Link de pago directo
              </a>
            )}
          </div>

          {/* Información de la Tienda */}
          {store && (
            <div className="mt-12 bg-black/40 border border-white/10 p-6 rounded-2xl">
              <h3 className="text-[var(--color-brand-accent)] font-bold uppercase tracking-widest text-sm mb-4">Comercializado por</h3>
              <div className="flex items-center gap-4 mb-4">
                {store.logo_url && (
                  <img src={store.logo_url} alt={store.name} className="w-16 h-16 rounded-full object-cover border border-white/20" />
                )}
                <div>
                  <h4 className="text-xl font-bold text-white">{store.name}</h4>
                  <Link href={`/store/${store.id}`} className="text-sm text-gray-400 hover:text-white underline">Ver todos sus productos &rarr;</Link>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                {store.address && <p>📍 {store.address}</p>}
                {store.whatsapp && <p>💬 WhatsApp: <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="text-[var(--color-brand-accent)]">{store.whatsapp}</a></p>}
                {store.instagram && <p>📸 Instagram: <a href={store.instagram} target="_blank" className="text-[var(--color-brand-accent)]">Ver Perfil</a></p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
