/* src/app/page.tsx */
export const dynamic = 'force-dynamic';

import React from "react";
import {
  getPublishedArticles,
  getProducts,
  getSponsors,
  getLatestNewsFlashes
} from "@/lib/supabase/serverQueries";
import SovereignHomeDesign from "@/components/Home/SovereignHomeDesign";

export default async function HomePage() {
  // Fetch real data in parallel on the server
  const [initialArticles, products, sponsors, newsFlashes] = await Promise.all([
    getPublishedArticles("nacional"),
    getProducts(),
    getSponsors(),
    getLatestNewsFlashes(5),
  ]);

  return (
    <SovereignHomeDesign
      initialArticles={initialArticles}
      sponsors={sponsors}
      newsFlashes={newsFlashes}
      products={products}
    />
  );
}
