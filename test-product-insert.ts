import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { resolve } from 'path';

// Parse .env.local manually to avoid dotenv dependency
const envFile = fs.readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) env[key.trim()] = values.join('=').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing insert into products...");
  const payload = {
    title: "Test Product",
    description: "Testing from backend",
    price: 100.50,
    stock: 10,
    buy_url: "",
    image_url: "",
  };

  const { data, error } = await supabase.from("products").insert([payload]).select();
  
  if (error) {
    console.error("❌ ERROR INSERTING PRODUCT:", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ SUCCESS:", data);
    await supabase.from("products").delete().eq("id", data[0].id);
  }
}

testInsert();
