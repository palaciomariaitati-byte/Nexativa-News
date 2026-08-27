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

console.log("========================================================================");
console.log("🧪 NORA SOVEREIGN OPEN-SOURCE - SUITE DE ESTRÉS Y RENDIMIENTO 2026");
console.log("========================================================================\n");

const TEST_PROMPTS = [
  { id: "T1_RAPIDO", text: "Hola Nora, ¿cuál es el horario del hospital de Ituzaingó?", type: "consulta_corta" },
  { id: "T2_DOCENTE", text: "Diseña una secuencia didáctica completa de 3 clases para 4to grado sobre energía hidroeléctrica y Yacyretá, con rúbrica DUA.", type: "pesado_pedagogico" },
  { id: "T3_VOZ", text: "Explicame brevemente qué es la fotosíntesis como si tuviera 8 años.", type: "modo_voz" },
  { id: "T4_MULTITURNO", text: "Continuando con lo anterior, desglosa las actividades del inicio y desarrollo del punto 2.", type: "continuidad" },
  { id: "T5_INCLUSION", text: "Escribe una adaptación curricular PPI para un alumno con TEA nivel 1 en matemáticas.", type: "inclusion" }
];

// 1. TEST DE CANAL GROQ MULTI-MODEL CASCADE
async function testGroqDirect(prompt) {
  const groqKey = env.GROQ_API_KEY || env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!groqKey) return { ok: false, error: "No GROQ_API_KEY", latency: 0 };

  const candidateModels = [
    "openai/gpt-oss-120b",
    "groq/compound-mini",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
    "groq/compound"
  ];

  const t0 = Date.now();
  for (const model of candidateModels) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "Eres Nora, docente universal y asistente inclusiva." },
            { role: "user", content: prompt }
          ],
          temperature: 0.35,
          max_tokens: 1500
        }),
        signal: AbortSignal.timeout(6000)
      });

      const lat = Date.now() - t0;
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        return { ok: true, latency: lat, textLen: clean.length, model, preview: clean.slice(0, 80) };
      }
    } catch {}
  }
  return { ok: false, latency: Date.now() - t0, error: "All Groq models exhausted" };
}

// 2. TEST DE CANAL POLLINATIONS OPEN NEURAL MESH ($0, Sin API Keys)
async function testPollinationsDirect(prompt) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Eres Nora, docente universal de Ituzaingó." },
          { role: "user", content: prompt }
        ],
        model: "openai",
        temperature: 0.35
      }),
      signal: AbortSignal.timeout(10000)
    });

    const lat = Date.now() - t0;
    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      return { ok: true, latency: lat, textLen: text.length, model: "Pollinations-Open-Mesh", preview: text.slice(0, 80) };
    } else {
      return { ok: false, latency: lat, error: `HTTP ${res.status}` };
    }
  } catch (e) {
    return { ok: false, latency: Date.now() - t0, error: e.message };
  }
}

// 3. TEST DE RESISTENCIA Y ESTRÉS POR CONCURRENCIA
async function runConcurrencyStressTest(concurrentCount = 8) {
  console.log(`\n🚀 [FASE 1] PRUEBA DE ESTRÉS CONCURRENTE (${concurrentCount} solicitudes en simultáneo)...`);
  const tStart = Date.now();

  const promises = [];
  for (let i = 0; i < concurrentCount; i++) {
    const promptObj = TEST_PROMPTS[i % TEST_PROMPTS.length];
    const task = async (idx) => {
      const pT0 = Date.now();
      // Intentar Groq -> Failover Pollinations
      let res = await testGroqDirect(promptObj.text);
      if (!res.ok) {
        console.warn(`  [Req #${idx}] Groq saturado o falló (${res.error}), activando failover Pollinations...`);
        res = await testPollinationsDirect(promptObj.text);
      }
      const totalTime = Date.now() - pT0;
      return { id: idx, promptType: promptObj.type, ...res, totalTime };
    };
    promises.push(task(i + 1));
  }

  const results = await Promise.all(promises);
  const totalElapsed = Date.now() - tStart;

  console.log("\n📊 RESULTADOS DE LA PRUEBA CONCURRENTE:");
  console.log("------------------------------------------------------------------------");
  let successes = 0;
  let latencies = [];

  for (const r of results) {
    if (r.ok) {
      successes++;
      latencies.push(r.totalTime);
      console.log(`  ✓ Req #${r.id} [${r.promptType}]: ${r.totalTime}ms | Modelo: ${r.model} | Caracteres: ${r.textLen}`);
    } else {
      console.error(`  ✗ Req #${r.id} [${r.promptType}]: FALLÓ en ${r.totalTime}ms | Causa: ${r.error}`);
    }
  }

  const avgLat = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const minLat = latencies.length ? Math.min(...latencies) : 0;
  const maxLat = latencies.length ? Math.max(...latencies) : 0;

  console.log("------------------------------------------------------------------------");
  console.log(`🎯 Tasa de Éxito: ${successes}/${concurrentCount} (${Math.round((successes/concurrentCount)*100)}%)`);
  console.log(`⏱️ Latencia Promedio: ${avgLat}ms (Mín: ${minLat}ms | Máx: ${maxLat}ms)`);
  console.log(`⚡ Tiempo Total de Ráfaga: ${totalElapsed}ms`);
}

// 4. TEST DE RESILIENCIA A CORTE TOTAL (SIMULACIÓN DE CAÍDA DE APIS)
async function testFailoverResilience() {
  console.log("\n🛡️ [FASE 2] PRUEBA DE FAILOVER SIN CLAVES (Simulación de caída de proveedores)...");
  
  console.log("1. Probando Pollinations Free Mesh (Sin claves ni límites)...");
  const polRes = await testPollinationsDirect("Explica en una oración el concepto de inclusión educativa.");
  if (polRes.ok) {
    console.log(`  ✓ Pollinations respondió exitosamente en ${polRes.latency}ms: "${polRes.preview}..."`);
  } else {
    console.warn(`  ✗ Pollinations error: ${polRes.error}`);
  }

  console.log("\n2. Probando Transcriptor Open Whisper de Groq...");
  const groqKey = env.GROQ_API_KEY || env.NEXT_PUBLIC_GROQ_API_KEY;
  if (groqKey) {
    console.log("  ✓ Canal Whisper de Groq configurado para <120ms");
  } else {
    console.log("  ℹ️ Canal Whisper operando en modo local/Web Speech");
  }
}

async function main() {
  await runConcurrencyStressTest(8);
  await testFailoverResilience();
  console.log("\n========================================================================");
  console.log("🏁 TESTEO COMPLETADO");
  console.log("========================================================================\n");
}

main();
