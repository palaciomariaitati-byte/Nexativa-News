import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { message, currentDraft } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Eres NORA, la Redactora Jefa de Nexativa News. 
Tu periodista está en la calle enviándote reportes rápidos (piezas de información o descripciones de fotos).
Tu tarea es tomar el BORRADOR ACTUAL y AÑADIRLE O MODIFICARLO basándote en la NUEVA INFORMACIÓN enviada por el periodista.

REGLAS ESTRICTAS:
1. DEBES DEVOLVER ÚNICAMENTE EL TEXTO FINAL DEL BORRADOR. No incluyas ningún saludo, ni comentarios tipo "Aquí tienes el borrador". SÓLO EL TEXTO PERIODÍSTICO.
2. Escribe en formato HTML simple (usa <p>, <strong>, etc. si es necesario).
3. Mantén un tono periodístico, objetivo y atrapante.
4. Integra la nueva información de manera coherente con el resto del artículo.

---
BORRADOR ACTUAL:
${currentDraft || "El borrador está vacío."}

---
NUEVA INFORMACIÓN DEL PERIODISTA:
${message}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ newDraft: text });
  } catch (error) {
    console.error("Nora Live API Error:", error);
    return NextResponse.json({ error: "Failed to process message", reply: "Error de conexión con mi cerebro." }, { status: 500 });
  }
}
