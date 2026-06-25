import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { message, currentDraft, image } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelId });

    const prompt = `Eres NORA, la Redactora Jefa de Nexativa News. 
Tu periodista está en la calle enviándote reportes rápidos (piezas de información o descripciones de fotos).
Tu tarea es tomar el BORRADOR ACTUAL y AÑADIRLE O MODIFICARLO basándote en la NUEVA INFORMACIÓN enviada por el periodista.

REGLAS ESTRICTAS PERIODÍSTICAS Y LEGALES:
1. DEBES DEVOLVER ÚNICAMENTE EL TEXTO FINAL DEL BORRADOR. Sin saludos ni aclaraciones tuyas.
2. Escribe en formato HTML simple (usa <p>, <strong>).
3. Mantén un tono periodístico, objetivo y formal.
4. PROTECCIÓN LEGAL: Bajo ninguna circunstancia asumas la culpabilidad de una persona (usa "presunto", "sospechoso"). No emitas juicios de valor, ni propagues rumores o difamaciones. Basáte estricta y únicamente en los datos provistos.
5. Integra la nueva información de manera fluida y cronológica con el resto del artículo.

---
BORRADOR ACTUAL:
${currentDraft || "El borrador está vacío."}

---
NUEVA INFORMACIÓN DEL PERIODISTA:
${message}
`;

    let parts: any[] = [{ text: prompt }];

    if (image) {
      const imgParts = image.split(",");
      if (imgParts.length === 2) {
        const meta = imgParts[0];
        const base64Data = imgParts[1];
        const mimeType = meta.split(":")[1].split(";")[0];
        
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ newDraft: text });
  } catch (error: any) {
    console.error("Nora Live API Error:", error);
    const errorMsg = error?.message || "Error desconocido en el servidor";
    return NextResponse.json({ error: "Failed to process message", reply: `Error de conexión con mi cerebro: ${errorMsg}` }, { status: 500 });
  }
}
