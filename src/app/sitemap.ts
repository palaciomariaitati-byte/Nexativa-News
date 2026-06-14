import { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.nexativanews.com.ar";
  const supabase = createServerSupabaseClient();

  // Rutas estáticas base
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "always", priority: 1.0 },
    { url: `${baseUrl}/cultura`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  // Obtener productos
  const { data: products } = await supabase.from("products").select("id, updated_at");
  const productRoutes: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${baseUrl}/product/${p.id}`,
    lastModified: new Date(p.updated_at || new Date()),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Obtener tiendas
  const { data: stores } = await supabase.from("stores").select("id, created_at");
  const storeRoutes: MetadataRoute.Sitemap = (stores || []).map((s) => ({
    url: `${baseUrl}/store/${s.id}`,
    lastModified: new Date(s.created_at || new Date()),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Obtener obras culturales (publicadas)
  const { data: cultural } = await supabase.from("cultural_posts").select("id, updated_at").eq("status", "published");
  const culturalRoutes: MetadataRoute.Sitemap = (cultural || []).map((c) => ({
    url: `${baseUrl}/cultura/${c.id}`,
    lastModified: new Date(c.updated_at || new Date()),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...storeRoutes, ...culturalRoutes];
}
