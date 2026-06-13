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

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSponsors() {
  console.log("Checking sponsors table...");
  const { data, error } = await supabase.from('sponsors').select('*').limit(1);
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("DATA:", data);
  }
}

checkSponsors();
