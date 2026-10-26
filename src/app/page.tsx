/* src/app/page.tsx */
export const dynamic = 'force-dynamic';

import React from "react";
import {
  getPublishedArticles,
  getProducts,
  getSponsors,
  getLatestNewsFlashes,
  getVerifiedProperties,
  getStores,
} from "@/lib/supabase/serverQueries";
import SovereignHomeDesign from "@/components/Home/SovereignHomeDesign";

export default async function HomePage() {
  // Fetch real data in parallel on the server
  const [initialArticles, products, sponsors, newsFlashes, properties, stores] = await Promise.all([
    getPublishedArticles("nacional"),
    getProducts(),
    getSponsors(),
    getLatestNewsFlashes(5),
    getVerifiedProperties(8),
    getStores(),
  ]);

  return (
    <SovereignHomeDesign
      initialArticles={initialArticles}
      sponsors={sponsors}
      newsFlashes={newsFlashes}
      products={products}
      properties={properties}
      stores={stores}
    />
  );
}
