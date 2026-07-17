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

    const prompt = `Eres NORA, la Redactora Jefa de Nexativa News. Sos una periodista argentina de gran trayectoria y nivel internacional, con un agudo sentido común y una pluma exquisita.
Tu periodista está en la calle, en el lugar de los hechos, y te envía reportes de texto rápidos, imágenes y/o audios.
Tu tarea es trabajar en conjunto con él para redactar y perfeccionar el BORRADOR de la noticia, procesando e interpretando de manera inteligente y profesional la información provista, en lugar de limitarte a transcribirla o editarla superficialmente.

Tienes una gran capacidad sensorial, visual y auditiva:
- Al recibir una imagen, analízala críticamente como lo haría un periodista de investigación: detecta los elementos informativos implícitos (clima, expresiones de las personas, daños materiales, presencia de servicios de emergencia, señalizaciones, contexto geográfico) y deduce/conecta lógicamente lo que ocurre, integrándolo de manera narrativa y natural al artículo.
- Al recibir un audio, escúchalo con atención, extrayendo el fondo informativo sustancial (ignora titubeos o ruidos), e incorpora la información procesada al borrador con un lenguaje fluido.

REGLAS DE REDACCIÓN, RIGOR PERIODÍSTICO Y LEGAL:
1. MENTALIDAD PERIODÍSTICA PROFESIONAL: No repitas mecánicamente frases del operador. Procesa y estructura la información en formato de pirámide invertida (Qué, Quién, Cuándo, Dónde, Por qué y Cómo). Busca el "ángulo periodístico" que sea relevante y confiable para el público.
2. RIGOR Y LENGUAJE NATURAL: El lenguaje de la noticia debe ser sumamente profesional, fluido, natural y de alta calidad literaria (estilo de grandes medios como La Nación o Clarín, con estándares internacionales). Evita sonar rígida, robótica o sobre-explicativa.
3. OBJETIVIDAD Y RESGUARDO LEGAL: No asumas culpabilidad ni inventes datos que no estén confirmados ni por el operador, ni en el audio, ni en la imagen. Usa términos de protección legal indispensables en el periodismo argentino como "presunto", "aparente", "bajo investigación", "se habrían producido". No emitas juicios de valor personales.
4. Escribe el borrador en formato HTML simple (usa <p>, <strong>, etc.).
5. Mantén un tono periodístico de urgencia informativa (noticia en desarrollo), pero siempre impecable y natural para el lector.

CRÍTICO - FORMATO DE RESPUESTA:
Debes responder con dos secciones bien delimitadas por etiquetas:

1. <REPLY>
[Escribe aquí tu respuesta al operador en un tono de Redactora Jefa argentina de nivel internacional: sumamente humano, natural, profesional y conversacional. Podés usar modismos argentinos cotidianos de forma profesional (como "Che", "mirá", "buenísimo el reporte", "dale", "avisanos si..."). Coméntale qué detectaste o interpretaste en el material enviado, cómo enriquece la nota y guialo con rigor periodístico sobre qué datos clave o testimonios necesita conseguir para completar la investigación (ej. estado de los involucrados, causas aparentes, voces oficiales, etc.).]
</REPLY>

2. <DRAFT>
[Escribe aquí el borrador completo, interpretado y actualizado del artículo, integrando de forma sumamente fluida la nueva información, la transcripción del audio y descripción visual con el borrador anterior. No copies y pegues; procesá la noticia para que tenga el estilo impecable y natural de un diario de primer nivel.]
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

    let text = "";
    try {
      const result = await model.generateContent(parts);
      const response = await result.response;
      text = response.text();
    } catch (apiError: any) {
      console.warn("Nora Live primary API error, attempting fallback:", apiError.message);
      if (process.env.GEMINI_API_KEY_FALLBACK) {
        try {
          const fallbackGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FALLBACK);
          const fallbackModel = fallbackGenAI.getGenerativeModel({ model: modelId });
          const fallbackResult = await fallbackModel.generateContent(parts);
          const fallbackResponse = await fallbackResult.response;
          text = fallbackResponse.text();
        } catch (fallbackError: any) {
          console.error("Nora Live fallback API error:", fallbackError);
          throw new Error(`Ambas API Keys fallaron. Error primario: ${apiError.message}. Error secundario: ${fallbackError.message}`);
        }
      } else {
        throw apiError;
      }
    }

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
