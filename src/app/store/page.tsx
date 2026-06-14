import React from "react";
import { getProducts } from "@/lib/supabase/serverQueries";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorePage() {
  const products = await getProducts();

  return (
    <main className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-4">
        Nexativa Shop
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <div data-nora-product={product.title} key={product.id} className="glass-panel p-4 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all duration-300 group">
              {product.image_url && (
                <div className="overflow-hidden rounded-xl h-48 w-full mb-3 relative">
                  <Image src={product.image_url} alt={product.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <h5 className="mt-2 font-bold text-gray-100 text-lg line-clamp-1">{product.title}</h5>
              {product.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>}
              
              {product.store && (
                <div className="mt-2 text-xs text-[var(--color-brand-accent)] font-bold uppercase tracking-wider">
                  <Link href={`/store/${product.store.id}`} className="hover:underline">
                    Tienda: {product.store.name}
                  </Link>
                </div>
              )}

              <div className="mt-auto pt-4 flex flex-col gap-3">
                <p className="text-[var(--color-brand-accent)] font-bold text-xl">${Number(product.price).toFixed(2)}</p>
                <Link href={`/product/${product.id}`} className="bg-white/10 hover:bg-[var(--color-brand-accent)] hover:text-black text-center font-bold px-4 py-2 rounded-lg transition-colors w-full">
                  Ver Detalles
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 col-span-full">No hay productos disponibles en este momento.</p>
        )}
      </div>
    </main>
  );
}
