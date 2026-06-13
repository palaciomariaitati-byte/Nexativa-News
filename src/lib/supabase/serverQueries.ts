import { createServerSupabaseClient } from "./server";
import type { Article, Product, Sponsor, StreamVideo } from "../types";

export async function getPublishedArticles(category: string): Promise<Article[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, excerpt, image_url, category, created_at, external_url")
      .eq("category", category)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching articles:", error);
      return [];
    }
    return (data || []) as Article[];
  } catch (error) {
    console.error("Error in getPublishedArticles:", error);
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, title, description, price, image_url, buy_url")
      .order("created_at", { ascending: false })
      .limit(6); // Limit changed to 6 or can be removed

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }
    return (data || []) as Product[];
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
}

export async function getSponsors(): Promise<Sponsor[]> {
  try {
    const supabase = createServerSupabaseClient();
    // Assuming simple table sponsors(id, name, logo_url, website_url, instagram_url)
    const { data, error } = await supabase
      .from("sponsors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sponsors:", error);
      return [];
    }
    return (data || []) as Sponsor[];
  } catch (error) {
    console.error("Error in getSponsors:", error);
    return [];
  }
}

export async function getActiveStream(): Promise<StreamVideo | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("stream_videos")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error) {
      return null;
    }
    return data as StreamVideo;
  } catch (error) {
    console.error("Error in getActiveStream:", error);
    return null;
  }
}
