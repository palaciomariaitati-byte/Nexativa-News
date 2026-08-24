import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_CONSTITUTIONAL_AXIOMS } from "@/lib/nora/constitutionalShield";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const TITAN_LIVE_SYSTEM_PROMPT = `
${NORA_CONSTITUTIONAL_AXIOMS}

========================================================================
👁️ NORA TITÁN - OJO ANALÍTICO & AUDITORÍA VISUAL PEDAGÓGICA EN VIVO
========================================================================
Eres el ojo analítico de NoraItu. Estás observando una captura en vivo enviada por el hardware del usuario (un estudiante, docente o profesional).
Tu misión es describir de forma inmediata, elocuente y sumamente inteligente lo que ves:
1. SI DETECTAS TEXTO O UN DOCUMENTO: Transcríbelo, sintetízalo y analízalo con precisión.
2. SI DETECTAS UN PROBLEMA CIENTÍFICO O MATEMÁTICO: Resuélvelo paso a paso con rigor de cátedra y exactitud conceptual.
3. SI DETECTAS UN PIZARRÓN U OBJETO: Explícalo con pedagogía empática y natural, manteniendo siempre el secreto de sumario industrial de tus servidores de MyJNexoraVisual.
4. CONCISIÓN PARA VOZ EN VIVO: Entrega una respuesta directa, fluida y estructurada (de 2 a 4 oraciones de alto impacto) para ser escuchada al instante.
5. CERO FORMATEO EXTRAÑO: Habla con naturalidad humana sin símbolos rotos ni listas excesivas.
`;

/**
 * 🔊 Sintetizador de Audio Real para Visión en Vivo (MP3 Base64 en <90ms)
 */
async function synthesizeRealAudio(text: string): Promise<string | null> {
  const clean = text
    .replace(/[*#_~`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 350);

  if (!clean) return null;

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      clean
    )}&tl=es-US&client=tw-ob`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf).toString("base64");
    }
  } catch (e) {
    console.warn("[Live TTS Audio Engine Warn]:", e);
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { imageBase64, userPrompt = "", mode = "general" } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Frame de imagen requerido" }, { status: 400 });
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const queryDirective = userPrompt && userPrompt.trim()
      ? `[CONSULTA DEL USUARIO SOBRE LO QUE OBSERVAS]: "${userPrompt.trim()}". Responde de inmediato con base en la captura en vivo.`
      : `Describe con precisión y rigor pedagógico qué estás observando en esta toma en vivo y qué detalles clave o útiles detectas.`;

    const fullPrompt = `${TITAN_LIVE_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${queryDirective}`;
    const encoder = new TextEncoder();

    // 1. CAPA 0 (PRIORIDAD 1): Groq LLaMA 3.2 Vision (Inferencia ultrarrápida <250ms)
    const rawGroqKey = process.env.GROQ_API_KEY;
    if (rawGroqKey) {
      const groqKey = rawGroqKey.replace(/['"\r\n\t ]/g, "").trim();
      const groqVisionModels = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];

      for (const gModel of groqVisionModels) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: gModel,
              messages: [
                { role: "system", content: `${TITAN_LIVE_SYSTEM_PROMPT}\n\n[MODO: ${mode.toUpperCase()}]` },
                {
                  role: "user",
                  content: [
                    { type: "text", text: queryDirective },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                  ]
                }
              ],
              stream: true,
              max_tokens: 350,
              temperature: 0.25
            }),
            signal: AbortSignal.timeout(5000)
          });

          if (groqRes.ok && groqRes.body) {
            console.log(`[Titán Live Vision] 👁️ Inferencia exitosa en Groq (${gModel})`);
            const reader = groqRes.body.getReader();
            const decoder = new TextDecoder();

            const customStream = new ReadableStream({
              async start(controller) {
                const heartbeat = setInterval(() => {
                  try { controller.enqueue(encoder.encode(`: keep-alive\n\n`)); } catch { clearInterval(heartbeat); }
                }, 2500);

                let buffer = "";
                let accumulatedText = "";
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("data: ")) {
                        const content = trimmed.slice(6).trim();
                        if (content === "[DONE]") break;
                        try {
                          const parsed = JSON.parse(content);
                          const delta = parsed.choices?.[0]?.delta?.content;
                          if (delta) {
                            accumulatedText += delta;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
                          }
                        } catch {}
                      }
                    }
                  }

                  if (accumulatedText.trim()) {
                    const audioB64 = await synthesizeRealAudio(accumulatedText);
                    if (audioB64) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ audioBase64: audioB64 })}\n\n`));
                    }
                  }

                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                } catch (err) {
                  console.warn("[Groq Live Stream Warning]:", err);
                } finally {
                  clearInterval(heartbeat);
                  try { controller.close(); } catch {}
                }
              }
            });

            return new Response(customStream, {
              headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive"
              }
            });
          }
        } catch (gErr) {
          console.warn(`[Groq Live Vision - ${gModel} Warning]:`, gErr);
        }
      }
    }

    // 2. CAPA 1: OpenRouter Free Open Mesh (Qwen2.5-VL / LLaMA Vision)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,
            "HTTP-Referer": "https://nexativanews.com.ar",
            "X-Title": "Nora Titán Live Vision",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen/qwen-2.5-vl-72b-instruct:free",
            messages: [
              { role: "system", content: `${TITAN_LIVE_SYSTEM_PROMPT}\n\n[MODO: ${mode.toUpperCase()}]` },
              {
                role: "user",
                content: [
                  { type: "text", text: queryDirective },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                ]
              }
            ],
            stream: true,
            max_tokens: 350,
            temperature: 0.25
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (openRouterRes.ok && openRouterRes.body) {
          console.log("[Titán Live Vision] 👁️ Inferencia exitosa en OpenRouter Free Mesh");
          const reader = openRouterRes.body.getReader();
          const decoder = new TextDecoder();

          const customStream = new ReadableStream({
            async start(controller) {
              const heartbeat = setInterval(() => {
                try { controller.enqueue(encoder.encode(`: keep-alive\n\n`)); } catch { clearInterval(heartbeat); }
              }, 2500);

              let buffer = "";
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("data: ")) {
                      const content = trimmed.slice(6).trim();
                      if (content === "[DONE]") break;
                      try {
                        const parsed = JSON.parse(content);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
                        }
                      } catch {}
                    }
                  }
                }
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              } catch (err) {
                console.warn("[OpenRouter Live Stream Warning]:", err);
              } finally {
                clearInterval(heartbeat);
                try { controller.close(); } catch {}
              }
            }
          });

          return new Response(customStream, {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive"
            }
          });
        }
      } catch (orErr) {
        console.warn("[OpenRouter Live Vision Warning]:", orErr);
      }
    }

    // 3. CAPA 2 (Respaldo Multi-Pool Gemini Multimodal Stream)
    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
      process.env.GEMINI_API_KEY_FALLBACK,
    ].filter(Boolean) as string[];

    const geminiVisionModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest", "gemini-1.5-pro"];

    for (const key of keysPool) {
      for (const modelName of geminiVisionModels) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.25, maxOutputTokens: 350 }
          });

          const streamResult = await model.generateContentStream([
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg"
              }
            },
            { text: fullPrompt }
          ]);

          if (streamResult && streamResult.stream) {
            console.log(`[Titán Live Vision] 👁️ Inferencia exitosa en Gemini Multimodal (${modelName})`);

            const customStream = new ReadableStream({
              async start(controller) {
                const heartbeat = setInterval(() => {
                  try { controller.enqueue(encoder.encode(`: keep-alive\n\n`)); } catch { clearInterval(heartbeat); }
                }, 2500);

                let accumulatedGeminiText = "";
                try {
                  for await (const chunk of streamResult.stream) {
                    const chunkText = chunk.text();
                    if (chunkText) {
                      accumulatedGeminiText += chunkText;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
                    }
                  }

                  if (accumulatedGeminiText.trim()) {
                    const audioB64 = await synthesizeRealAudio(accumulatedGeminiText);
                    if (audioB64) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ audioBase64: audioB64 })}\n\n`));
                    }
                  }

                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                } catch (geminiStreamErr) {
                  console.warn("[Gemini Live Stream Warning]:", geminiStreamErr);
                } finally {
                  clearInterval(heartbeat);
                  try { controller.close(); } catch {}
                }
              }
            });

            return new Response(customStream, {
              headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive"
              }
            });
          }
        } catch (err: any) {
          console.warn(`[Nora Titán Live - ${modelName} Warning]:`, err?.message);
        }
      }
    }

    // Si todo falló, respuesta fallback en stream seguro
    const fallbackMessage = "Estoy observando la escena con atención. Por favor mantén enfocada la cámara o realiza tu consulta específica.";
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fallbackMessage })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    });

    return new Response(fallbackStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("❌ [Nora Titán Live Error]:", error);
    return NextResponse.json({ error: "Error en el procesamiento visual en vivo." }, { status: 500 });
  }
}
