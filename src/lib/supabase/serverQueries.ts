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
      .select("*, store:stores(*)")
      .order("created_at", { ascending: false });

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

export async function getStores(): Promise<any[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("stores")
      .select("*, products(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stores:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error in getStores:", error);
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

export async function saveNoraLead(leadData: any): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("nora_leads").insert([leadData]);
    if (error) {
      console.error("Error saving Nora lead:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in saveNoraLead:", error);
    return false;
  }
}

export async function saveNoraComplaint(history: any[], finalMessage: string, noraResponse: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const complaintData = {
      chat_history: JSON.stringify([...history, { role: "user", content: finalMessage }]),
      nora_response: noraResponse,
      status: "PENDIENTE_REVISION"
    };
    const { error } = await supabase.from("nora_complaints").insert([complaintData]);
    if (error) {
      console.error("Error saving Nora complaint:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in saveNoraComplaint:", error);
    return false;
  }
}

