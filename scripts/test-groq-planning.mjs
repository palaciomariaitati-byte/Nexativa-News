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

async function testGroqFull() {
  const prompt = "Arma una planificación de clase para secundaria sobre el cuidado del agua en Corrientes, con objetivos, secuencia didáctica (inicio, desarrollo, cierre), grilla en tabla Markdown y rúbrica.";
  console.log("Sending prompt to Groq (llama-3.3-70b-versatile)...");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GROQ_API_KEY.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Eres NoraItu, una IA educativa soberana de Ituzaingó, Corrientes." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    })
  });

  const data = await res.json();
  console.log("Status:", res.status);
  if (data.choices?.[0]?.message?.content) {
    console.log("\n=== RESPONSE PREVIEW (FIRST 500 CHARS) ===");
    console.log(data.choices[0].message.content.slice(0, 500));
    console.log("...\n[Total response length:", data.choices[0].message.content.length, "characters]");
  } else {
    console.error("Error from Groq:", data);
  }
}

testGroqFull();
