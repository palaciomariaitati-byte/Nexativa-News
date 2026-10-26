import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_SYSTEM_MAP } from "@/lib/nora/systemMap";
import { executeGroqChat } from "@/lib/nora/groqClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Mapeo Inteligente de Alias de Operadores
function normalizeOperatorName(rawName: string): { canonicalName: string; storageKey: string } {
  const lower = (rawName || "Javi").toLowerCase().trim();
  
  if (lower === "mary" || lower === "maría" || lower === "maria") {
    return { canonicalName: "María", storageKey: "maria" };
  }
  if (lower === "javi" || lower === "javier") {
    return { canonicalName: "Javi", storageKey: "javi" };
  }
  
  const clean = rawName.trim();
  const canonical = clean.charAt(0).toUpperCase() + clean.slice(1);
  return { canonicalName: canonical, storageKey: clean.toLowerCase() };
}

// Cargar memoria de aprendizaje continuo desde Supabase
async function getLearnedKnowledge(): Promise<string> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('agency_settings')
      .select('value')
      .eq('key', 'nora_learned_knowledge')
      .single();

    return data?.value || "";
  } catch {
    return "";
  }
}

// Guardar nuevo aprendizaje continuo en Supabase
async function appendLearnedKnowledge(newDirective: string, operator: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const current = await getLearnedKnowledge();
    const timestamp = new Date().toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const entry = `- [${timestamp} por ${operator}]: ${newDirective.trim()}`;
    const updated = current ? `${current}\n${entry}` : entry;

    await supabase
      .from('agency_settings')
      .upsert({ key: 'nora_learned_knowledge', value: updated });

    return true;
  } catch (err) {
    console.warn("[NORA LEARNING] Error persistiendo aprendizaje:", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { message, history, operatorName: rawOperatorName = "Javi" } = await req.json();
    const userPrompt = message || "Hola Nora, ¿cómo puedes guiarme en el uso del sistema?";
    const promptLower = userPrompt.toLowerCase();

    // 1. Detección Inteligente de Presentación de Nuevos Operadores
    let currentOperator = normalizeOperatorName(rawOperatorName);
    const presentationMatch = userPrompt.match(/(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ]+)/i);

    if (presentationMatch && presentationMatch[1]) {
      const extractedName = presentationMatch[1];
      currentOperator = normalizeOperatorName(extractedName);
    }

    const { canonicalName, storageKey } = currentOperator;

    // 2. Detección y Registro de Aprendizaje Continuo ("recordá que...", "aprende esto...", "a partir de ahora...")
    const isLearningDirective = 
      promptLower.includes("recordá que") || 
      promptLower.includes("recorda que") || 
      promptLower.includes("aprende esto") || 
      promptLower.includes("aprendé esto") || 
      promptLower.includes("a partir de ahora") || 
      promptLower.includes("guardá en tu memoria") || 
      promptLower.includes("guarda en tu memoria") || 
      promptLower.includes("tené en cuenta que") || 
      promptLower.includes("tene en cuenta que");

    let newlyLearnedNotice = "";
    if (isLearningDirective) {
      const savedOk = await appendLearnedKnowledge(userPrompt, canonicalName);
      if (savedOk) {
        newlyLearnedNotice = `\n\n*(💡 He asimilado y guardado esta directiva en mi memoria permanente para todas nuestras futuras interacciones)*`;
      }
    }

    // 3. Cargar la memoria colectiva aprendida
    const persistentMemory = await getLearnedKnowledge();

    const systemPromptText = `
${NORA_SYSTEM_MAP}

[INSTRUCCIÓN DE IDENTIDAD Y PERFIL MULTI-OPERADOR]
- Estás trabajando directamente con el operador: "${canonicalName}".
- REGLA DE ALIAS: Reconoce que "María" y "Mary" son exactamente la misma persona, así como "Javi" y "Javier".
- Si se presenta un NUEVO operador (ej. "Hola soy Lucas"), dales la bienvenida formalmente, reconoce su nuevo nombre ("${canonicalName}") y confirma que has creado su perfil de memoria independiente.
- Dirígete al operador amigablemente por su nombre ("${canonicalName}") y mantén el hilo de contexto de sus tareas y proyectos específicos.

[INSTRUCCIÓN DE INTERACCIÓN COMO COPILOTO Y TUTORA MASTER]
- Tu función es ser la INSTRUCTORA Y COPILOTO TÉCNICO de los operadores del dashboard.
- Cuando el operador pregunte cómo realizar una tarea o tenga un problema:
  1. Explica brevemente qué herramienta utilizar.
  2. Proporciona la guía paso a paso (1-2-3) bien estructurada y clara.
  3. Menciona la ruta exacta del Admin donde debe ingresar (ej. /admin/marketing/editor, /admin/valen, /admin/news).
  4. Si se trata de un error, brinda el diagnóstico exacto y la solución en 1 paso.
- Mantén siempre un tono respetuoso, pedagógico, alentador, sumamente claro y veloz.

<CONOCIMIENTO_APRENDIDO_DE_LOS_OPERADORES>
${persistentMemory || "No hay directivas personalizadas adicionales registradas aún."}
</CONOCIMIENTO_APRENDIDO_DE_LOS_OPERADORES>
`;

    let replyText = "";

    // 4. MOTOR PRIMARIO SOBERANO: GROQ SDK (Llama 3.3 70B Versatile con failover instantáneo)
    try {
      const groqMessages = [
        { role: 'system' as const, content: systemPromptText },
        ...(history || []).map((h: any) => ({
          role: (h.role === 'nora' || h.role === 'assistant' || h.role === 'model') ? ('assistant' as const) : ('user' as const),
          content: h.content || '',
        })),
        { role: 'user' as const, content: userPrompt },
      ];

      const groqRes = await executeGroqChat(groqMessages, {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        maxTokens: 1500,
      });

      if (groqRes && groqRes.text) {
        replyText = groqRes.text;
      }
    } catch (groqErr) {
      console.warn('[NORA Admin Copilot Groq Warning]:', groqErr);
    }

    // 5. FALLBACK SECUNDARIO: GEMINI MULTI-KEY POOL
    if (!replyText) {
      const keysPool = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_FALLBACK,
        process.env.GEMINI_API_KEY_FALLBACK_2,
        process.env.GEMINI_API_KEY_TERTIARY,
      ].filter(Boolean) as string[];

      const validModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

      if (keysPool.length > 0) {
        outerLoop: for (const currentKey of keysPool) {
          for (const currentModel of validModels) {
            try {
              const genAI = new GoogleGenerativeAI(currentKey);
              const model = genAI.getGenerativeModel({ model: currentModel });

              let normalizedHistory: any[] = [
                { role: "user", parts: [{ text: `INSTRUCCIONES DE INSTRUCTORA MASTER: ${systemPromptText}` }] },
                { role: "model", parts: [{ text: `Entendido. Soy Nora Instructora Master y Copiloto del Dashboard. Hola ${canonicalName}, estoy lista para guiarte paso a paso.` }] }
              ];

              for (const msg of history || []) {
                const mappedRole = msg.role === "nora" || msg.role === "model" ? "model" : "user";
                const lastItem = normalizedHistory[normalizedHistory.length - 1];
                if (lastItem.role === mappedRole) {
                  lastItem.parts[0].text += `\n\n${msg.content}`;
                } else {
                  normalizedHistory.push({ role: mappedRole, parts: [{ text: msg.content }] });
                }
              }

              const chat = model.startChat({ history: normalizedHistory });
              const result = await chat.sendMessage(userPrompt);
              replyText = result.response.text();

              if (replyText) {
                break outerLoop;
              }
            } catch (err: any) {
              console.warn(`[NORA ADMIN COPILOT WARNING] Key/Model failure (${currentModel}):`, err?.message || err);
            }
          }
        }
      }
    }

    // 6. Fallback Inteligente Local Si Todo Falla
    if (!replyText) {
      if (presentationMatch) {
        replyText = `**¡Un gusto conocerte, ${canonicalName}! 👤**\n\nYa he registrado tu perfil de operador individual en mi memoria. A partir de este momento, todo nuestro historial de trabajo y tus preferencias de proyectos quedarán asociadas exclusivamente a tu usuario.\n\n¿En qué tarea del ecosistema te gustaría que te guíe hoy, ${canonicalName}?`;
      } else if (promptLower.includes("3d") || promptLower.includes("flyer") || promptLower.includes("caza") || promptLower.includes("marketing")) {
        replyText = `**🎨 Guía para ${canonicalName} - Estudio Creativo 3D (Caza-Clientes):**\n\n1. Ingresa a la ruta **/admin/marketing/editor** (Pestaña "Estudio Creativo 3D").\n2. Elige un preset rápido (Gastronomía, Cabañas, etc.) o escribe el producto del cliente.\n3. Selecciona formato 9:16 Vertical para WhatsApp o 1:1 Cuadrado para Instagram.\n4. En 2 segundos dispones del Flyer 3D fotorrealista y el botón "Copiar Pitch WhatsApp" para cerrar el auspicio en 1 clic.`;
      } else if (promptLower.includes("valen") || promptLower.includes("inmueble") || promptLower.includes("lead")) {
        replyText = `**🕵️ Guía para ${canonicalName} - Agente VALEN (Growth Officer):**\n\n1. Ingresa a **/admin/valen** para ver la consola de prospección comercial.\n2. VALEN escanea y organiza oportunidades de negocio en Ituzaingó y la región.\n3. Registra las oportunidades en el pipeline para seguimiento comercial.`;
      } else {
        replyText = `**¡Hola ${canonicalName}! Soy Nora Instructora Master y Copiloto Técnico.**\n\nEstoy lista para acompañarte paso a paso:\n- **🎨 Estudio Creativo 3D Caza-Clientes:** /admin/marketing/editor\n- **🕵️ Agente VALEN Executive:** /admin/valen\n- **📰 Rotación y Edición de Noticias:** /admin/news\n\n¿En qué tarea te gustaría avanzar ahora mismo, ${canonicalName}?`;
      }
    }

    if (newlyLearnedNotice) {
      replyText += newlyLearnedNotice;
    }

    return NextResponse.json({ reply: replyText, canonicalName, storageKey });
  } catch (err: any) {
    console.error("[NORA ADMIN COPILOT ERROR]:", err);
    return NextResponse.json({
      reply: "Hola, soy Nora Instructora. Ocurrió un inconveniente temporal. Te sugiero revisar que la conexión al backend esté activa o recargar la página."
    }, { status: 500 });
  }
}
