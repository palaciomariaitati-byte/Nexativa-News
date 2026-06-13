import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xeheuscrttrbfnojwwqt.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaGV1c2NydHRyYmZub2p3d3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NzIsImV4cCI6MjA5NjI5MjU3Mn0.WgHr9a4nJznufgYtkMhy_9aA9_V5qSEYlkn-gElbvIs";

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function checkSettings() {
  console.log("Checking settings table...");
  const { data, error } = await supabaseAnon.from("settings").select("*").limit(1);
  if (error) {
    console.error("Error reading settings table:", error);
  } else {
    console.log("Settings table exists and is readable. Rows:", data.length);
  }

  const { error: insertError } = await supabaseAnon.from("settings").upsert([{ key: "test", value: "test" }], { onConflict: "key" });
  if (insertError) {
    console.error("Error inserting into settings table:", insertError);
  } else {
    console.log("Settings insert successful!");
    await supabaseAnon.from("settings").delete().eq("key", "test");
  }
}

checkSettings();
