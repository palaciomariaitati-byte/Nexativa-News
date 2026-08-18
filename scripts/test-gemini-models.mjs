import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

async function testGeminiModels() {
  const keys = [
    { name: "FALLBACK_2", key: env.GEMINI_API_KEY_FALLBACK_2 },
    { name: "TERTIARY", key: env.GEMINI_API_KEY_TERTIARY }
  ];

  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest"
  ];

  for (const k of keys) {
    if (!k.key) continue;
    console.log(`\nTesting Key: ${k.name} (${k.key.slice(0, 10)}...)`);
    const genAI = new GoogleGenerativeAI(k.key);
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent("Hola responde en 3 palabras");
        console.log(`  ✓ Model ${m}: SUCCESS -> ${res.response.text().trim()}`);
      } catch (e) {
        console.log(`  ✗ Model ${m}: FAILED -> ${e.message.slice(0, 100)}`);
      }
    }
  }
}

testGeminiModels();
