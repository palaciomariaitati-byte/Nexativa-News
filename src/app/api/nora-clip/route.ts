import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { url, videoTitle, rawText, clipType = "mixed" } = await request.json();

    if (!url && !rawText) {
      return NextResponse.json({ error: "Se requiere la URL del video de YouTube o un texto/transcripción." }, { status: 400 });
    }

    const candidateKeys = Array.from(new Set([
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY
    ].filter(Boolean))) as string[];

    const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const candidateModels = Array.from(new Set([primaryModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]));

    const prompt = `Eres NORA, la Redactora Jefa y Productora Audiovisual de la Cadena de Noticias Nexativa & Cadena 4.
Tu trabajo es analizar un video/evento periodístico y extraer:
1. MEJORES CLIPS DE VIDEO CORTOS (30s - 90s) para Reels / Shorts.
2. PROPUESTA DE FLASH DE NOTICIAS (1 a 5 minutos) combinando los momentos clave de mayor impacto periodístico.

URL del Video: ${url || "No provista"}
Título/Contexto del Video: ${videoTitle || "Evento Periodístico / Cobertura en Vivo"}
Contenido/Transcripción disponible: ${rawText || "Analizar el contenido del enlace indicado."}
Tipo de Clips solicitados: ${clipType}

INSTRUCCIONES DE EXTRACCIÓN:
Genera un objeto JSON estricto con:
- "video_summary": Resumen general del evento en 2 oraciones.
- "total_clips_found": Número total de clips.
- "suggested_news_flash": Objeto con { "title": "...", "summary": "...", "target_duration_seconds": 180, "clip_ids": [1, 2, 3] } para armar el noticiero rápido de 1 a 5 minutos.
- "clips": Lista de entre 3 y 6 clips individuales. Cada uno con:
  - "clip_id": Número (1, 2, 3...)
  - "title": Titular impactante periodístico.
  - "start_time_seconds": Segundo inicio.
  - "end_time_seconds": Segundo fin.
  - "start_timestamp": "MM:SS" o "HH:MM:SS".
  - "end_timestamp": "MM:SS" o "HH:MM:SS".
  - "duration_seconds": Duración en segundos.
  - "summary": Síntesis periodística.
  - "impact_score": Puntaje 1-10.
  - "category": "política", "local", "nacional", "internacional", "sociedad".
  - "social_caption": Copia lista para redes con hashtags.

FORMATO DE RESPUESTA JSON REQUERIDO:
{
  "video_summary": "...",
  "total_clips_found": 4,
  "suggested_news_flash": {
    "title": "FLASH NOTICIAS: Resumen Ejecutivo del Evento",
    "summary": "Compilado de 3 minutos con las declaraciones más fuertes...",
    "target_duration_seconds": 180,
    "clip_ids": [1, 2]
  },
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
    let lastError: any = null;

    for (const modelName of candidateModels) {
      if (text) break;
      for (const key of candidateKeys) {
        if (text) break;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
            if (text) break;
          } catch (err: any) {
            lastError = err;
            console.warn(`[Nora Clip API] Falló ${modelName} (intento ${attempt}):`, err.message);
            if (attempt < 2 && (err.message?.includes("503") || err.message?.includes("high demand") || err.message?.includes("429"))) {
              await new Promise(res => setTimeout(res, 1000));
            }
          }
        }
      }
    }

    if (!text) {
      throw new Error(`Error en la extracción de clips: ${lastError?.message || lastError}`);
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
