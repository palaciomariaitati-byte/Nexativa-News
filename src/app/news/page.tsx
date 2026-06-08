import React, { Suspense } from "react";
import { getPublishedArticles } from "@/lib/supabase/serverQueries";
import NewsTabs from "@/components/NewsTabs/NewsTabs";

export default async function NewsPage() {
  const initialArticles = await getPublishedArticles("nacional");

  return (
    <main className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-4">
        Todas las Noticias
      </h1>
      
      <section className="w-full">
        <Suspense fallback={
          <div className="glass-panel overflow-hidden animate-pulse p-4">
            Cargando noticias...
          </div>
        }>
          <NewsTabs
            initialArticles={initialArticles}
            initialTab="Nacional"
          />
        </Suspense>
      </section>
    </main>
  );
}
