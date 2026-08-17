import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 * Safe to use in Server Components and Route Handlers.
 * Uses dynamic runtime variable evaluation with resilient fallback.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    'https://xeheuscrttrbfnojwwqt.supabase.co';

  const supabaseKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Supabase Server Client Error]: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_KEY.");
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}
