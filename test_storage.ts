import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xeheuscrttrbfnojwwqt.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaGV1c2NydHRyYmZub2p3d3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NzIsImV4cCI6MjA5NjI5MjU3Mn0.WgHr9a4nJznufgYtkMhy_9aA9_V5qSEYlkn-gElbvIs";

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorage() {
  console.log("Checking Storage Buckets...");
  
  // Create a dummy blob
  const dummyFile = new Blob(["test"], { type: "text/plain" });

  const { data, error } = await supabaseAnon.storage.from("uploads").upload("store/test_rls.txt", dummyFile, { upsert: true });
  
  if (error) {
    console.error("Storage upload error (anon key):", error);
  } else {
    console.log("Storage upload successful with anon key!", data);
    await supabaseAnon.storage.from("uploads").remove(["store/test_rls.txt"]);
  }
}

checkStorage();
