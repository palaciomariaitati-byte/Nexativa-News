import React from "react";
import { getProducts, getStores } from "@/lib/supabase/serverQueries";
import Image from "next/image";
import Link from "next/link";
import { Store as StoreIcon } from "lucide-react";
import ImageCarousel from "@/components/ImageCarousel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorePage() {
  const products = await getProducts();
  const stores = await getStores();

  return (
    <main className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-4">
        Nexativa Shop
      </h1>
      
      {/* Sección de Tiendas */}
      {stores.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-brand-accent)] mb-6 flex items-center gap-2">
            <StoreIcon className="w-6 h-6" /> Nuestras Tiendas Oficiales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => {
              // Extract up to 5 images from different products to represent the store
              const storeImages = (store.products || [])
                .map((p: any) => p.image_url)
                .filter(Boolean)
                .slice(0, 5);

              // If no product images, we fallback to store logo or banner
              if (storeImages.length === 0) {
                if (store.banner_url) storeImages.push(store.banner_url);
                else if (store.logo_url) storeImages.push(store.logo_url);
              }

              return (
                <div key={store.id} className="glass-panel p-4 flex flex-col hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all group border border-white/10 relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden bg-black/50 shrink-0">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <StoreIcon className="w-6 h-6 m-auto mt-4 text-white/50" />
                      )}
                    </div>
                    <div>
                      <Link href={`/store/${store.id}`} className="hover:underline">
                        <h3 className="font-bold text-white text-xl group-hover:text-[var(--color-brand-accent)] transition-colors">{store.name}</h3>
                      </Link>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{store.description || "Visitar Tienda"}</p>
                    </div>
                  </div>

                  {storeImages.length > 0 ? (
                    <div className="h-48 w-full rounded-xl overflow-hidden mb-4 border border-white/10">
                      <ImageCarousel images={storeImages} autoPlay={true} interval={4000} className="w-full h-full rounded-xl" />
                    </div>
                  ) : (
                     <div className="h-48 w-full rounded-xl bg-white/5 flex items-center justify-center text-gray-500 mb-4">Sin imágenes</div>
                  )}
                  
                  <Link href={`/store/${store.id}`} className="mt-auto bg-white/10 hover:bg-[var(--color-brand-accent)] hover:text-black font-bold text-center py-2 rounded-lg transition-colors w-full uppercase tracking-wider text-sm">
                    Ir a la tienda
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sección de Productos */}
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">Todos los Productos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => {
            const prodImages = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[];

            return (
              <div data-nora-context={JSON.stringify({ type: 'b2c', title: product.title, price: product.price, store: product.store?.name, description: product.description })} key={product.id} className="glass-panel p-4 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_0_20px_var(--color-brand-accent)] transition-all duration-300 group">
                <div className="h-48 w-full rounded-xl overflow-hidden mb-3 relative border border-white/10">
                   <ImageCarousel images={prodImages} autoPlay={false} className="w-full h-full rounded-xl" />
                </div>
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
            );
          })
        ) : (
          <p className="text-sm text-gray-500 col-span-full">No hay productos cargados actualmente.</p>
        )}
      </div>
    </main>
  );
}
