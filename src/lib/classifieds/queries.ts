/**
 * ========================================================================
 * 🗄️ CONSULTAS Y SERVICIOS — CLASIFICADOS NEXATIVA
 * Ubicación: /src/lib/classifieds/queries.ts
 * ========================================================================
 */

import { supabase } from "@/lib/supabase/client";
import { ClassifiedItem, ClassifiedFormData, ClassifiedCategory } from "@/types/classifieds";

export interface GetClassifiedsOptions {
  category?: ClassifiedCategory | "todas";
  query?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: "ARS" | "USD";
  onlyTrade?: boolean;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Obtiene el listado de avisos clasificados con filtros opcionales
 */
export async function fetchClassifieds(options: GetClassifiedsOptions = {}): Promise<ClassifiedItem[]> {
  try {
    let query = supabase
      .from("classified_items")
      .select("*")
      .eq("is_active", true)
      .neq("status", "deleted")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (options.category && options.category !== "todas") {
      query = query.eq("category", options.category);
    }

    if (options.location && options.location !== "todas") {
      query = query.ilike("location", `%${options.location}%`);
    }

    if (options.currency) {
      query = query.eq("currency", options.currency);
    }

    if (options.onlyTrade) {
      query = query.eq("accepts_trade", true);
    }

    if (options.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    if (options.minPrice !== undefined && options.minPrice > 0) {
      query = query.gte("price", options.minPrice);
    }

    if (options.maxPrice !== undefined && options.maxPrice > 0) {
      query = query.lte("price", options.maxPrice);
    }

    if (options.query && options.query.trim().length > 0) {
      const term = options.query.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
    }

    const limit = options.limit || 24;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.warn("[Fetch Classifieds Error]:", error.message);
      return [];
    }

    return (data as ClassifiedItem[]) || [];
  } catch (err) {
    console.error("[Fetch Classifieds Exception]:", err);
    return [];
  }
}

/**
 * Obtiene un aviso por su ID
 */
export async function fetchClassifiedById(id: string): Promise<ClassifiedItem | null> {
  try {
    const { data, error } = await supabase
      .from("classified_items")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.warn("[Fetch Single Classified Warn]:", error?.message);
      return null;
    }

    // Incrementar contador de visualizaciones en background
    try {
      supabase.rpc("increment_classified_views", { item_id: id }).then();
    } catch {}

    return data as ClassifiedItem;
  } catch (err) {
    console.error("[Fetch Single Classified Exception]:", err);
    return null;
  }
}

/**
 * Sube una imagen comprimida al Bucket de Storage de Clasificados
 */
export async function uploadClassifiedPhoto(file: File | Blob, index: number): Promise<string | null> {
  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-foto-${index}.webp`;
    const filePath = `items/${fileName}`;

    const { data, error } = await supabase.storage
      .from("classifieds-images")
      .upload(filePath, file, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false
      });

    if (error || !data) {
      console.warn("[Upload Photo Warn]:", error?.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("classifieds-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[Upload Photo Exception]:", err);
    return null;
  }
}

/**
 * Crea un nuevo aviso clasificado
 */
export async function createClassified(formData: ClassifiedFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const numPrice = typeof formData.price === "string" ? parseFloat(formData.price) || 0 : formData.price;
    const cleanWhatsapp = formData.seller_whatsapp.replace(/\D/g, "");

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      condition: formData.condition,
      price: numPrice,
      currency: formData.currency || "ARS",
      is_negotiable: formData.is_negotiable ?? true,
      accepts_trade: formData.accepts_trade ?? false,
      location: formData.location.trim() || "Ituzaingó, Corrientes",
      description: formData.description.trim(),
      images: formData.images || [],
      seller_name: formData.seller_name.trim(),
      seller_phone: formData.seller_phone.trim(),
      seller_whatsapp: cleanWhatsapp || formData.seller_phone.trim(),
      seller_email: formData.seller_email?.trim() || null,
      is_featured: false,
      is_active: true,
      status: "active",
      views_count: 0,
      metadata: formData.metadata || {}
    };

    const { data, error } = await supabase
      .from("classified_items")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "No se pudo guardar el aviso" };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al conectar con el servidor" };
  }
}
