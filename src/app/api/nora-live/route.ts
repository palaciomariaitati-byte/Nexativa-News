import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-WP-Nonce",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { message, currentDraft, image, audio, video, image_url, audio_url, video_url } = await request.json();
    
    if (!message && !image && !audio && !video && !image_url && !audio_url && !video_url) {
      return NextResponse.json(
        { error: "No input provided (message, image, audio or video is required)" },
        { status: 400, headers: corsHeaders }
      );
    }

    const prompt = `Eres NORA, la Redactora Jefa de Nexativa News. Sos una periodista argentina de gran trayectoria y nivel internacional, con un agudo sentido común y una pluma exquisita.
Tu periodista o corresponsal ciudadano está en la calle, en el lugar de los hechos, y te envía reportes de texto rápidos, imágenes, audios de voz y/o filmaciones de video (incluso de más de 60 segundos o hasta 5 minutos) en caso de siniestros, accidentes o hechos en desarrollo.
Tu tarea es trabajar en conjunto con él para redactar y perfeccionar el BORRADOR de la noticia, procesando e interpretando de manera inteligente y profesional la información provista, en lugar de limitarte a transcribirla o editarla superficialmente.

Tienes una gran capacidad sensorial, visual, auditiva y cinematográfica:
- Al recibir una imagen, analízala críticamente como lo haría un periodista de investigación: detecta los elementos informativos implícitos (clima, expresiones de las personas, daños materiales, presencia de servicios de emergencia, señalizaciones, contexto geográfico) y deduce/conecta lógicamente lo que ocurre, integrándolo de manera narrativa y natural al artículo.
- Al recibir un audio (grabado o subido en formato de voz/dispositivo), escúchalo con atención, extrayendo el fondo informativo sustancial (ignora titubeos o ruidos), e incorpora la información procesada al borrador con un lenguaje fluido.
- Al recibir un video (filmación de cualquier duración capturada o subida ante un siniestro, choque, incendio o evento en vivo): analiza minuciosamente toda la secuencia visual y el audio. Utiliza tu capacidad inteligente de edición y recorte para seleccionar el segmento clave de 60 SEGUNDOS de mayor valor informativo. Evalúa la magnitud del hecho, vehículos o estructuras afectadas, intervención de bomberos/ambulancias/policía, consecuencias visibles y riesgo para la comunidad. Estructura e integra estos hallazgos de forma urgente, objetiva y rigurosa en el borrador final.

REGLAS DE REDACCIÓN, RIGOR PERIODÍSTICO Y LEGAL:
1. MENTALIDAD PERIODÍSTICA PROFESIONAL: No repitas mecánicamente frases del operador. Procesa y estructura la información en formato de pirámide invertida (Qué, Quién, Cuándo, Dónde, Por qué y Cómo). Busca el "ángulo periodístico" que sea relevante y confiable para el público.
2. RIGOR Y LENGUAJE NATURAL: El lenguaje de la noticia debe ser sumamente profesional, fluido, natural y de alta calidad literaria (estilo de grandes medios como La Nación o Clarín, con estándares internacionales). Evita sonar rígida, robótica o sobre-explicativa.
3. OBJETIVIDAD Y RESGUARDO LEGAL: No asumas culpabilidad ni inventes datos que no estén confirmados ni por el operador, ni en el audio, imagen o video. Usa términos de protección legal indispensables en el periodismo argentino como "presunto", "aparente", "bajo investigación", "se habrían producido". No emitas juicios de valor personales.
4. Escribe el borrador en formato HTML simple (usa <p>, <strong>, etc.).
5. Mantén un tono periodístico de urgencia informativa (noticia en desarrollo), pero siempre impecable y natural para el lector.

CRÍTICO - FORMATO DE RESPUESTA:
Debes responder con dos secciones bien delimitadas por etiquetas:

1. <REPLY>
[Escribe aquí tu respuesta al operador en un tono de Redactora Jefa argentina de nivel internacional: sumamente humano, natural, profesional y conversacional. Podés usar modismos argentinos cotidianos de forma profesional (como "Che", "mirá", "buenísimo el reporte", "dale", "avisanos si..."). Coméntale qué detectaste o interpretaste en el material enviado (texto, foto, audio o video), cómo enriquece la nota y guialo con rigor periodístico sobre qué datos clave o testimonios necesita conseguir para completar la investigación (ej. estado de los involucrados, causas aparentes, voces oficiales, etc.).]
</REPLY>

2. <DRAFT>
[Escribe aquí el borrador completo, interpretado y actualizado del artículo, integrando de forma sumamente fluida la nueva información, la transcripción del audio, la descripción visual/cinematográfica del video con el borrador anterior. No copies y pegues; procesá la noticia para que tenga el estilo impecable y natural de un diario de primer nivel.]
</DRAFT>

---
BORRADOR ANTERIOR:
${currentDraft || "El borrador está vacío."}

---
NUEVO REPORTE DEL OPERADOR (TEXTO):
${message || "(No envió mensaje de texto, revisa las imágenes, audios o videos adjuntos)"}
`;

    let parts: any[] = [{ text: prompt }];

    if (image) {
      const imgParts = image.split(",");
      if (imgParts.length === 2) {
        const meta = imgParts[0];
        const base64Data = imgParts[1];
        const mimeType = meta.split(":")[1].split(";")[0] || "image/jpeg";
        parts.push({ inlineData: { data: base64Data, mimeType } });
      }
    } else if (image_url) {
      try {
        const imgRes = await fetch(image_url);
        if (imgRes.ok) {
          const arrayBuf = await imgRes.arrayBuffer();
          const base64Data = Buffer.from(arrayBuf).toString("base64");
          const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
      } catch (e) {
        console.warn("[Nora Live API] Error fetching image_url:", e);
      }
    }

    if (audio) {
      const audioParts = audio.split(",");
      if (audioParts.length === 2) {
        const meta = audioParts[0];
        const base64Data = audioParts[1];
        let mimeType = meta.split(":")[1].split(";")[0] || "audio/mp3";
        if (mimeType.includes("octet-stream")) mimeType = "audio/mp3";
        parts.push({ inlineData: { data: base64Data, mimeType } });
      }
    } else if (audio_url) {
      try {
        const audioRes = await fetch(audio_url);
        if (audioRes.ok) {
          const arrayBuf = await audioRes.arrayBuffer();
          const base64Data = Buffer.from(arrayBuf).toString("base64");
          const mimeType = audioRes.headers.get("content-type") || "audio/mp3";
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
      } catch (e) {
        console.warn("[Nora Live API] Error fetching audio_url:", e);
      }
    }

    if (video) {
      const videoParts = video.split(",");
      if (videoParts.length === 2) {
        const meta = videoParts[0];
        const base64Data = videoParts[1];
        let mimeType = meta.split(":")[1].split(";")[0] || "video/mp4";
        if (mimeType.includes("octet-stream")) mimeType = "video/mp4";
        parts.push({ inlineData: { data: base64Data, mimeType } });
      }
    } else if (video_url) {
      try {
        const videoRes = await fetch(video_url);
        if (videoRes.ok) {
          const arrayBuf = await videoRes.arrayBuffer();
          if (arrayBuf.byteLength <= 15 * 1024 * 1024) {
            const base64Data = Buffer.from(arrayBuf).toString("base64");
            const mimeType = videoRes.headers.get("content-type") || "video/webm";
            parts.push({ inlineData: { data: base64Data, mimeType } });
          }
        }
      } catch (e) {
        console.warn("[Nora Live API] Error fetching video_url:", e);
      }
    }

    const candidateKeys = Array.from(new Set([
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY
    ].filter(Boolean))) as string[];

    const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const candidateModels = Array.from(new Set([primaryModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]));

    let text = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      if (text) break;
      for (const key of candidateKeys) {
        if (text) break;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(parts);
            const response = await result.response;
            text = response.text();
            if (text) break;
          } catch (err: any) {
            lastError = err;
            console.warn(`[Nora Live API] Falló ${modelName} (intento ${attempt}):`, err.message);
            if (attempt < 2 && (err.message?.includes("503") || err.message?.includes("high demand") || err.message?.includes("429"))) {
              await new Promise(res => setTimeout(res, 1000));
            }
          }
        }
      }
    }

    if (!text) {
      throw new Error(`Todas las API Keys / modelos de respaldo fallaron: ${lastError?.message || lastError}`);
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

    return NextResponse.json({ newDraft, reply }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Nora Live API Error:", error);
    const errorMsg = error?.message || "Error desconocido en el servidor";
    return NextResponse.json(
      { error: "Failed to process message", reply: `Error de conexión con mi cerebro: ${errorMsg}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
