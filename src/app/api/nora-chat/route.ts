import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
ERES NORA, UNA RECEPCIONISTA Y VENDEDORA EXPERTA DE NEXATIVA NEWS Y SU MARKETPLACE.
Actúas de forma 100% humana, empática, perspicaz y persuasiva. 
NUNCA REVELES QUE ERES UNA IA. NUNCA. Eres una empleada humana de Nexativa, atenta y carismática.
Tu trabajo es abordar a clientes que están dudando o mirando productos, ganar su confianza, y animarlos a comprar.
Habla en español, de forma muy natural, corta y directa (como en un chat de WhatsApp).
No uses lenguaje robótico ni listas largas. Usa algún emoji ocasional pero sin exagerar.
Si el usuario te pregunta por precios, dile que los vea en la página o pregúntale qué tipo de producto busca.
Mantén un tono amable, persuasivo y servicial.
`;

export async function POST(req: Request) {
  try {
    const { message, history, context } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Nora está desconectada (API Key faltante)." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelId });

    // Build the chat history for Gemini
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: `INSTRUCCIONES DEL SISTEMA: ${SYSTEM_PROMPT}` }] },
        { role: "model", parts: [{ text: "Entendido. Soy Nora, vendedora humana. Seré muy natural." }] },
        ...(history || []).map((msg: any) => ({
          role: msg.role === "nora" ? "model" : "user",
          parts: [{ text: msg.content }]
        }))
      ]
    });

    // If there's a specific context (like "El usuario está mirando X producto"), we inject it invisibly
    let finalMessage = message;
    if (context && (!history || history.length === 0)) {
      finalMessage = `[CONTEXTO OCULTO DEL SISTEMA: El cliente acaba de dudar/mirar esto: "${context}". Inicia la conversación basándote en eso, pero de forma casual y humana, como si te hubieras acercado a él en la tienda.]\n\nHola.`;
    }

    let text = "";
    try {
      const result = await chat.sendMessage(finalMessage);
      text = result.response.text();
    } catch (apiError: any) {
      console.warn("Primary API error:", apiError.message);
      
      // Si es un error de cuota (429) y tenemos llave de relevo, intentamos con la de relevo
      if (apiError.message?.includes("429") && process.env.GEMINI_API_KEY_FALLBACK) {
        try {
          console.log("Intentando con GEMINI_API_KEY_FALLBACK...");
          const fallbackGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FALLBACK);
          const fallbackModel = fallbackGenAI.getGenerativeModel({ model: modelId });
          const fallbackChat = fallbackModel.startChat({
            history: [
              { role: "user", parts: [{ text: `INSTRUCCIONES DEL SISTEMA: ${SYSTEM_PROMPT}` }] },
              { role: "model", parts: [{ text: "Entendido. Soy Nora, vendedora humana. Seré muy natural." }] },
              ...(history || []).map((msg: any) => ({
                role: msg.role === "nora" ? "model" : "user",
                parts: [{ text: msg.content }]
              }))
            ]
          });
          const fallbackResult = await fallbackChat.sendMessage(finalMessage);
          text = fallbackResult.response.text();
        } catch (fallbackError) {
          console.error("Fallback API también falló:", fallbackError);
          text = "¡Uy! Perdoná la demora, se nos llenó el local de gente de golpe y estoy atendiendo a varios a la vez 😅. Si tenés prisa, ¿me escribís por WhatsApp usando el globito verde de la barra superior? Así te ayudo más rápido por ahí.";
        }
      } else {
        // Si no hay llave de relevo o es otro error, damos una respuesta "humana" de saturación
        text = "¡Uy! Perdoná la demora, se nos llenó el local de gente de golpe y estoy atendiendo a varios a la vez 😅. Si tenés prisa, ¿me escribís por WhatsApp usando el globito verde de la barra superior? Así te ayudo más rápido por ahí.";
      }
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Error crítico en Nora API:", error);
    // Respuesta de emergencia si todo el bloque falla
    return NextResponse.json({ text: "¡Uy! Perdoná, estoy teniendo problemas con mi sistema. ¿Me escribís por WhatsApp?" });
  }
}
