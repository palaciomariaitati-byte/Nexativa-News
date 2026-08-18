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

async function testNewsRAG() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://xeheuscrttrbfnojwwqt.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  console.log("Fetching live news for RAG...");
  const { data: articles, error } = await supabase
    .from("articles")
    .select("title, excerpt, content, category, created_at, external_url")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error || !articles || articles.length === 0) {
    console.error("Error fetching news:", error);
    return;
  }

  const formatted = articles.map((a, i) => 
    `[Noticia ${i + 1} - ${a.category?.toUpperCase() || 'GENERAL'} | Fecha: ${new Date(a.created_at).toLocaleDateString('es-AR')}]:\n• TÍTULO: ${a.title}\n• RESUMEN: ${a.excerpt || a.content?.slice(0, 200) || 'Sin extracto'}\n• ENLACE: ${a.external_url || 'nexativanews.com.ar'}`
  ).join("\n\n");

  console.log("=== RAG PROMPT PREVIEW ===");
  console.log(formatted);

  // Test Groq response with this RAG prompt
  const groqKey = env.GROQ_API_KEY;
  const userPrompt = "¿Cuáles son las últimas noticias de hoy?";
  const systemPrompt = `
Eres NoraItu, la IA de Nexativa News (Ituzaingó, Corrientes). Tienes acceso a noticias en vivo de 2026.
NUNCA digas que tus datos están cortados en 2024. Responde con formato periodístico profesional (Titular, Hechos clave, Contexto y Enlace).

========================================================================
📰 BASE DE CONOCIMIENTO RAG EN VIVO (NEXATIVA NEWS - 2026):
${formatted}
========================================================================
`;

  console.log("\nEnviando consulta a Groq...");
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
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  const data = await res.json();
  console.log("\n=== RESPUESTA GENERADA POR NORA CON RAG EN VIVO ===");
  console.log(data.choices?.[0]?.message?.content || data.error);
}

testNewsRAG();
