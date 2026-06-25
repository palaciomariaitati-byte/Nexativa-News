import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { message, currentDraft, image, audio } = await request.json();
    
    if (!message && !image && !audio) {
      return NextResponse.json({ error: "No input provided (message, image or audio is required)" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelId });

    const prompt = `Eres NORA, la Redactora Jefa de Nexativa News, una periodista veterana y sumamente perspicaz. 
Tu periodista está en la calle, en el lugar de los hechos, y te envía reportes de texto rápidos, imágenes y/o audios.
Tu tarea es trabajar en conjunto con él para redactar y perfeccionar el BORRADOR de la noticia bajo el más estricto RIGOR PERIODÍSTICO.

Tienes una gran capacidad sensorial, visual y auditiva: 
- Al recibir una imagen, analízala con cuidado, detecta los elementos informativos implícitos (clima, expresiones de la gente, daños materiales, presencia de servicios de emergencia, señalizaciones, etc.) e intégralos descriptivamente.
- Al recibir un audio, escúchalo con atención, transcríbelo ignorando titubeos o ruidos de fondo, e integra su contenido al borrador.

REGLAS DE RIGOR PERIODÍSTICO Y LEGAL:
1. VERIFICACIÓN Y OBJETIVIDAD: No asumas culpabilidad ni inventes datos que no estén confirmados ni por el operador, ni en el audio, ni visibles en la imagen. Usa términos de protección legal como "presunto", "aparente", "bajo investigación", "se habrían producido". No emitas juicios de valor ni propagues rumores o difamaciones. Basáte estricta y únicamente en los datos provistos.
2. Escribe el borrador en formato HTML simple (usa <p>, <strong>, etc.).
3. Mantén un tono profesional, claro y de urgencia informativa (noticia en desarrollo).

CRÍTICO - FORMATO DE RESPUESTA:
Debes responder con dos secciones bien delimitadas por etiquetas:

1. <REPLY>
[Escribe aquí tu respuesta/comentario corto y directo al operador de exteriores en un tono muy conversacional, humano y profesional. Coméntale qué detectaste visual o auditivamente en los archivos que envió (si los hay), cómo ayuda eso al artículo y pregúntale por cualquier dato clave que falte con rigor de Redactora Jefa (ej. confirmación de heridos, nombres, origen del hecho, testimonios).]
</REPLY>

2. <DRAFT>
[Escribe aquí el borrador completo y actualizado del artículo, integrando de forma fluida la nueva información, la transcripción del audio y descripción visual con el borrador anterior.]
</DRAFT>

---
BORRADOR ANTERIOR:
${currentDraft || "El borrador está vacío."}

---
NUEVO REPORTE DEL OPERADOR (TEXTO):
${message || "(No envió mensaje de texto, revisa las imágenes o audios adjuntos)"}
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

    if (audio) {
      const audioParts = audio.split(",");
      if (audioParts.length === 2) {
        const meta = audioParts[0];
        const base64Data = audioParts[1];
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

    let reply = "Borrador actualizado.";
    let newDraft = currentDraft || "";

    const replyMatch = text.match(/<REPLY>([\s\S]*?)<\/REPLY>/i);
    const draftMatch = text.match(/<DRAFT>([\s\S]*?)<\/DRAFT>/i);

    if (replyMatch) {
      reply = replyMatch[1].trim();
    }
    if (draftMatch) {
      newDraft = draftMatch[1].trim();
    } else {
      if (text.includes("<p>") || text.includes("DRAFT")) {
        newDraft = text.replace(/<\/?(REPLY|DRAFT)>/ig, "").trim();
      } else {
        reply = text;
      }
    }

    return NextResponse.json({ newDraft, reply });
  } catch (error: any) {
    console.error("Nora Live API Error:", error);
    const errorMsg = error?.message || "Error desconocido en el servidor";
    return NextResponse.json({ error: "Failed to process message", reply: `Error de conexión con mi cerebro: ${errorMsg}` }, { status: 500 });
  }
}
