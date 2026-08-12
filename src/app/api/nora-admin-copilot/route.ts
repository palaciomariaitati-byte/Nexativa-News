import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_SYSTEM_MAP } from "@/lib/nora/systemMap";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(k => k && !k.startsWith("AQ.")) as string[];

    if (keysPool.length === 0) {
      return NextResponse.json({
        reply: "Hola, soy Nora Instructora. En este momento las claves de API no están disponibles en el servidor. Por favor verifica las variables de entorno."
      });
    }

    const validModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-flash-latest"];
    const userPrompt = message || "Hola Nora, ¿cómo puedes guiarme en el uso del sistema?";

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
    let lastError = null;

    // Multi-key & Multi-model Fallback Loop
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
            lastError = null;
            break outerLoop;
          }
        } catch (err: any) {
          console.warn(`[NORA ADMIN COPILOT WARNING] Key/Model failure (${currentModel}):`, err?.message || err);
          lastError = err;
        }
      }
    }

    if (!replyText) {
      replyText = "Hola, soy Nora Instructora. En este momento estoy calibrando el enjambre de modelos. Puedes realizar tareas como el Estudio Surrealista en /admin/marketing/editor o revisar la prospección de VALEN en /admin/growth.";
    }

    return NextResponse.json({ reply: replyText });
  } catch (err: any) {
    console.error("[NORA ADMIN COPILOT ERROR]:", err);
    return NextResponse.json({
      reply: "Hola, soy Nora Instructora. Ocurrió un inconveniente temporal. Te sugiero revisar que la conexión al backend esté activa o recargar la página."
    }, { status: 500 });
  }
}
