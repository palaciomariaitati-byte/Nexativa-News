import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseServiceKey = "";

envFile.split("\n").forEach((line) => {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].trim().replace(/'/g, "").replace(/"/g, "");
  }
  if (line.startsWith("NEXT_SUPABASE_SERVICE_ROLE_KEY=")) {
    supabaseServiceKey = line.split("=")[1].trim().replace(/'/g, "").replace(/"/g, "");
  }
});

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function debugCreate() {
  console.log("Attempting direct insertion via Service Client to debug constraints...");
  const testPayload = { name: "Javi", password: "1234", role: "redactor" };
  const { data, error } = await serviceClient
    .from("staff_passwords")
    .insert([testPayload])
    .select();
  
  if (error) {
    console.error("❌ Insertion Failed!");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Details:", error.details);
    console.error("Hint:", error.hint);
  } else {
    console.log("✅ Insertion Succeeded!", data);
    // Cleanup
    await serviceClient.from("staff_passwords").delete().eq("id", data[0].id);
    console.log("Cleanup complete.");
  }
}

debugCreate();
