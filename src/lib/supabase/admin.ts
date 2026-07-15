// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

// Service role key allows full read/write access bypassing RLS. Keep this secret on the server.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
    },
  }
);

export default supabaseAdmin;
