import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_SYSTEM_MAP } from "@/lib/nora/systemMap";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const userPrompt = message || "Hola Nora, ¿cómo puedes guiarme en el uso del sistema?";
    const promptLower = userPrompt.toLowerCase();

    // 1. Piscina de Claves de Resguardo (Sin filtros restrictivos)
    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(Boolean) as string[];

    const validModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-flash-latest"];
    const systemPromptText = `
${NORA_SYSTEM_MAP}

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

    // 2. Intento de Generación con IA (Multi-Key & Multi-Model Loop)
    if (keysPool.length > 0) {
      outerLoop: for (const currentKey of keysPool) {
        for (const currentModel of validModels) {
          try {
            const genAI = new GoogleGenerativeAI(currentKey);
            const model = genAI.getGenerativeModel({ model: currentModel });

            let normalizedHistory: any[] = [
              { role: "user", parts: [{ text: `INSTRUCCIONES DE INSTRUCTORA MASTER: ${systemPromptText}` }] },
              { role: "model", parts: [{ text: "Entendido. Soy Nora Instructora Master y Copiloto del Dashboard. Estoy lista para guiarte paso a paso en cualquier tarea o resolver cualquier duda técnica del ecosistema." }] }
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

    // 3. Fallback Inteligente Local (Búsqueda determinística en NORA_SYSTEM_MAP) si las API keys fallan
    if (!replyText) {
      if (promptLower.includes("faux-cgi") || promptLower.includes("surreal") || promptLower.includes("video") || promptLower.includes("campaña")) {
        replyText = `**🎨 Guía para crear una Campaña Faux-CGI (Estudio Surrealista):**

1. Ingresa a la ruta **/admin/marketing/editor** (Pestaña "Estudio Surrealista").
2. Escribe la idea de tu anuncio en la caja de texto (ej: *"Para una casa de comidas, quiero empanadas bailando y una hamburguesa gigante"*).
3. Nora generará automáticamente el prompt optimizado en inglés, el guion publicitario AIDA y la vista previa del concepto.
4. El video .mp4 se procesa asíncronamente en segundo plano a costo $0 y se guarda en Supabase Storage.`;
      } else if (promptLower.includes("valen") || promptLower.includes("cazar") || promptLower.includes("inmueble") || promptLower.includes("lead")) {
        replyText = `**🕵️ Guía de Operación del Agente VALEN (Growth Officer):**

1. Ingresa a la ruta **/admin/growth** para ver la consola de prospección.
2. VALEN escanea automáticamente Facebook Marketplace, Instagram y clasificados en busca de alquileres temporarios y comercios locales.
3. Envía mensajes de invitación personalizados e inserta los prospectos en la tabla *valen_leads*.
4. Cuando el cliente hace clic en la invitación, NORA lo recibe en el portal y le diseña su paquete publicitario.`;
      } else if (promptLower.includes("fact-check") || promptLower.includes("noticia") || promptLower.includes("veracidad")) {
        replyText = `**📰 Guía del Fact-Checker & Rotador de Noticias:**

1. Accede a **/admin/news** o la cola del corresponsal.
2. Nora escanea fuentes regionales y el motor *verifyNewsVeracity* asigna un puntaje (0 a 100).
3. Si el puntaje es >= 50, se aprueba e inserta automáticamente la noticia en el portal y se dispara su memoria vectorial semántica.`;
      } else if (promptLower.includes("error") || promptLower.includes("401") || promptLower.includes("unauthorized") || promptLower.includes("429")) {
        replyText = `**🛠️ Solución a Errores de API (401 Unauthorized / 429 Quota):**

- **Causa:** Una de las claves temporales de Google API expiró o alcanzó el límite por minuto.
- **Solución:** El sistema ya cuenta con conmutación automática multi-llave. Simplemente presiona **"Empezar de nuevo"** o recarga la página. Nora utilizará las claves secundarias sin interrumpir tu trabajo.`;
      } else {
        replyText = `**¡Hola! Soy Nora Instructora Master y Copiloto Técnico.**

Estoy lista para acompañarte paso a paso en el panel:
- **🎨 Estudio Surrealista Faux-CGI:** /admin/marketing/editor
- **🕵️ Agente VALEN Hunter:** /admin/growth
- **📰 Fact-Checker de Noticias:** /admin/news
- **💾 Memoria RAG:** Ejecuta *npm run sync-memory* en la terminal.

¿Qué tarea te gustaría realizar ahora mismo?`;
      }
    }

    return NextResponse.json({ reply: replyText });
  } catch (err: any) {
    console.error("[NORA ADMIN COPILOT ERROR]:", err);
    return NextResponse.json({
      reply: "Hola, soy Nora Instructora. Ocurrió un inconveniente temporal. Te sugiero revisar que la conexión al backend esté activa o recargar la página."
    }, { status: 500 });
  }
}
