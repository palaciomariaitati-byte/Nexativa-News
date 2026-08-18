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

async function testKeys() {
  console.log("=== DIAGNOSTIC TESTING OF AI KEYS ===");
  console.log("GROQ_API_KEY present:", !!env.GROQ_API_KEY, env.GROQ_API_KEY ? `(${env.GROQ_API_KEY.slice(0, 8)}...)` : "NONE");
  console.log("GEMINI_API_KEY present:", !!env.GEMINI_API_KEY, env.GEMINI_API_KEY ? `(${env.GEMINI_API_KEY.slice(0, 8)}...)` : "NONE");
  console.log("GEMINI_API_KEY_FALLBACK present:", !!env.GEMINI_API_KEY_FALLBACK);
  console.log("GEMINI_API_KEY_FALLBACK_2 present:", !!env.GEMINI_API_KEY_FALLBACK_2);
  console.log("GEMINI_API_KEY_TERTIARY present:", !!env.GEMINI_API_KEY_TERTIARY);

  // Test Groq
  if (env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Hola responde en 5 palabras" }]
        })
      });
      const data = await res.json();
      console.log("Groq test response:", res.status, data.choices?.[0]?.message?.content || data.error);
    } catch (e) {
      console.error("Groq test error:", e.message);
    }
  }

  // Test Gemini Keys
  const geminiKeys = [
    { name: "PRIMARY", key: env.GEMINI_API_KEY },
    { name: "FALLBACK", key: env.GEMINI_API_KEY_FALLBACK },
    { name: "FALLBACK_2", key: env.GEMINI_API_KEY_FALLBACK_2 },
    { name: "TERTIARY", key: env.GEMINI_API_KEY_TERTIARY },
  ];

  for (const item of geminiKeys) {
    if (!item.key) {
      console.log(`Gemini ${item.name}: MISSING`);
      continue;
    }
    try {
      const genAI = new GoogleGenerativeAI(item.key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hola responde en 5 palabras");
      console.log(`Gemini ${item.name} (gemini-1.5-flash): SUCCESS -> ${result.response.text().trim()}`);
    } catch (err) {
      console.error(`Gemini ${item.name} ERROR:`, err.message);
    }
  }
}

testKeys();
