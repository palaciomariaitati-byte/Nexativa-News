import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = { ...loadEnv('.env.local'), ...loadEnv('.env.production'), ...process.env };

async function checkArticlesTable() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://xeheuscrttrbfnojwwqt.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  console.log("Checking articles in Supabase...");
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, excerpt, category, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching articles:", error);
  } else {
    console.log(`Found ${articles?.length} articles:`);
    articles?.forEach(a => console.log(`- [${a.category || 'General'}] ${a.title} (${a.created_at || a.published_at})`));
  }
}

checkArticlesTable();
