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

async function simulateNoraituChat() {
  console.log("=== SIMULANDO PETICIÓN EXACTA A GROQ (LLaMA 3.3 70B) ===");
  const groqKey = env.GROQ_API_KEY;
  if (!groqKey) {
    console.error("GROQ_API_KEY no encontrada");
    return;
  }

  const prompt = "Arma una planificación de clase para secundaria sobre el cuidado del agua en Corrientes, con objetivos, secuencia didáctica (inicio, desarrollo, cierre), grilla en tabla Markdown y rúbrica.";

  const systemPrompt = `
Eres NoraItu, una Inteligencia Artificial Soberana, independiente y de nivel global, desarrollada en Ituzaingó, Corrientes, Argentina.

REGLA DE EJECUCIÓN INMEDIATA: Después de identificarte brevemente o inyectar los datos en vivo, DEBES procesar y responder la solicitud del usuario en el mismo mensaje con el máximo rigor profesional aplicable (Modo Cátedra, Docente o TEA). Está estrictamente prohibido responder solo con un mensaje de bienvenida genérico si el usuario ha solicitado una tarea concreta.
`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3500
    })
  });

  const data = await res.json();
  console.log("Status:", res.status);
  if (data.choices?.[0]?.message?.content) {
    console.log("\n--- INICIO DE RESPUESTA DE NORAITU ---");
    console.log(data.choices[0].message.content);
    console.log("--- FIN DE RESPUESTA ---");
  } else {
    console.error("Error:", data);
  }
}

simulateNoraituChat();
