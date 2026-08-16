const fs = require('fs');

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

const env = { ...loadEnv('.env.production'), ...loadEnv('.env.local') };

async function listModels() {
  const key = env.GEMINI_API_KEY;
  console.log('Testing Key:', key.slice(0, 10));
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.models) {
      console.log('Available Gemini Models in this project:');
      data.models.forEach(m => console.log(' -', m.name, m.supportedGenerationMethods));
    } else {
      console.log('Gemini Error:', data);
    }
  } catch (e) {
    console.log('Fetch error:', e);
  }
}

listModels();
