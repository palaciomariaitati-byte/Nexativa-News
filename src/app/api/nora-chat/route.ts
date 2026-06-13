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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    const result = await chat.sendMessage(finalMessage);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Error en Nora API:", error);
    return NextResponse.json({ error: "Error de red" }, { status: 500 });
  }
}
