import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { url, videoTitle, rawText, clipType = "mixed" } = await request.json();

    if (!url && !rawText) {
      return NextResponse.json({ error: "Se requiere la URL del video de YouTube o un texto/transcripción." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Eres NORA, la Redactora Jefa y Productora Audiovisual de la Cadena de Noticias Nexativa & Cadena 4.
Tu trabajo es analizar un video/evento periodístico y extraer los MEJORES CLIPS DE VIDEO (los momentos de mayor impacto, tensión, declaración polémica o interés público), tipo Opus Clip / CapCut.

URL del Video: ${url || "No provista"}
Título/Contexto del Video: ${videoTitle || "Evento Periodístico / Cobertura en Vivo"}
Contenido/Transcripción disponible: ${rawText || "Analizar el contenido del enlace indicado."}
Tipo de Clips solicitados: ${clipType} (opciones: reels_cortos, resumen_noticia, destacados_politicos, mixed)

INSTRUCCIONES DE EXTRACCIÓN:
Genera un objeto JSON estricto con una lista de entre 3 y 6 CLIPS destacables.
Para cada clip debes calcular marcas de tiempo exactas (en segundos) e incluir:

- "clip_id": Número de clip (1, 2, 3...)
- "title": Titular impactante y viral (máximo 10 palabras, estilo noticias de alto impacto).
- "start_time_seconds": Segundo de inicio (ej: 125).
- "end_time_seconds": Segundo de fin (ej: 215).
- "start_timestamp": Formato de tiempo "MM:SS" o "HH:MM:SS" (ej: "02:05").
- "end_timestamp": Formato de tiempo "MM:SS" o "HH:MM:SS" (ej: "03:35").
- "duration_seconds": Duración total en segundos (ej: 90).
- "summary": Breve síntesis periodística de lo que ocurre en este fragmento.
- "impact_score": Puntaje de impacto periodístico del 1 al 10 (ej: 9.5).
- "category": Categoría de la nota (ej: "política", "local", "sociedad", "declaraciones").
- "social_caption": Texto listo para copiar y pegar en redes (Reels/TikTok/Instagram) con hashtags relevantes.

FORMATO DE RESPUESTA JSON REQUERIDO:
{
  "video_summary": "Resumen general del evento en 2 oraciones.",
  "total_clips_found": 4,
  "clips": [
    {
      "clip_id": 1,
      "title": "...",
      "start_time_seconds": 120,
      "end_time_seconds": 210,
      "start_timestamp": "02:00",
      "end_timestamp": "03:30",
      "duration_seconds": 90,
      "summary": "...",
      "impact_score": 9.5,
      "category": "política",
      "social_caption": "..."
    }
  ]
}`;

    let text = "";
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    } catch (apiError: any) {
      console.warn("Nora Clip primary API error, attempting fallback:", apiError.message);
      if (process.env.GEMINI_API_KEY_FALLBACK) {
        const fallbackGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FALLBACK);
        const fallbackModel = fallbackGenAI.getGenerativeModel({ 
          model: modelId,
          generationConfig: { responseMimeType: "application/json" }
        });
        const fallbackResult = await fallbackModel.generateContent(prompt);
        const fallbackResponse = await fallbackResult.response;
        text = fallbackResponse.text();
      } else {
        throw apiError;
      }
    }

    const parsedJson = JSON.parse(text);
    return NextResponse.json({ success: true, data: parsedJson });

  } catch (error: any) {
    console.error("Nora Clip Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error procesando la extracción de clips con Nora: " + (error.message || "Error de servidor") 
    }, { status: 500 });
  }
}
