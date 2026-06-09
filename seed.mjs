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
    name: "Hotel El Descanso (Ejemplo)",
    category: "Hotelería",
    website_url: "https://ejemplo.com",
  },
  {
    name: "Turismo Aventura (Ejemplo)",
    category: "Turismo",
    website_url: "https://ejemplo.com",
  },
  {
    name: "Restaurante La Casona (Ejemplo)",
    category: "Gastronomía",
    website_url: "https://ejemplo.com",
  },
  {
    name: "Estudio Contable (Ejemplo)",
    category: "Servicios",
    website_url: "https://ejemplo.com",
  },
  {
    name: "Ferretería Central (Ejemplo)",
    category: "Otros",
    website_url: "https://ejemplo.com",
  }
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
