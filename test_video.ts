import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
const vars = Object.fromEntries(env.split("\n").filter(l => l.includes("=")).map(l => l.split("=")));

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL.trim(), vars.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim());

async function checkVideo() {
  const { data, error } = await supabase
    .from("video_queue")
    .select("*")
    .eq("status", "playing")
    .maybeSingle();
  console.log("Active video:", data);
}

checkVideo();
