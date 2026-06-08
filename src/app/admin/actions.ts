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
