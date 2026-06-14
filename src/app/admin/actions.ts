"use server";

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----- Authentication (Password Only) -----
export async function adminLogin(password: string) {
  const supabase = createServerSupabaseClient();
  
  // Call our new custom secure function to verify the password
  const { data: role, error } = await supabase.rpc("verify_staff_password", { p_password: password });
  
  if (error) {
    throw new Error("Error del servidor: " + error.message);
  }

  if (!role) {
    throw new Error("Clave de acceso incorrecta.");
  }

  // Set a signed httpOnly cookie to keep the session
  const cookieStore = await cookies();
  cookieStore.set("staff_role", role, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  
  return role;
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("staff_role");
}

export async function getStaffRole() {
  const cookieStore = await cookies();
  return cookieStore.get("staff_role")?.value || null;
}

// ----- Staff Management -----
export async function createStaffKey(name: string, password: string, role: string) {
  const currentUserRole = await getStaffRole();
  if (currentUserRole !== "admin") throw new Error("No autorizado");

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("staff_passwords").insert([{ name, password, role }]);
  if (error) throw error;
  return true;
}

export async function deleteStaffKey(id: string) {
  const currentUserRole = await getStaffRole();
  if (currentUserRole !== "admin") throw new Error("No autorizado");

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("staff_passwords").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function listStaffKeys() {
  const currentUserRole = await getStaffRole();
  if (currentUserRole !== "admin") throw new Error("No autorizado");

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("staff_passwords").select("id, name, role, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ----- Sponsors Management -----
export async function uploadImage(file: File, folder: string) {
  const supabase = createServerSupabaseClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage.from('uploads').upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('Error subiendo imagen: ' + error.message);
  
  const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

export async function createSponsor(formData: FormData) {
  try {
    const role = await getStaffRole();
    if (!role) return { error: 'No autorizado' };

    const name = formData.get('name') as string;
    const slogan = formData.get('slogan') as string;
    const category = formData.get('category') as string || 'Servicios';
    const website_url = formData.get('website_url') as string;
    const instagram_url = formData.get('instagram_url') as string;
    const facebook_url = formData.get('facebook_url') as string;
    const tiktok_url = formData.get('tiktok_url') as string;
    const youtube_url = formData.get('youtube_url') as string;
    const x_url = formData.get('x_url') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const email = formData.get('email') as string;
    const plan_type = formData.get('plan_type') as string;
    const map_url = formData.get('map_url') as string;
    const logoFile = formData.get('logo') as File | null;
    const bannerFile = formData.get('banner') as File | null;

    let logo_url = '';
    let banner_url = '';

    if (logoFile && logoFile.size > 0) logo_url = await uploadImage(logoFile, 'sponsors/logos');
    if (bannerFile && bannerFile.size > 0) banner_url = await uploadImage(bannerFile, 'sponsors/banners');

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('sponsors').insert([
      { name, slogan, category, logo_url, banner_url, website_url, instagram_url, facebook_url, tiktok_url, youtube_url, x_url, whatsapp, email, plan_type, map_url }
    ]);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateSponsor(id: string, formData: FormData) {
  try {
    const role = await getStaffRole();
    if (!role) return { error: 'No autorizado' };

    const name = formData.get('name') as string;
    const slogan = formData.get('slogan') as string;
    const category = formData.get('category') as string || 'Servicios';
    const plan_type = formData.get('plan_type') as string;
    const website_url = formData.get('website_url') as string;
    const instagram_url = formData.get('instagram_url') as string;
    const facebook_url = formData.get('facebook_url') as string;
    const tiktok_url = formData.get('tiktok_url') as string;
    const youtube_url = formData.get('youtube_url') as string;
    const x_url = formData.get('x_url') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const email = formData.get('email') as string;
    const map_url = formData.get('map_url') as string;
    const logoFile = formData.get('logo') as File | null;
    const bannerFile = formData.get('banner') as File | null;

    const updateData: any = { name, slogan, category, plan_type, website_url, instagram_url, facebook_url, tiktok_url, youtube_url, x_url, whatsapp, email, map_url };

    if (logoFile && logoFile.size > 0) updateData.logo_url = await uploadImage(logoFile, 'sponsors/logos');
    if (bannerFile && bannerFile.size > 0) updateData.banner_url = await uploadImage(bannerFile, 'sponsors/banners');

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('sponsors').update(updateData).eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteSponsor(id: string) {
  try {
    const role = await getStaffRole();
    if (!role) return { error: 'No autorizado' };

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

// ----- Generic CRUD for Dashboard -----
export async function fetchAll<T = any>(table: string): Promise<T[]> {
  const role = await getStaffRole();
  if (!role) throw new Error('No autorizado');

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as T[];
}

export async function deleteRecord(table: string, id: string) {
  const role = await getStaffRole();
  if (!role) throw new Error('No autorizado');

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ----- Accounting Management -----
export async function createAccountingMovement(formData: FormData) {
  try {
    const role = await getStaffRole();
    if (!role) return { error: 'No autorizado' };

    const type = formData.get('type') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('accounting_movements').insert([
      { type, amount, description }
    ]);
    
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

