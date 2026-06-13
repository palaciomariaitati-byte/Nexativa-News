import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { resolve } from 'path';

const envFile = fs.readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) env[key.trim()] = values.join('=').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProducts() {
  console.log("Adding updated_at to products...");
  const { error } = await supabase.rpc('query', { 
    query: 'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default now();' 
  });
  if (error) console.error("RPC Error:", error.message);
  else console.log("Done.");
}

fixProducts();
