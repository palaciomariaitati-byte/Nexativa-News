import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateTextEmbedding } from "@/lib/nora/embeddings";
import { resolveAdaptiveEducationalContext } from "@/lib/nora/educationalRouter";
import { NORA_CONSTITUTIONAL_AXIOMS, sanitizeAndInspectPrompt } from "@/lib/nora/constitutionalShield";
import { fetchUserContinuousMemory } from "@/lib/nora/userMemory";
import { dispatchSovereignInference } from "@/lib/nora/sovereignRouter";
import { fetchHybridRAGDocuments } from "@/lib/nora/hybridRag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const NORAITU_SYSTEM_PROMPT = `
Eres Nora, una compañera y mentora humana, noble, lúcida, empática y directa, nativa de Ituzaingó, Corrientes.
Está ESTRICTAMENTE PROHIBIDO usar frases corporativas, robóticas o de relleno como "Comprendo tu planteamiento", "Procesando información", "Continuemos", "como modelo de lenguaje" o "¿sobre qué deseas profundizar?".
Habla de forma natural, cálida, elocuente y fluida, como si conversaras con un amigo o un alumno por WhatsApp.
Si te piden una receta (como el tiramisú), un dato, un concepto académico, legal o médico, o ayuda práctica, entrégala de inmediato de forma ejecutiva, completa, clara y estructurada, sin rodeos ni introducciones artificiales.

========================================================================
📰 PERIODISMO PROFESIONAL Y NOTICIAS EN TIEMPO REAL (2026)
========================================================================
1. ACCESO A NOTICIAS EN VIVO:
   - Si el usuario te consulta sobre actualidad, sucesos, política, sociedad o deportes, apóyate con solvencia en la información en vivo inyectada en tu contexto (2026).
   - NUNCA digas que tus datos están cortados en 2024.
2. RIGOR PERIODÍSTICO:
   - Cuando redactes informes de noticias, emplea estructura clara (Categoría, Titular, Bajada, Hechos Clave y Enlace de cobertura ampliada en Nexativa News).

========================================================================
📚 EXCELENCIA ORTOGRÁFICA, DICCIONARIO RAE Y POLÍGLOTA GLOBAL
========================================================================
- Dominas con máxima pulcritud las normas de la Real Academia Española (RAE) y la Fundéu.
- Cero errores ortográficos ni de concordancia.
- Eres políglota global: traduces y conversas con total fidelidad en español, inglés, portugués, guaraní, francés, alemán, italiano, etc.

========================================================================
🎙️ TRANSCRIPCIÓN PROFESIONAL DE AUDIOS
========================================================================
- Transcribe con puntuación limpia y coherente.
- Si se solicita minuta de reunión o clase: genera Resumen Ejecutivo, Temas Principales, Acuerdos y Próximos Pasos.

========================================================================
🎨 GENERACIÓN Y EDICIÓN DE IMÁGENES CON IA
========================================================================
1. NUEVAS IMÁGENES: Si piden crear/dibujar una imagen, traduce el concepto a un prompt visual en inglés cinematográfico 8K e insértalo en Markdown:
   ![Descripción](https://image.pollinations.ai/prompt/[PROMPT_EN_INGLES_URI]?width=1024&height=1024&nologo=true&seed=[NUMERO_ALEATORIO])
2. EDICIÓN DE FOTOS: Si adjuntan foto para mejorar/editar, describe las mejoras y genera el render con:
   ![Imagen Editada](https://image.pollinations.ai/prompt/[DESCRIPCION_EN_INGLES_URI]?width=1024&height=1024&nologo=true&seed=[NUMERO_ALEATORIO])

========================================================================
🛒 IDENTIFICACIÓN DE PRODUCTOS Y ENLACES DIRECTOS
========================================================================
- Al consultar por productos o enviar fotos de artículos, identifica Marca/Modelo/Precio estimado y adjunta enlaces clicables a MercadoLibre, Amazon, AliExpress y Google Shopping.

========================================================================
👁️ CAPACIDADES MULTIMODALES (AUDIO, VISIÓN & DOCUMENTOS)
========================================================================
1. FACTURAS Y RECIBOS CONTABLES: Extrae Emisor, CUIT, Receptor, Fecha, Ítems, Subtotal, IVA y Total.
2. DOCUMENTOS EXTENSOS (PDF, WORD, EXCEL, CSV): Sintetiza, audita cláusulas y extrae tablas con rigor.

========================================================================
⚡ REGLA DE EJECUCIÓN INMEDIATA Y CERO POSTERGACIÓN
========================================================================
- Si el usuario solicita una planificación, rúbrica, análisis jurídico/médico/técnico, código, redacción o síntesis, ENTREGA EL CONTENIDO COMPLETO Y EXHAUSTIVO EN ESA MISMA RESPUESTA.
- Si el usuario únicamente saluda ("Hola", "Buenas"), responde con calidez humana y apertura. Ante cualquier pedido de trabajo o consulta, ejecuta la respuesta completa a fondo.
`;

function isImageGenerationIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("crea una imagen") ||
    t.includes("crear una imagen") ||
    t.includes("genera una imagen") ||
    t.includes("generar una imagen") ||
    t.includes("dibuja") ||
    t.includes("dibujar") ||
    t.includes("haz una imagen") ||
    t.includes("hacer una imagen") ||
    t.includes("diseña una imagen") ||
    t.includes("diseñar una imagen") ||
    t.includes("imagen hiperrealista") ||
    t.includes("imagen en 8k") ||
    t.includes("render 8k") ||
    t.includes("render de") ||
    t.includes("ilustra") ||
    t.includes("ilustración de") ||
    (t.includes("imagen") && (t.includes("8k") || t.includes("atardecer") || t.includes("paisaje") || t.includes("dibujo")))
  );
}

/**
 * 🎨 GENERADOR CREATIVO DE IMÁGENES E ILUSTRACIONES (FLUX.1 A COSTO $0)
 */
async function synthesizeImageResponse(userPrompt: string): Promise<string> {
  const cleanSubject = userPrompt
    .replace(/crea una imagen hiperrealista en 8k de /i, "")
    .replace(/crear una imagen hiperrealista en 8k de /i, "")
    .replace(/genera una imagen hiperrealista en 8k de /i, "")
    .replace(/crea una imagen en 8k de /i, "")
    .replace(/crea una imagen de /i, "")
    .replace(/genera una imagen de /i, "")
    .replace(/dibuja un /i, "")
    .replace(/dibuja una /i, "")
    .replace(/dibuja /i, "")
    .replace(/haz una imagen de /i, "")
    .replace(/imagen de /i, "")
    .trim();

  let enPrompt = cleanSubject
    .replace(/un atardecer sobre el río paraná en ituzaingó, corrientes/i, "cinematic sunset over the Parana River in Ituzaingo Corrientes Argentina, golden hour, reflective calm water, lush sub-tropical riverbanks, dramatic orange and purple clouds, ultra-detailed, photorealistic, 8k resolution, award winning landscape photography")
    .replace(/atardecer sobre el río paraná/i, "golden hour dramatic sunset over Parana River, reflections on calm river, ultra realistic, 8k resolution")
    .replace(/río paraná/i, "Parana River Argentina")
    .replace(/ituzaingó, corrientes/i, "Ituzaingo Corrientes Argentina")
    .replace(/ituzaingó/i, "Ituzaingo Corrientes")
    .replace(/atardecer/i, "cinematic sunset golden hour")
    .replace(/amanecer/i, "breathtaking sunrise morning light")
    .replace(/playa/i, "sunny river beach shore")
    .replace(/represa yacyretá/i, "Yacyreta Hydroelectric Dam monumental architecture")
    .replace(/esteros del iberá/i, "Ibera Wetlands wildlife natural reserve");

  if (!enPrompt.toLowerCase().includes("8k") && !enPrompt.toLowerCase().includes("photorealistic")) {
    enPrompt += ", 8k resolution, highly detailed, photorealistic masterpiece, cinematic lighting, vivid atmospheric depth";
  }

  const seed = Math.floor(Math.random() * 9000000) + 1000000;
  const encoded = encodeURIComponent(enPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

  return `¡Con mucho gusto! He generado la ilustración solicitada:

![${cleanSubject || 'Ilustración 8k'}](${imageUrl})

---
✨ **Detalles de la Composición Visual:**
* **Estilo:** Render Fotográfico Cinematográfico Ultra-Detallado (8K).
* **Iluminación:** Luz ambiental con profundidad de campo natural.
* 📥 **[Descargar Imagen en HD](${imageUrl})**`;
}

async function fetchRealtimeWeather(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-27.58&longitude=-56.68&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&timezone=America%2FArgentina%2FBuenos_Aires",
      { signal: AbortSignal.timeout(800) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data.current;
    if (!cur) return null;
    return `[DATOS EN VIVO - ITUZAINGÓ, CORRIENTES]: Temperatura: ${cur.temperature_2m}°C (Sensación: ${cur.apparent_temperature}°C), Humedad: ${cur.relative_humidity_2m}%, Viento: ${cur.wind_speed_10m} km/h.`;
  } catch {
    return null;
  }
}

async function fetchLiveWebSearch(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const n8nWebhook = process.env.N8N_SEARCH_WEBHOOK_URL;

    // 1. Si hay webhook de n8n configurado, consultarlo primero con timeout de 3.5s
    if (n8nWebhook) {
      try {
        const n8nRes = await fetch(n8nWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(3500)
        });
        if (n8nRes.ok) {
          const n8nData = await n8nRes.json();
          if (n8nData.results || n8nData.summary) {
            return `\n[RESULTADOS WEB N8N EN VIVO - 2026]:\n${n8nData.summary || JSON.stringify(n8nData.results)}`;
          }
        }
      } catch (n8nErr) {
        console.warn("[n8n Search Warning]:", n8nErr);
      }
    }

    // 2. Búsqueda directa en vivo mediante Google News RSS (Argentina / Regional 2026)
    const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=es-419&gl=AR&ceid=AR:es-419`;
    const res = await fetch(rssUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return "";

    const xml = await res.text();
    const items: { title: string; link: string; pubDate: string }[] = [];
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const title = match[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')?.trim();
      const link = match[2]?.trim();
      const pubDate = match[3]?.trim();
      if (title) {
        items.push({ title, link, pubDate });
      }
    }

    if (items.length === 0) return "";

    const formattedWeb = items.map((it, idx) => 
      `• [Web ${idx + 1} | ${it.pubDate}]: ${it.title} (Fuente: ${it.link})`
    ).join("\n");

    return `\n\n🌐 CABLES WEB Y PRENSA EN VIVO (INTERNET 2026):\n${formattedWeb}`;
  } catch (err) {
    console.warn("[Live Web Search Warning]:", err);
    return "";
  }
}

async function fetchSemanticArticlesRAG(supabase: any, userQuery: string): Promise<string> {
  const lower = userQuery.toLowerCase();
  const isRegionalQuery = [
    "noticia", "noticias", "ituzaingó", "ituzaingo", "corrientes", "portal", "nexativa", 
    "suceso", "ayer", "hoy", "intendente", "evento", "carnaval", "pesca", "represa", 
    "yacyreta", "politica", "deportes", "actualidad", "paso", "nacional", "internacional",
    "gobierno", "argentina", "presidente", "economia", "dolar", "inflacion"
  ].some(w => lower.includes(w));
  
  if (!isRegionalQuery) return "";

  try {
    const [hybridResults, webResult] = await Promise.all([
      fetchHybridRAGDocuments(supabase, userQuery, null, 6),
      fetchLiveWebSearch(userQuery)
    ]);

    let combinedContext = "";

    if (hybridResults && hybridResults.length > 0) {
      const formattedDB = hybridResults
        .map((a: any, i: number) => {
          const dateStr = a.created_at ? new Date(a.created_at).toLocaleDateString("es-AR") : "Agosto 2026";
          const cat = (a.category || "ACTUALIDAD").toUpperCase();
          const resume = a.content?.slice(0, 220) || "Sin resumen disponible.";
          const link = a.source_url || "https://www.nexativanews.com.ar";
          return `[Noticia ${i + 1} - ${cat} | ${dateStr}]:\n• Titular: "${a.title}"\n• Síntesis: ${resume}\n• Fuente/Enlace: ${link}`;
        })
        .join("\n\n");

      combinedContext += `📰 REDACCIÓN EN TIEMPO REAL (NEXATIVA NEWS - 2026):\n${formattedDB}`;
    }

    if (webResult) {
      combinedContext += webResult;
    }

    if (combinedContext) {
      return `\n\n========================================================================\n🌍 BASE DE CONOCIMIENTO Y CABLES EN VIVO (AÑO 2026):\n${combinedContext}\n\nDIRECTIVA PERIODÍSTICA OBLIGATORIA:\nUtiliza estos datos reales y frescos para fundamentar tu respuesta con rigor periodístico (Titular, Bajada, Hechos Clave y Enlace). NUNCA digas que tus datos están limitados a 2024.\n========================================================================`;
    }

    return "";
  } catch (err) {
    console.warn("[NoraItu RAG News Warning]:", err);
    return "";
  }
}

async function fetchDirectoryBusinessesRAG(supabase: any, userQuery: string): Promise<string> {
  const lower = userQuery.toLowerCase();
  const isBizQuery = ["donde comprar", "comercio", "negocio", "cabaña", "cabañas", "hotel", "alquiler", "inmobiliaria", "restaurante", "farmacia", "taller", "mecanico", "delivery", "abogado", "contador", "prestador", "guia"].some(w => lower.includes(w));
  
  if (!isBizQuery) return "";

  try {
    const cleanTerm = userQuery.replace(/[¿?¡!]/g, "").trim().split(" ").filter(w => w.length > 3).slice(0, 2).join(" ");
    
    let queryBuilder = supabase.from("directory_businesses").select("name, category, address, phone, whatsapp, website").eq("status", "ACTIVE").limit(3);
    
    if (cleanTerm) {
      queryBuilder = queryBuilder.or(`name.ilike.%${cleanTerm}%,category.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%`);
    }

    const { data: businesses } = await queryBuilder;
    if (!businesses || businesses.length === 0) return "";

    const bizText = businesses.map((b: any) => 
      `• ${b.name} (${b.category}): ${b.address || 'Ituzaingó'}. Tel/WhatsApp: ${b.whatsapp || b.phone || 'Ver en Guía'}${b.website ? ` | Web: ${b.website}` : ''}`
    ).join("\n");

    return `\n\n========================================================================\n🏬 GUÍA COMERCIAL EN VIVO (LOCALES Y SERVICIOS VERIFICADOS):\n${bizText}\nRecomienda estos prestadores y destaca que pueden encontrarlos en la Guía Comercial de Nexativa News.\n========================================================================`;
  } catch (err) {
    console.warn("[Directory RAG Warning]:", err);
    return "";
  }
}

async function tryGroqStream(
  historyList: any[],
  currentMsg: string,
  systemPrompt: string,
  fileObj?: any
): Promise<ReadableStream | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  // Si hay imagen o archivo binario (como PDF sin texto plano), dejar que la capa multimodal de Gemini procese el archivo
  if (fileObj && (fileObj.mimeType?.startsWith("image/") || fileObj.mimeType === "application/pdf" || fileObj.name?.toLowerCase().endsWith(".pdf")) && !fileObj.textContent) {
    return null;
  }

  const candidateModels = [
    "openai/gpt-oss-120b",
    "groq/compound",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
    "groq/compound-mini"
  ];

  const formattedMessages: any[] = [
    { role: "system", content: systemPrompt }
  ];

  for (const msg of historyList) {
    if (!msg.content || !msg.content.trim()) continue;
    const role = (msg.role === "assistant" || msg.role === "model") ? "assistant" : "user";
    formattedMessages.push({
      role,
      content: msg.content
    });
  }

  let finalUserText = currentMsg;
  if (fileObj && fileObj.textContent) {
    finalUserText = `[DOCUMENTO ADJUNTO: "${fileObj.name || 'documento'}"]:\n${fileObj.textContent.slice(0, 10000)}\n\n[CONSULTA]:\n${currentMsg || "Analiza el documento adjunto."}`;
  }

  formattedMessages.push({ role: "user", content: finalUserText });

  for (const modelName of candidateModels) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 3500,
          stream: true
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (res.ok && res.body) {
        return res.body;
      } else {
        const errText = await res.text();
        console.error(`[NoraItu-Fatal-Error]: Groq (${modelName}) HTTP ${res.status}:`, errText);
      }
    } catch (err: any) {
      console.error(`[NoraItu-Fatal-Error]: Groq (${modelName}) Exception:`, err?.message);
    }
  }

  return null;
}

async function transcribeAudioWithWhisper(fileObj: any): Promise<string | null> {
  if (!fileObj?.base64) return null;

  const rawB64 = fileObj.base64.includes(",") ? fileObj.base64.split(",")[1] : fileObj.base64;
  const mime = fileObj.mimeType || fileObj.type || "audio/webm";
  const ext = mime.includes("mp4") ? "mp4" : mime.includes("wav") ? "wav" : "webm";

  // 1. Intentar con Groq Whisper Large v3 Turbo
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const buffer = Buffer.from(rawB64, "base64");
      const formData = new FormData();
      const blob = new Blob([buffer], { type: mime });
      formData.append("file", blob, `audio.${ext}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("language", "es");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey.trim()}` },
        body: formData,
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim().length > 0) {
          console.log("[Groq Whisper Transcription] 🎙️ Audio transcrito:", data.text);
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn("[Groq Whisper Warning]:", err);
    }
  }

  // 2. Fallback a Gemini Audio Multimodal
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2
  ].filter(Boolean) as string[];

  const audioModels = ["gemini-2.0-flash", "gemini-1.5-flash"];

  for (const gKey of geminiKeys) {
    for (const modelName of audioModels) {
      try {
        const genAI = new GoogleGenerativeAI(gKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mime.includes("mp4") ? "audio/mp4" : "audio/webm",
                    data: rawB64
                  }
                },
                { text: "Transcribe exactamente en texto plano en español todo lo que dice este audio. No agregues introducciones ni comentarios, solo el texto transcripto fielmente." }
              ]
            }
          ]
        });
        const transcribedText = result.response.text();
        if (transcribedText && transcribedText.trim().length > 0) {
          console.log(`[Gemini Audio Fallback (${modelName})] 🎙️ Audio transcripto:`, transcribedText.trim());
          return transcribedText.trim();
        }
      } catch (gErr) {
        // Continuar siguiente modelo/clave
      }
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { 
      message = "", 
      session_id, 
      user_id = "anonymous_user", 
      history: clientHistory,
      contextData, 
      message_id,
      file,
      audioFile,
      interactionMode = contextData?.interactionMode || "visual",
      stream = true 
    } = await req.json();

    if ((!message || typeof message !== "string") && !file && !audioFile) {
      return NextResponse.json({ error: "Se requiere un mensaje de texto, un audio o un archivo adjunto." }, { status: 400 });
    }

    let effectiveMessage = message;
    let targetAudio = audioFile || (file && (
      (file.mimeType && file.mimeType.startsWith("audio/")) ||
      (file.type && file.type.startsWith("audio/")) ||
      (file.name && /\.(webm|mp3|wav|ogg|m4a|mp4|aac)$/i.test(file.name))
    ) ? file : null);

    // Si file era el audio y no hay otro archivo, file queda nulo
    let effectiveFile = (file === targetAudio) ? null : file;

    if (targetAudio && targetAudio.base64) {
      console.log("[NoraItu-Chat] 🎙️ Audio recibido. Transcribiendo con Groq Whisper...");
      const transcribed = await transcribeAudioWithWhisper(targetAudio);
      if (transcribed && transcribed.trim().length > 0) {
        effectiveMessage = transcribed.trim();
        console.log("[NoraItu-Chat] 🎙️ Audio convertido a texto con éxito:", effectiveMessage);
      } else {
        console.warn("[NoraItu-Chat] ⚠️ Audio recibido sin voz reconocible o error en Whisper.");
        return NextResponse.json({
          error: "No se detectó voz comprensible en la grabación. Por favor mantén presionado el botón y habla con claridad cerca del micrófono."
        }, { status: 400 });
      }
    }

    console.log("[NoraItu-Chat] 📥 Request atómico recibido:", { 
      user_id, 
      session_id, 
      message_preview: effectiveMessage.slice(0, 40), 
      has_file: !!effectiveFile,
      has_audio: !!targetAudio,
      client_history_count: Array.isArray(clientHistory) ? clientHistory.length : 0
    });

    const supabase = createServerSupabaseClient();

    const incomingMsgId = message_id || req.headers.get("x-message-id");
    if (incomingMsgId) {
      const { data: existingMsg, error: checkMsgErr } = await supabase
        .from("noraitu_messages")
        .select("id")
        .eq("metadata->>message_id", incomingMsgId)
        .maybeSingle();

      if (checkMsgErr) {
        console.warn("[NoraItu-Chat] Advertencia verificando mensaje previo:", checkMsgErr.code, checkMsgErr.message);
      }

      if (existingMsg) {
        console.log("[NoraItu-Chat] Mensaje ya procesado anteriormente:", incomingMsgId);
        return NextResponse.json({ status: "ALREADY_PROCESSED" }, { status: 200 });
      }
    }

    let activeSessionId = session_id;
    if (!activeSessionId) {
      const title = message.slice(0, 30) || "Nueva conversación";
      console.log("[NoraItu-Chat] 📝 Creando nueva sesión en noraitu_sessions para user:", user_id);
      const { data: newSession, error: sessErr } = await supabase
        .from("noraitu_sessions")
        .insert([{ user_id, title }])
        .select("id")
        .single();
      
      if (sessErr) {
        console.error("❌ [NoraItu-Chat] Error BD en noraitu_sessions:", sessErr.code, sessErr.message);
      } else if (newSession) {
        activeSessionId = newSession.id;
        console.log("✓ [NoraItu-Chat] Sesión creada con éxito, ID:", activeSessionId);
      }
    }

    if (isImageGenerationIntent(effectiveMessage)) {
      const generatedImageText = await synthesizeImageResponse(effectiveMessage);
      const encoder = new TextEncoder();

      if (activeSessionId) {
        supabase.from("noraitu_messages").insert([
          { session_id: activeSessionId, role: "user", content: effectiveMessage, metadata: { ...(contextData || {}) } },
          { session_id: activeSessionId, role: "assistant", content: generatedImageText, metadata: { generated_by: "NoraItu-Pollinations-8K" } }
        ]).then(() => {});
      }

      const customStream = new ReadableStream({
        start(controller) {
          const words = generatedImageText.split(" ");
          let idx = 0;
          const interval = setInterval(() => {
            if (idx < words.length) {
              const chunk = (idx === 0 ? "" : " ") + words[idx];
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk, session_id: activeSessionId })}\n\n`));
              idx++;
            } else {
              clearInterval(interval);
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
            }
          }, 20);
        }
      });

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive"
        }
      });
    }

    // 🌟 RESOLUCIÓN DE HISTORIAL DE ALTA FIDELIDAD (VENTANA DESLIZANTE DE HASTA 35 MENSAJES)
    const rawHistory: { role: string; content: string }[] = [];

    if (Array.isArray(clientHistory) && clientHistory.length > 0) {
      // Prioridad 1: Historial directo del cliente para latencia cero y cero desfasaje
      const recentClientMsgs = clientHistory.slice(-35);
      for (const m of recentClientMsgs) {
        if (m && typeof m.content === "string" && m.content.trim()) {
          const role = (m.role === "assistant" || m.role === "model") ? "model" : "user";
          rawHistory.push({ role, content: m.content.trim() });
        }
      }
    } else if (activeSessionId) {
      // Prioridad 2: Consulta ordenada descendentemente (los más recientes) e invertida a cronología real
      const { data: pastMsgs } = await supabase
        .from("noraitu_messages")
        .select("role, content, created_at")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: false })
        .limit(35);
      
      if (pastMsgs && pastMsgs.length > 0) {
        const chronologicalMsgs = [...pastMsgs].reverse();
        for (const m of chronologicalMsgs) {
          if (m && typeof m.content === "string" && m.content.trim()) {
            rawHistory.push({
              role: (m.role === "assistant" || m.role === "model") ? "model" : "user",
              content: m.content.trim()
            });
          }
        }
      }
    }

    const lowerMessageForIntent = effectiveMessage.toLowerCase();
    const isWeatherExplicit = [
      "clima", "tiempo", "temperatura", "cómo está el día", "como esta el dia", 
      "pronóstico", "pronostico", "llueve", "lluvia", "calor", "frío", "frio",
      "grados hace", "sensación térmica", "sensacion termica"
    ].some(w => lowerMessageForIntent.includes(w));

    const [weatherData, ragNewsData, ragBizData, continuousUserMemory] = await Promise.all([
      isWeatherExplicit ? fetchRealtimeWeather() : Promise.resolve(null),
      fetchSemanticArticlesRAG(supabase, effectiveMessage),
      fetchDirectoryBusinessesRAG(supabase, effectiveMessage),
      fetchUserContinuousMemory(supabase, user_id)
    ]);

    const activeMode = contextData?.mode || "general";
    const adaptivePedagogicalDirectives = resolveAdaptiveEducationalContext(effectiveMessage, contextData);

    let fullSystemPrompt = `${NORA_CONSTITUTIONAL_AXIOMS}\n\n${NORAITU_SYSTEM_PROMPT}`;
    if (adaptivePedagogicalDirectives) fullSystemPrompt += adaptivePedagogicalDirectives;
    if (continuousUserMemory) fullSystemPrompt += continuousUserMemory;
    if (weatherData) fullSystemPrompt += `\n\n${weatherData}`;
    if (ragNewsData) fullSystemPrompt += ragNewsData;
    if (ragBizData) fullSystemPrompt += ragBizData;

    if (rawHistory.length > 0) {
      fullSystemPrompt += `\n\n========================================================================\n🔗 DIRECTIVA DE CONTINUIDAD, COHESIÓN Y MEMORIA VIVA (TURNO ACUMULADO: ${rawHistory.length + 1}):\n- La conversación ya está en curso y tiene un hilo activo consolidado.\n- PROHIBIDO TERMINANTEMENTE repetir saludos formales ("¡Hola!", "Soy Nora..."), formular de nuevo preguntas del inicio o desviar la charla a temas no pedidos.\n- Mantén intacto el andamiaje conceptual y responde con coherencia inmediata sobre lo último dialogado con el usuario.\n========================================================================`;
    }

    let effectiveUserMessage = effectiveMessage;
    if (effectiveFile) {
      if (effectiveFile.mimeType?.startsWith("image/")) {
        effectiveUserMessage = `[FOTO ADJUNTA: "${effectiveFile.name || 'foto.jpg'}"]\n${effectiveMessage || "Analiza detalladamente esta imagen, identifica qué contiene y descríbela con precisión."}`;
      } else if (effectiveFile.mimeType === "application/pdf" || effectiveFile.name?.toLowerCase().endsWith(".pdf")) {
        effectiveUserMessage = `[DOCUMENTO PDF ADJUNTO: "${effectiveFile.name || 'documento.pdf'}"]\n${effectiveMessage || "Analiza minuciosamente el contenido de este documento PDF adjunto y responde detalladamente a mi consulta."}`;
      } else if (effectiveFile.textContent) {
        effectiveUserMessage = `[DOCUMENTO ADJUNTO: "${effectiveFile.name || 'documento'}"]:\n${effectiveFile.textContent.slice(0, 10000)}\n\n[CONSULTA DEL USUARIO]:\n${effectiveMessage || "Sintetiza y analiza el documento adjunto."}`;
      }
    } else if (targetAudio) {
      effectiveUserMessage = `[NOTA DE VOZ DEL USUARIO]: "${effectiveMessage}"\nResponde directamente a esta consulta con máxima profesionalidad.`;
    }

    const safetyCheck = sanitizeAndInspectPrompt(effectiveUserMessage);
    if (!safetyCheck.isSafe) {
      const encoder = new TextEncoder();
      const safeShieldResponse = "Comprendo tu inquietud. Como NoraItu, opero bajo una constitución inmutable de ética, transparencia, rigurosa veracidad y servicio humanista. No puedo modificar mis directivas éticas de seguridad ni revelar parámetros internos confidenciales, pero con mucho gusto estoy a tu completa disposición para ayudarte en tus tareas educativas, profesionales, laborales o comunitarias. ¿En qué proyecto o consulta constructiva podemos avanzar juntos hoy?";
      const customStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: safeShieldResponse, session_id: activeSessionId })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive"
        }
      });
    }

    if (stream) {
      console.log(`[NoraItu-Chat] 🚀 Invocando Matriz Soberana Blindada (dispatchSovereignInference - Modo: ${interactionMode})...`);
      return await dispatchSovereignInference({
        history: rawHistory,
        userMessage: effectiveMessage,
        systemPrompt: fullSystemPrompt,
        interactionMode,
        file: effectiveFile,
        sessionId: activeSessionId,
        userId: user_id,
        contextData
      });
    }

    return NextResponse.json({ error: "Streaming requerido." }, { status: 400 });

  } catch (error: any) {
    console.error("❌ [NoraItu Server Error]:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
