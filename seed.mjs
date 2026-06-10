import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";

envFile.split("\n").forEach((line) => {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].trim();
  }
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    supabaseKey = line.split("=")[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

const dummySponsors = [
  {
    name: "Sheraton Hotel (Ejemplo)",
    category: "Hotelería",
    website_url: "https://ejemplo.com",
    banner_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
  {
    name: "Boutique Resort (Ejemplo)",
    category: "Hotelería",
    website_url: "https://ejemplo.com",
    banner_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  },
  {
    name: "Patagonia Expeditions (Ejemplo)",
    category: "Turismo",
    website_url: "https://ejemplo.com",
    banner_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
  },
  {
    name: "Andes Travel (Ejemplo)",
    category: "Turismo",
    website_url: "https://ejemplo.com",
    banner_url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
  },
  {
    name: "Gourmet Steakhouse (Ejemplo)",
    category: "Gastronomía",
    website_url: "https://ejemplo.com",
    banner_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  },
  {
    name: "Café del Bosque (Ejemplo)",
    category: "Gastronomía",
    website_url: "https://ejemplo.com",
    banner_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
  },
];

async function seed() {
  console.log("Iniciando seed de sponsors...");
  const { data, error } = await supabase.from("sponsors").insert(dummySponsors);
  if (error) {
    console.error("Error al insertar:", error);
  } else {
    console.log("Sponsors insertados con éxito.");
  }
}

seed();
