import { createClient } from "@supabase/supabase-js";
import * as fs from 'fs';
import { resolve } from 'path';

const envFile = fs.readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) env[key.trim()] = values.join('=').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  console.log("Testing upload with ANON key...");
  
  // Create a dummy file
  const buffer = Buffer.from("Hello World", "utf-8");
  const blob = new Blob([buffer], { type: "text/plain" });

  const fileName = `test_upload_${Date.now()}.txt`;
  
  const { data, error } = await supabase.storage.from("uploads").upload(fileName, blob, { upsert: false });
  
  if (error) {
    console.error("❌ Upload failed:", error.message);
  } else {
    console.log("✅ Upload successful:", data);
    // Cleanup
    await supabase.storage.from("uploads").remove([fileName]);
  }
}

testUpload();
