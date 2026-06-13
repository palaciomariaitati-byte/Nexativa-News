import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInserts() {
  console.log("🚀 Iniciando Test de Inserción de Clientes y Mercaderías...");

  // Test de Cliente (Sponsor)
  console.log("\n1. Probando insertar un Cliente (Sponsor)...");
  const { data: sponsorData, error: sponsorError } = await supabase.from("sponsors").insert([{
    name: "Test Sponsor",
    category: "Otros"
  }]).select();

  if (sponsorError) {
    console.error("❌ Error al insertar Cliente:", sponsorError.message, sponsorError.details, sponsorError.hint);
  } else {
    console.log("✅ Cliente insertado correctamente:", sponsorData);
    // Cleanup
    await supabase.from("sponsors").delete().eq("id", sponsorData[0].id);
  }

  // Test de Mercadería (Product)
  console.log("\n2. Probando insertar una Mercadería (Product)...");
  const { data: productData, error: productError } = await supabase.from("products").insert([{
    title: "Test Product",
    price: 100,
    stock: 10
  }]).select();

  if (productError) {
    console.error("❌ Error al insertar Mercadería:", productError.message, productError.details, productError.hint);
  } else {
    console.log("✅ Mercadería insertada correctamente:", productData);
    // Cleanup
    await supabase.from("products").delete().eq("id", productData[0].id);
  }
}

testInserts();
