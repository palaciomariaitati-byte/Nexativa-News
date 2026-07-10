import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";

envFile.split("\n").forEach((line) => {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].trim().replace(/'/g, "").replace(/"/g, "");
  }
  if (line.startsWith("NEXT_SUPABASE_SERVICE_ROLE_KEY=")) {
    supabaseKey = line.split("=")[1].trim().replace(/'/g, "").replace(/"/g, "");
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStaff() {
  console.log("Fetching staff keys...");
  const { data, error } = await supabase.from("staff_passwords").select("*");
  if (error) {
    console.error("Error reading staff_passwords:", error);
  } else {
    console.log("Current keys in database:");
    data.forEach(row => {
      console.log(`- ID: ${row.id}, Name: ${row.name}, Role: ${row.role}, Password: ${row.password}`);
    });
  }
}

checkStaff();
