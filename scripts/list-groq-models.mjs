import fs from 'fs';

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

async function listGroqModels() {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { "Authorization": `Bearer ${env.GROQ_API_KEY.trim()}` }
  });
  const data = await res.json();
  console.log("Active Groq models on this account:");
  data.data?.forEach(m => console.log(`- ${m.id} (active: ${m.active})`));
}

listGroqModels();
