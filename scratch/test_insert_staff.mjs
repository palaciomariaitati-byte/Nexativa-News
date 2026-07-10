import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseAnonKey = "";
let supabaseServiceKey = "";

envFile.split("\n").forEach((line) => {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].trim().replace(/'/g, "").replace(/"/g, "");
  }
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    supabaseAnonKey = line.split("=")[1].trim().replace(/'/g, "").replace(/"/g, "");
  }
  if (line.startsWith("NEXT_SUPABASE_SERVICE_ROLE_KEY=")) {
    supabaseServiceKey = line.split("=")[1].trim().replace(/'/g, "").replace(/"/g, "");
  }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  console.log("--- TESTING INSERT WITH ANON CLIENT ---");
  const { data: anonData, error: anonError } = await anonClient
    .from("staff_passwords")
    .insert([{ name: "Test Anon", password: "test_anon_pass_123", role: "redactor" }]);
  
  if (anonError) {
    console.error("Anon Insert Error:", anonError);
  } else {
    console.log("Anon Insert Success!");
    await serviceClient.from("staff_passwords").delete().eq("name", "Test Anon");
  }

  console.log("\n--- TESTING INSERT WITH SERVICE ROLE CLIENT ---");
  const { data: serviceData, error: serviceError } = await serviceClient
    .from("staff_passwords")
    .insert([{ name: "Test Service", password: "test_service_pass_123", role: "redactor" }]);
  
  if (serviceError) {
    console.error("Service Insert Error:", serviceError);
  } else {
    console.log("Service Insert Success!");
    await serviceClient.from("staff_passwords").delete().eq("name", "Test Service");
  }
}

testInsert();
