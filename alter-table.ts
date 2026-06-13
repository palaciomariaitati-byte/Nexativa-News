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

async function run() {
  console.log("Checking uploads bucket...");
  const { error: bucketError } = await supabase.storage.createBucket("uploads", { public: true });
  if (bucketError) console.log("Bucket status:", bucketError.message);
  else console.log("Bucket created!");

  console.log("Altering articles table...");
  const { error: queryError } = await supabase.rpc('query', { query: 'ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS external_url text;' });
  
  if (queryError) {
     console.error("RPC query failed. Trying direct insertion or it requires SQL Editor.");
     console.error(queryError);
  } else {
     console.log("Column added successfully!");
  }
}
run();
