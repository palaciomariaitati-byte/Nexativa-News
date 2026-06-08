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
  const role = await getStaffRole();
  if (!role) throw new Error('No autorizado');

  const name = formData.get('name') as string;
  const category = formData.get('category') as string || 'Servicios';
  const website_url = formData.get('website_url') as string;
  const instagram_url = formData.get('instagram_url') as string;
  const logoFile = formData.get('logo') as File | null;
  const bannerFile = formData.get('banner') as File | null;

  let logo_url = '';
  let banner_url = '';

  if (logoFile && logoFile.size > 0) logo_url = await uploadImage(logoFile, 'sponsors/logos');
  if (bannerFile && bannerFile.size > 0) banner_url = await uploadImage(bannerFile, 'sponsors/banners');

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('sponsors').insert([
    { name, category, logo_url, banner_url, website_url, instagram_url }
  ]);
  if (error) throw new Error(error.message);
  return true;
}

export async function updateSponsor(id: string, formData: FormData) {
  const role = await getStaffRole();
  if (!role) throw new Error('No autorizado');

  const name = formData.get('name') as string;
  const category = formData.get('category') as string || 'Servicios';
  const website_url = formData.get('website_url') as string;
  const instagram_url = formData.get('instagram_url') as string;
  const logoFile = formData.get('logo') as File | null;
  const bannerFile = formData.get('banner') as File | null;

  const updateData: any = { name, category, website_url, instagram_url };

  if (logoFile && logoFile.size > 0) updateData.logo_url = await uploadImage(logoFile, 'sponsors/logos');
  if (bannerFile && bannerFile.size > 0) updateData.banner_url = await uploadImage(bannerFile, 'sponsors/banners');

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('sponsors').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteSponsor(id: string) {
  const role = await getStaffRole();
  if (!role) throw new Error('No autorizado');

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('sponsors').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

