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

async function testWorkingModels() {
  const models = [
    "llama-3.1-8b-instant",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b"
  ];

  for (const m of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "user", content: "Hola responde en 3 palabras" }]
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✓ Model ${m}: SUCCESS -> ${data.choices?.[0]?.message?.content}`);
      } else {
        console.log(`✗ Model ${m}: FAILED -> ${data.error?.message?.slice(0, 100)}`);
      }
    } catch (e) {
      console.log(`✗ Model ${m}: ERROR -> ${e.message}`);
    }
  }
}

testWorkingModels();
