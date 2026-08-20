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

async function testWorkingModels() {
  const key = env.GEMINI_API_KEY_FALLBACK_2 || env.GEMINI_API_KEY_TERTIARY;
  console.log("Using key:", key?.slice(0, 10) + "...");
  const genAI = new GoogleGenerativeAI(key);

  const testModels = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-pro"
  ];

  for (const m of testModels) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Hola, responde 'OK' si me escuchas.");
      console.log(`✓ Model ${m}: SUCCESS ->`, res.response.text().trim());
    } catch (e) {
      console.log(`✗ Model ${m}: FAILED ->`, e.message);
    }
  }
}

testWorkingModels();
