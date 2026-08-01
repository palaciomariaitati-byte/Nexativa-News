// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceRoleKey = 
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Service role key allows full read/write access bypassing RLS. Keep this secret on the server.
const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
    },
  }
);

export { supabaseAdmin };
export default supabaseAdmin;
