const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const k = trimmed.slice(0, idx).trim();
      let v = trimmed.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[k] = v;
    }
  }
  return env;
}

const envLocal = loadEnv('.env.local');
const envProd = loadEnv('.env.production');
const env = { ...envProd, ...envLocal };

async function test() {
  const keys = [
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_FALLBACK,
    env.GEMINI_API_KEY_FALLBACK_2,
    env.GEMINI_API_KEY_TERTIARY
  ].filter(Boolean);
  
  console.log('Gemini Keys count:', keys.length);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    console.log('Key', i, k.slice(0, 8) + '...');
    const genAI = new GoogleGenerativeAI(k);
    for (const m of ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent('Di Hola en una palabra');
        console.log('  SUCCESS', m, res.response.text().trim());
        break;
      } catch (e) {
        console.log('  FAIL', m, e.message);
      }
    }
  }

  const groqKey = env.GROQ_API_KEY;
  console.log('Groq Key exists:', !!groqKey);
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: 'Bearer ' + groqKey }
      });
      if (res.ok) {
        const data = await res.json();
        const models = data.data.map(x => x.id);
        console.log('Groq available models:', models);
      } else {
        console.log('Groq models HTTP error:', res.status, await res.text());
      }
    } catch(e) {
      console.log('Groq fetch error:', e.message);
    }
  }
}
test();
