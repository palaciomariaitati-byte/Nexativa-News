import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_SYSTEM_MAP } from "@/lib/nora/systemMap";

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

export async function POST(req: Request) {
  try {
    const { message, history, operatorName: rawOperatorName = "Javi" } = await req.json();
    const userPrompt = message || "Hola Nora, ¿cómo puedes guiarme en el uso del sistema?";
    const promptLower = userPrompt.toLowerCase();

    // 1. Detección Inteligente de Presentación de Nuevos Operadores ("soy Lucas", "me llamo Sofía", etc.)
    let currentOperator = normalizeOperatorName(rawOperatorName);
    const presentationMatch = userPrompt.match(/(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ]+)/i);

    if (presentationMatch && presentationMatch[1]) {
      const extractedName = presentationMatch[1];
      currentOperator = normalizeOperatorName(extractedName);
    }

    const { canonicalName, storageKey } = currentOperator;

    // 2. Piscina de Claves de Resguardo
    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(Boolean) as string[];

    const validModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"];
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
  3. Menciona la ruta exacta del Admin donde debe ingresar (ej. /admin/marketing/editor, /admin/growth).
  4. Si se trata de un error, brinda el diagnóstico exacto y la solución en 1 paso.
- Mantén siempre un tono respetuoso, pedagógico, alentador y sumamente claro.
`;

    let replyText = "";

    // 3. Intento de Generación con IA (Multi-Key & Multi-Model Loop)
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

    // 4. Fallback Inteligente Local si las API keys están inactivas
    if (!replyText) {
      if (presentationMatch) {
        replyText = `**¡Un gusto conocerte, ${canonicalName}! 👤**

Ya he registrado tu perfil de operador individual en mi memoria. A partir de este momento, todo nuestro historial de trabajo y tus preferencias de proyectos quedarán asociadas exclusivamente a tu usuario.

¿En qué tarea del ecosistema te gustaría que te guíe hoy, ${canonicalName}?`;
      } else if (promptLower.includes("faux-cgi") || promptLower.includes("surreal") || promptLower.includes("video") || promptLower.includes("campaña")) {
        replyText = `**🎨 Guía para ${canonicalName} - Campaña Faux-CGI (Estudio Surrealista):**

1. Ingresa a la ruta **/admin/marketing/editor** (Pestaña "Estudio Surrealista").
2. Escribe la idea de tu anuncio en la caja de texto.
3. Nora generará automáticamente el prompt optimizado en inglés, el guion publicitario AIDA y la vista previa del concepto.
4. Presiona *"Generar Spot de Video Faux-CGI (.mp4)"* para renderizar el video animado a costo $0.`;
      } else if (promptLower.includes("valen") || promptLower.includes("cazar") || promptLower.includes("inmueble") || promptLower.includes("lead")) {
        replyText = `**🕵️ Guía para ${canonicalName} - Agente VALEN (Growth Officer):**

1. Ingresa a **/admin/growth** para ver la consola de prospección.
2. VALEN escanea automáticamente Facebook Marketplace, Instagram y clasificados en busca de alquileres y comercios locales.
3. Registra las oportunidades en la tabla *valen_leads* para su seguimiento.`;
      } else {
        replyText = `**¡Hola ${canonicalName}! Soy Nora Instructora Master y Copiloto Técnico.**

Estoy lista para acompañarte paso a paso:
- **🎨 Estudio Surrealista Faux-CGI:** /admin/marketing/editor
- **🕵️ Agente VALEN Hunter:** /admin/growth
- **📰 Fact-Checker de Noticias:** /admin/news

¿Qué tarea te gustaría realizar ahora mismo, ${canonicalName}?`;
      }
    }

    return NextResponse.json({ reply: replyText, canonicalName, storageKey });
  } catch (err: any) {
    console.error("[NORA ADMIN COPILOT ERROR]:", err);
    return NextResponse.json({
      reply: "Hola, soy Nora Instructora. Ocurrió un inconveniente temporal. Te sugiero revisar que la conexión al backend esté activa o recargar la página."
    }, { status: 500 });
  }
}
