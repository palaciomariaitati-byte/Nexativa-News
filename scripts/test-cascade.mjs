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

async function simulateFullFailover() {
  const candidateModels = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b"
  ];

  const prompt = "Arma una planificación de clase para secundaria sobre el cuidado del agua en Corrientes, con objetivos, secuencia didáctica (inicio, desarrollo, cierre), grilla en tabla Markdown y rúbrica.";

  console.log("Probando cascada de modelos Groq...");

  for (const model of candidateModels) {
    try {
      console.log(`Intentando modelo: ${model}...`);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "Eres NoraItu, asistente educativa de Ituzaingó, Corrientes." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2500
        })
      });

      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        console.log(`✓ ÉXITO ROTUNDO con ${model}!\n`);
        console.log("--- RESPUESTA (Primeros 400 caracteres) ---");
        console.log(data.choices[0].message.content.slice(0, 400));
        console.log("...\n[Total caracteres:", data.choices[0].message.content.length, "]");
        return;
      } else {
        console.warn(`✗ ${model} falló (Status ${res.status}):`, data.error?.message?.slice(0, 100));
      }
    } catch (e) {
      console.error(`✗ Error conectando con ${model}:`, e.message);
    }
  }
}

simulateFullFailover();
