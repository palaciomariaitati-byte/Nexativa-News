import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log("Creating uploads bucket...");
  const { data, error } = await supabase.storage.createBucket("uploads", { public: true });
  if (error) {
    console.log("Bucket might exist:", error.message);
  } else {
    console.log("Bucket created:", data);
  }
}
setup();
