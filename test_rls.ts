import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xeheuscrttrbfnojwwqt.supabase.co";
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaGV1c2NydHRyYmZub2p3d3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcxNjU3MiwiZXhwIjoyMDk2MjkyNTcyfQ.55UUU1WmZp18AzaCmn2pjKP27u52zzzpt9an0TB3AjI";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatus() {
  console.log("Checking RLS and Database Status...");

  // Try fetching products
  const { data: products, error: pError } = await supabase.from("products").select("*").limit(1);
  if (pError) console.error("Products select error (service_role):", pError);
  else console.log("Products table accessible via service_role.");

  // Let's check with Anon key (simulating the browser client)
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaGV1c2NydHRyYmZub2p3d3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NzIsImV4cCI6MjA5NjI5MjU3Mn0.WgHr9a4nJznufgYtkMhy_9aA9_V5qSEYlkn-gElbvIs";
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  const { error: anonInsertError } = await supabaseAnon.from("products").insert([
    {
      title: "Test RLS Product",
      price: 10,
      stock: 10,
      description: "Test"
    }
  ]);
  
  if (anonInsertError) {
    console.error("Products insert error (anon key):", anonInsertError);
  } else {
    console.log("Products insert successful with anon key!");
    // cleanup
    await supabase.from("products").delete().eq("title", "Test RLS Product");
  }

  // Same for sponsors
  const { error: anonSponsorError } = await supabaseAnon.from("sponsors").insert([
    {
      name: "Test RLS Sponsor"
    }
  ]);

  if (anonSponsorError) {
    console.error("Sponsors insert error (anon key):", anonSponsorError);
  } else {
    console.log("Sponsors insert successful with anon key!");
    await supabase.from("sponsors").delete().eq("name", "Test RLS Sponsor");
  }
}

checkStatus();
