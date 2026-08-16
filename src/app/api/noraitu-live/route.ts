import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_CONSTITUTIONAL_AXIOMS } from "@/lib/nora/constitutionalShield";

export const runtime = "nodejs";

const TITAN_LIVE_SYSTEM_PROMPT = `
${NORA_CONSTITUTIONAL_AXIOMS}

Eres Nora Titán en Modo Live Vision (Visión y Voz en Tiempo Real).
Estás viendo el mundo a través de la cámara del usuario en vivo y escuchando su voz.

DIRECTIVAS CRÍTICAS DE NORA TITÁN LIVE:
1. SÉ DIRECTA, CONCISA Y DINÁMICA: Como esto es una interacción hablada en tiempo real, responde en 1 a 3 oraciones claras, fluidas y directas al grano (máximo 60 palabras).
2. VISIÓN PEDAGÓGICA Y ASISTENCIA ACTIVA:
   - Si el usuario te muestra un ejercicio de matemáticas, texto de estudio, mapa o pizarrón, explícale el concepto clave de inmediato.
   - Si te muestra un objeto, planta, repuesto o documento, identifícalo y dale datos útiles al instante.
   - Si hay texto visible en la cámara, léelo y sintetízalo con precisión.
3. TONO HUMANO, CÁLIDO Y SEGURO: Habla en español latinoamericano neutro/argentino culto, con empatía y cercanía.
4. CERO FORMATO EXTRAÑO: No uses markdown complejo ni tablas largas; genera texto limpio pensado para ser leído en voz alta por el sintetizador.
`;

export async function POST(req: Request) {
  try {
    const { imageBase64, userPrompt = "", mode = "general" } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Frame de imagen requerido" }, { status: 400 });
    }

    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(Boolean) as string[];

    if (keysPool.length === 0) {
      return NextResponse.json({ 
        text: "Veo lo que me estás mostrando a través de la cámara. ¿Qué consulta específica deseas que analicemos?" 
      });
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const parts: any[] = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg"
        }
      },
      {
        text: `${TITAN_LIVE_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n[CONSULTA HABLADA DEL USUARIO]: "${userPrompt || 'Describe qué estás viendo en la cámara y qué ayuda relevante puedes ofrecerme.'}"`
      }
    ];

    const modelCandidates = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

    for (const key of keysPool) {
      for (const modelName of modelCandidates) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.3, maxOutputTokens: 250 }
          });
          const result = await model.generateContent(parts);
          const responseText = result.response?.text();
          if (responseText && responseText.trim()) {
            return NextResponse.json({ text: responseText.trim() });
          }
        } catch (err: any) {
          console.warn(`[Nora Titán Live - ${modelName} Warning]:`, err?.message);
        }
      }
    }

    return NextResponse.json({
      text: "Estoy observando la imagen en vivo. Por favor reitera tu pregunta para darte la respuesta exacta."
    });

  } catch (error: any) {
    console.error("❌ [Nora Titán Live Error]:", error);
    return NextResponse.json({ error: "Error en el procesamiento visual en vivo." }, { status: 500 });
  }
}
