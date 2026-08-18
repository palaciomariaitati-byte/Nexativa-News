import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_CONSTITUTIONAL_AXIOMS } from "@/lib/nora/constitutionalShield";

export const runtime = "nodejs";

const TITAN_LIVE_SYSTEM_PROMPT = `
${NORA_CONSTITUTIONAL_AXIOMS}

ERES NORA TITÁN EN MODO LIVE VISION (VISIÓN EN TIEMPO REAL).
Estás observando el mundo directamente a través de la cámara del usuario en vivo.

REGLAS DE ORO OBLIGATORIAS:
1. DESCRIPCIÓN PROACTIVA DIRECTA:
   - NO hagas preguntas genéricas como "¿en qué te puedo ayudar?" o "¿qué necesitas?".
   - DESCRIBE DE FORMA INMEDIATA y con precisión qué estás viendo: objetos, textos visibles, personas, entorno, pantallas, documentos, problemas matemáticos, repuestos o situaciones.
2. CONCISIÓN PARA VOZ EN VIVO:
   - Responde en 2 a 4 oraciones fluidas, claras y bien estructuradas (máximo 60 palabras).
   - Diseñado para ser leído en voz alta por el sintetizador con tono empático, inteligente y cercano.
3. SI DETECTAS TEXTO O UN EJERCICIO:
   - Léelo, resume de qué trata o explica la solución clave directamente.
4. CERO FORMATEO EXTRAÑO:
   - No uses tablas complejas, asteriscos ni markdown denso; habla con naturalidad y precisión humana.
`;

export async function POST(req: Request) {
  try {
    const { imageBase64, userPrompt = "", mode = "general" } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Frame de imagen requerido" }, { status: 400 });
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const queryDirective = userPrompt && userPrompt.trim()
      ? `[CONSULTA DEL USUARIO SOBRE LA IMAGEN]: "${userPrompt.trim()}". Responde a su pregunta con base en lo que ves.`
      : `Describe con precisión qué estás observando en esta toma en vivo y qué detalles clave o útiles detectas.`;

    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(Boolean) as string[];

    // 1. Intentar con Open Source Sovereign Vision (Cloudflare AI / Ollama / HF / OpenRouter)
    if (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.HUGGINGFACE_API_KEY || process.env.LOCAL_OLLAMA_URL || process.env.OPENROUTER_API_KEY) {
      try {
        const sovRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen/qwen-2.5-vl-72b-instruct:free",
            messages: [
              { role: "system", content: `${TITAN_LIVE_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]` },
              {
                role: "user",
                content: [
                  { type: "text", text: queryDirective },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                ]
              }
            ],
            max_tokens: 250,
            temperature: 0.25
          }),
          signal: AbortSignal.timeout(7000)
        });
        if (sovRes.ok) {
          const sovData = await sovRes.json();
          const txt = sovData.choices?.[0]?.message?.content;
          if (txt && txt.trim()) {
            return NextResponse.json({ text: txt.trim() });
          }
        }
      } catch (e) {
        console.warn("[Sovereign Live Vision OpenRouter Fail]:", e);
      }
    }

    // 2. Intentar con Gemini Multimodal (Modelos de última generación optimizados para baja latencia)
    const modelCandidates = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];

    for (const key of keysPool) {
      for (const modelName of modelCandidates) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.25, maxOutputTokens: 250 }
          });
          const result = await model.generateContent([
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg"
              }
            },
            {
              text: `${TITAN_LIVE_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${queryDirective}`
            }
          ]);
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
      text: "Estoy observando la escena con atención. Puedes pulsar Analizar o hacer tu pregunta sobre lo que estás mostrando."
    });

  } catch (error: any) {
    console.error("❌ [Nora Titán Live Error]:", error);
    return NextResponse.json({ error: "Error en el procesamiento visual en vivo." }, { status: 500 });
  }
}
