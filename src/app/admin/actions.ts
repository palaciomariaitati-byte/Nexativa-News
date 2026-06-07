// src/app/admin/actions.ts

'use server';

import { cookies } from 'next/headers';
import supabaseAdmin from '@/lib/supabase/admin';

// ----- Authentication -----
export async function adminLogin(password: string) {
  const adminPass = process.env.NEXT_ADMIN_PASSWORD;
  if (!adminPass) {
    throw new Error('Missing NEXT_ADMIN_PASSWORD environment variable');
  }
  if (password !== adminPass) {
    throw new Error('Invalid password');
  }
  // Set a signed httpOnly cookie to keep the session
  cookies().set('admin_auth', 'true', {
    httpOnly: true,
    path: '/admin',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

// ----- CRUD Helpers (generic) -----
export async function fetchAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabaseAdmin.from<T>(table).select('*');
  if (error) throw error;
  return data;
}

export async function createRecord<T>(table: string, payload: T): Promise<T> {
  const { data, error } = await supabaseAdmin.from<T>(table).insert(payload).single();
  if (error) throw error;
  return data;
}

export async function updateRecord<T>(table: string, id: string, payload: Partial<T>): Promise<T> {
  const { data, error } = await supabaseAdmin
    .from<T>(table)
    .update(payload)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(table: string, id: string) {
  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}
