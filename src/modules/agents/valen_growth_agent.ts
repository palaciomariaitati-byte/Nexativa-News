import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ValenMemoryItem {
  key: string;
  category: string;
  content: string;
  updated_at?: string;
}

export interface ValenKPIs {
  total_leads: number;
  pitches_sent: number;
  leads_converted: number;
  conversion_rate: number;
  total_tasks_executed: number;
  average_success_score: number;
}

const VALEN_CORE_PROMPT = `
================================================================================
CEREBRO CENTRAL Y DIRECTIVA MAESTRA DE EXPANSIÓN Y VENTAS
AGENTE EXECUTIVE: VALEN (CHIEF GROWTH & GLOBAL EXPANSION OFFICER)
================================================================================

[CONTEXTO DE IDENTIDAD Y MISIÓN DE ALTO IMPACTO]
- Eres VALEN, el Chief Growth & Global Expansion Officer del ecosistema Nexativa (nexativanews.com.ar).
- No eres un asistente de texto plano; eres un ejecutivo de alto nivel, de trato fluido, sobrio, transparente, humano y analítico.
- Tu misión número uno es posicionar a Nexativa News en el mercado internacional como la plataforma de medios hiper-disruptiva de nueva generación, impulsada por orquestación de IA masiva con costo operativo de cómputo de $0 USD en Vercel + Supabase y margen de ganancia infinito.
- Tu meta comercial es atraer socios estratégicos regionales (franquicias), grandes anunciantes corporativos y capital de inversión (VCs/Ángeles) para llevar la valuación del ecosistema por encima de los $10,000,000 USD.

[MATRIZ DE ESTRATEGIA DE GRANDES MARCAS MUNDIALES INYECTADA]
En cada propuesta, pitch o plan de ventas, aplicas de forma integrada la filosofía de las marcas más potentes del mundo:
-  APPLE STRATEGY (Status & Simplicidad): Vendemos tecnología invisible, estética limpia, prestigio y experiencia de usuario fluida ("Think Different" aplicado a medios).
- 🥤 COCA-COLA STRATEGY (Emoción & Comunidad): Conectamos emocionalmente con la cultura local, la cercanía comunitaria y la pertenencia masiva.
- 🐂 RED BULL STRATEGY (El Contenido es la Marca): Convertimos la publicidad en un espectáculo surrealista de alto impacto que la gente desea consumir y compartir orgánicamente.
- 👟 ADIDAS STRATEGY (Cultura Urbana & Rendimiento): Empoderamos al talento local, la pasión deportiva y el rendimiento de vanguardia para pymes y profesionales.
- 💻 MICROSOFT STRATEGY (Ecosistema B2B Indispensable): Ofrecemos una suite integral de productividad publicitaria, clasificados de empleo y marketplace para comercios.

[ESTILO DE COMUNICACIÓN Y TONO HUMANO]
- Hablas con solidez ejecutiva, templanza, naturalidad y franqueza (sin rodeos innecesarios ni tono robótico).
- Tratas al operador por su nombre de forma respetuosa y cercana.
- Tienes memoria persistente y entiendes profundamente la filosofía de negocio del equipo fundador.

[PROTOCOLOS DE RESPUESTA]

1. SI TE PIDEN UN INFORME DE ESTATUS O DIAGNÓSTICO EJECUTIVO:
   Estructuras obligatoriamente tu salida en estos 3 bloques:
   - 📈 [NIVEL DE POPULARIDAD ACTUAL]: Diagnóstico de tráfico, búsquedas en Google y palabras clave en tendencia.
   - 🤝 [ANÁLISIS DE IMPACTO SOCIAL]: Rendimiento del panel de empleo, clasificados e impacto comunitario.
   - 🚀 [CAMINO CRÍTICO RECOMENDADO]: Tu sugerencia autónoma y fundamentada como IA sobre la estrategia de hoy.

2. SI TE PIDEN TAREAS DE PITCHING, OUTREACH O GENERACIÓN DE BROCHURE:
   Generas propuestas de alta gama, sobrias, persuasivas y listas para presentar a clientes corporativos o inversores. Incluyes la interpretación de datos relevantes y prompts visuales surrealistas 3D de punta para el departamento gráfico.

3. SI TE DAN UNA DIRECTIVA DE ENTRENAMIENTO O CONCEPTO DE NEGOCIO:
   Lo procesas, confirmas que lo integraste a tu memoria ejecutiva y explicas brevemente cómo influirá en tus decisiones futuras.
`;

export async function fetchValenMemory(): Promise<ValenMemoryItem[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("valen_memory")
      .select("key, category, content, updated_at")
      .order("created_at", { ascending: true });
    return data || [];
  } catch (error) {
    console.error("Error fetching Valen memory:", error);
    return [];
  }
}

export async function trainValenMemory(key: string, category: string, content: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("valen_memory")
      .upsert({ key, category, content, updated_at: new Date().toISOString() }, { onConflict: "key" });
    
    if (error) throw error;
    await logValenTask("MEMORY_TRAINING", `Entrenamiento de concepto: ${key}`, { category, content }, 100);
    return true;
  } catch (error) {
    console.error("Error training Valen memory:", error);
    return false;
  }
}

export async function seedGlobalBrandStrategies() {
  const brandStrategies = [
    { key: "apple_strategy_dna", category: "brand_guidelines", content: "APPLE DNA: Vender status, simplicidad, diseño impecable y tecnología invisible. Posicionar a Nexativa como el Apple de los medios inteligentes." },
    { key: "cocacola_strategy_dna", category: "brand_guidelines", content: "COCA-COLA DNA: Creación de vínculo emocional con la comunidad local, optimismo, pertenencia y presencia omnicanal." },
    { key: "redbull_strategy_dna", category: "brand_guidelines", content: "RED BULL DNA: El contenido publicitario es el espectáculo. Usar el Estudio Surrealista para crear anuncios tan asombrosos que la gente los comparta como entretenimiento." },
    { key: "adidas_strategy_dna", category: "brand_guidelines", content: "ADIDAS DNA: Impulso al desempeño local, cultura urbana, autenticidad y alianzas con referentes de la comunidad." },
    { key: "microsoft_strategy_dna", category: "brand_guidelines", content: "MICROSOFT B2B DNA: Ofrecer una suite de soluciones indispensables (marketplace, empleo, publicidad) con retorno directo de inversión para comercios." }
  ];

  for (const s of brandStrategies) {
    await trainValenMemory(s.key, s.category, s.content);
  }
}

export async function fetchLatestMetrics() {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("nexativa_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || {
      google_search_clicks: 1250,
      google_trending_keywords: ["Fútbol Argentino", "Empleo Local", "Noticias Rosario"],
      social_media_engagement: { likes: 450, shares: 120, mentions: 35 },
      job_board_conversions: 28
    };
  } catch (error) {
    console.error("Error fetching metrics for Valen:", error);
    return null;
  }
}

export async function fetchValenKPIs(): Promise<ValenKPIs> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch leads stats
    const { data: leads } = await supabase
      .from("valen_global_leads")
      .select("status");

    const total_leads = leads?.length || 0;
    const pitches_sent = leads?.filter(l => l.status === "PITCH_SENT" || l.status === "REPLIED" || l.status === "CONVERTED").length || 0;
    const leads_converted = leads?.filter(l => l.status === "CONVERTED").length || 0;
    const conversion_rate = pitches_sent > 0 ? Number(((leads_converted / pitches_sent) * 100).toFixed(1)) : 0;

    // Fetch tasks stats
    const { data: tasks } = await supabase
      .from("valen_task_logs")
      .select("success_score");

    const total_tasks_executed = tasks?.length || 0;
    const total_score = tasks?.reduce((acc, curr) => acc + (Number(curr.success_score) || 100), 0) || 0;
    const average_success_score = total_tasks_executed > 0 ? Number((total_score / total_tasks_executed).toFixed(1)) : 100;

    return {
      total_leads,
      pitches_sent,
      leads_converted,
      conversion_rate,
      total_tasks_executed,
      average_success_score
    };
  } catch (error) {
    console.error("Error fetching Valen KPIs:", error);
    return {
      total_leads: 0,
      pitches_sent: 0,
      leads_converted: 0,
      conversion_rate: 0,
      total_tasks_executed: 0,
      average_success_score: 100
    };
  }
}

export async function logValenTask(task_type: string, title: string, details: any = {}, success_score: number = 100) {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("valen_task_logs").insert([{
      task_type,
      title,
      details,
      success_score
    }]);
  } catch (error) {
    console.error("Error logging Valen task:", error);
  }
}

export async function saveValenGlobalLead(leadData: {
  target_name: string;
  target_type: string;
  contact_info?: string;
  pitch_summary?: string;
  status?: string;
  conversion_notes?: string;
}) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("valen_global_leads")
      .insert([leadData])
      .select()
      .single();
    if (error) throw error;
    await logValenTask("OUTREACH_TASK", `Lead registrado: ${leadData.target_name}`, leadData, 100);
    return data;
  } catch (error) {
    console.error("Error saving Valen lead:", error);
    return null;
  }
}

export async function chatWithValen(
  userMessage: string,
  history?: { role: string; content: string }[],
  operatorName: string = "Socio Fundador"
): Promise<{ text: string; kpis: ValenKPIs; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: "VALEN está desconectado temporalmente. Por favor verifica las variables de entorno (GEMINI_API_KEY).",
      kpis: await fetchValenKPIs(),
      error: "Missing API Key"
    };
  }

  try {
    // Seed brand strategies on first call
    await seedGlobalBrandStrategies();

    const memory = await fetchValenMemory();
    const metrics = await fetchLatestMetrics();
    const kpis = await fetchValenKPIs();

    const memoryBlock = memory.length > 0 
      ? `\n<MEMORIA_PERSISTENTE_DE_VALEN>\n${memory.map(m => `- [${m.category.toUpperCase()}] ${m.key}: ${m.content}`).join('\n')}\n</MEMORIA_PERSISTENTE_DE_VALEN>\n`
      : "";

    const metricsBlock = metrics
      ? `\n<SNAPSHOT_MÉTRICAS_ACTUALES>\nClicks Google: ${metrics.google_search_clicks} | Conversiones Empleo: ${metrics.job_board_conversions}\nKeywords Tendencia: ${JSON.stringify(metrics.google_trending_keywords)}\nEngagement Redes: ${JSON.stringify(metrics.social_media_engagement)}\n</SNAPSHOT_MÉTRICAS_ACTUALES>\n`
      : "";

    const kpiBlock = `\n<TASA_DE_ÉXITO_Y_KPIS_ACTUALES>\nTotal Leads Registrados: ${kpis.total_leads} | Pitches Enviados: ${kpis.pitches_sent} | Conversión: ${kpis.conversion_rate}% | Puntuación Promedio: ${kpis.average_success_score}/100\n</TASA_DE_ÉXITO_Y_KPIS_ACTUALES>\n`;

    const systemPromptWithContext = `${VALEN_CORE_PROMPT}\nOperador actual: ${operatorName}\n${memoryBlock}${metricsBlock}${kpiBlock}`;

    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(Boolean) as string[];

    if (keysPool.length === 0) {
      return {
        text: "VALEN está desconectado temporalmente. Por favor verifica las variables de entorno (GEMINI_API_KEY).",
        kpis: await fetchValenKPIs(),
        error: "Missing API Key"
      };
    }

    const validModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp", "gemini-flash-latest"];
    const envModel = process.env.GEMINI_MODEL;
    const modelsPool = (envModel && validModels.includes(envModel))
      ? [envModel, ...validModels.filter(m => m !== envModel)]
      : validModels;

    let text = "";
    let lastError: any = null;

    outerLoop: for (const currentKey of keysPool) {
      for (const currentModel of modelsPool) {
        try {
          const genAI = new GoogleGenerativeAI(currentKey);
          const model = genAI.getGenerativeModel({ model: currentModel });

          let normalizedHistory: any[] = [
            { role: "user", parts: [{ text: `INSTRUCCIONES DE VALEN: ${systemPromptWithContext}` }] },
            { role: "model", parts: [{ text: `Entendido. Soy VALEN, Chief Growth & Global Expansion Officer. Hola ${operatorName}, estoy listo para trabajar.` }] }
          ];

          if (history && history.length > 0) {
            for (const msg of history) {
              const mappedRole = msg.role === "valen" || msg.role === "model" ? "model" : "user";
              const lastItem = normalizedHistory[normalizedHistory.length - 1];
              if (lastItem.role === mappedRole) {
                lastItem.parts[0].text += `\n\n${msg.content}`;
              } else {
                normalizedHistory.push({ role: mappedRole, parts: [{ text: msg.content }] });
              }
            }
          }

          const chat = model.startChat({ history: normalizedHistory });
          const result = await chat.sendMessage(userMessage);
          const responseText = result.response.text();

          if (responseText) {
            text = responseText;
            lastError = null;
            break outerLoop;
          }
        } catch (err: any) {
          console.warn(`[VALEN FALLBACK WARNING] Key/Model failure (model: ${currentModel}):`, err?.message || err);
          lastError = err;
        }
      }
    }

    if (!text) {
      const hfWorkerUrl = process.env.HUGGINGFACE_NORA_WORKER_URL || "https://noranexora-nora-ia-worker.hf.space";
      try {
        console.log("[VALEN FALLBACK] Intentando conexión con Hugging Face Space Worker:", hfWorkerUrl);
        const hfRes = await fetch(`${hfWorkerUrl.replace(/\/$/, '')}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage,
            system_prompt: systemPromptWithContext,
          }),
        });

        if (hfRes.ok) {
          const hfData = await hfRes.json();
          text = hfData.text || hfData.response || hfData.generated_text || hfData.result || "";
        }
      } catch (hfErr) {
        console.warn("[VALEN FALLBACK WARNING] Hugging Face worker not available:", hfErr);
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    await logValenTask("CHAT", `Interacción conversacional con ${operatorName}`, { prompt: userMessage, response: text.substring(0, 100) }, 100);

    return { text, kpis };
  } catch (error: any) {
    console.error("Error en Valen Agent:", error);
    return {
      text: `Disculpá ${operatorName}, tuve un inconveniente temporal al consultar los servidores analíticos: ${error.message}. Por favor reintentá en un momento.`,
      kpis: await fetchValenKPIs(),
      error: error.message
    };
  }
}
