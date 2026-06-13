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
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertAnon() {
  console.log("Testing insert into products with ANON KEY...");
  const payload = {
    title: "Test Product Anon",
    description: "Testing from backend anon",
    price: 100.50,
    stock: 10,
    buy_url: "",
    image_url: "",
  };

  const { data, error } = await supabase.from("products").insert([payload]).select();
  
  if (error) {
    console.error("❌ ERROR INSERTING PRODUCT (ANON):", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ SUCCESS (ANON):", data);
    await supabase.from("products").delete().eq("id", data[0].id);
  }
}

testInsertAnon();
