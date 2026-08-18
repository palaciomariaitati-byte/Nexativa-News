import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

async function testNewsRAGInstant() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://xeheuscrttrbfnojwwqt.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  const { data: articles } = await supabase
    .from("articles")
    .select("title, excerpt, content, category, created_at, external_url")
    .order("created_at", { ascending: false })
    .limit(5);

  const formatted = articles.map((a, i) => 
    `[Noticia ${i + 1} - ${a.category?.toUpperCase() || 'GENERAL'} | ${new Date(a.created_at).toLocaleDateString('es-AR')}]:\n• Título: ${a.title}\n• Resumen: ${a.excerpt || a.content?.slice(0, 180)}\n• Enlace: ${a.external_url || 'https://nexativanews.com.ar'}`
  ).join("\n\n");

  const groqKey = env.GROQ_API_KEY;
  const userPrompt = "¿Cuáles son las últimas noticias de hoy en Ituzaingó y la región?";
  const systemPrompt = `
Eres NoraItu, Asistente Periodística Soberana de Nexativa News (Ituzaingó, Corrientes, Argentina).
Tienes acceso a la base de datos de noticias en tiempo real del portal (Agosto 2026).
NUNCA digas que tus datos están limitados a 2024. Presenta las noticias con estructura periodística impecable:
- Categoría y Fecha
- Titular y Bajada
- Hechos Clave
- Enlace al portal

========================================================================
📰 BASE DE CONOCIMIENTO DE NOTICIAS EN VIVO (NEXATIVA NEWS - 2026):
${formatted}
========================================================================
`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })
  });

  const data = await res.json();
  console.log("\n=== RESPUESTA GENERADA POR NORA (LLaMA 3.1 8B Instant) ===");
  console.log(data.choices?.[0]?.message?.content || data.error);
}

testNewsRAGInstant();
