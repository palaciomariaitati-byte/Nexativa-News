import React from "react";
import { getProducts } from "@/lib/supabase/serverQueries";
import Image from "next/image";

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
            <div key={product.id} className="glass-panel p-4 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all duration-300 group">
              {product.image_url && (
                <div className="overflow-hidden rounded-xl h-48 w-full mb-3">
                  <Image src={product.image_url} alt={product.title} width={300} height={300} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
          ))
        ) : (
          <p className="text-sm text-gray-500 col-span-full">No hay productos disponibles en este momento.</p>
        )}
      </div>
    </main>
  );
}
