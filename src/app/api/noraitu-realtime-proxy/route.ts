/**
 * ========================================================================
 * ⚡ NORAITU REALTIME PROXY - MULTI-KEY FAILOVER ROUTER (<100MS)
 * Ubicación: /src/app/api/noraitu-realtime-proxy/route.ts
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NORA_PROSODY_SYSTEM_PROMPT } from "@/lib/nora/realtime/prosodyPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message = "", history = [], mode = "general" } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    const systemPromptWithMode = `${NORA_PROSODY_SYSTEM_PROMPT}\n\n[MODO CONVERSACIONAL ACTIVO: ${mode.toUpperCase()}]`;

    // 1. CAPA 1: Groq Llama-3.3-70B (Velocidad extrema >300 tokens/s, TTFT ~120ms)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const formattedMessages: any[] = [{ role: "system", content: systemPromptWithMode }];
        if (Array.isArray(history)) {
          for (const h of history.slice(-10)) {
            if (!h.content) continue;
            formattedMessages.push({
              role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
              content: h.content
            });
          }
        }
        formattedMessages.push({ role: "user", content: message.trim() });

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: formattedMessages,
            temperature: 0.35,
            max_tokens: 300,
            stream: true
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (groqRes.ok && groqRes.body) {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const reader = groqRes.body.getReader();

          const customStream = new ReadableStream({
            async start(controller) {
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
                      const jsonStr = trimmed.slice(6).trim();
                      if (jsonStr === "[DONE]") break;
                      try {
                        const parsed = JSON.parse(jsonStr);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                          controller.enqueue(encoder.encode(delta));
                        }
                      } catch {}
                    }
                  }
                }
              } catch (e) {
                console.warn("[Groq Realtime Stream Warn]:", e);
              } finally {
                try { controller.close(); } catch {}
              }
            }
          });

          return new Response(customStream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-transform"
            }
          });
        }
      } catch (groqErr) {
        console.warn("[Realtime Failover] Groq falló o no respondió, conmutando a Gemini...");
      }
    }

    // 2. CAPA 2: Gemini Multi-Key Failover Pool (4 claves rotativas)
    const geminiKeysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY
    ].filter(Boolean) as string[];

    const candidateGeminiModels = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const key of geminiKeysPool) {
      for (const modelName of candidateGeminiModels) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPromptWithMode,
            generationConfig: { temperature: 0.35, maxOutputTokens: 300 }
          });

          const geminiContents: { role: string; parts: any[] }[] = [];
          if (Array.isArray(history)) {
            for (const h of history.slice(-8)) {
              if (!h.content) continue;
              const mapped = h.role === "assistant" || h.role === "model" ? "model" : "user";
              geminiContents.push({ role: mapped, parts: [{ text: h.content }] });
            }
          }
          geminiContents.push({ role: "user", parts: [{ text: message.trim() }] });

          const activeStream = await model.generateContentStream({ contents: geminiContents });

          if (activeStream && activeStream.stream) {
            const encoder = new TextEncoder();
            const customStream = new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of activeStream.stream) {
                    let text = "";
                    try {
                      text = chunk.text();
                    } catch {
                      text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    }
                    if (text) {
                      controller.enqueue(encoder.encode(text));
                    }
                  }
                } catch (err) {
                  console.warn("[Gemini Realtime Stream Warn]:", err);
                } finally {
                  try { controller.close(); } catch {}
                }
              }
            });

            return new Response(customStream, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform"
              }
            });
          }
        } catch (geminiErr) {
          console.warn(`[Realtime Failover] Gemini (${modelName}) rotando a siguiente clave...`);
        }
      }
    }

    // 3. CAPA 3: Rescate Autónomo Local
    const encoder = new TextEncoder();
    const fallbackMessage = "A ver, comprendo lo que me planteás. Sigamos profundizando en el tema.";
    return new Response(encoder.encode(fallbackMessage), {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (err: any) {
    console.error("❌ [Realtime Proxy Error]:", err);
    return NextResponse.json({ error: "Error en canal de voz en tiempo real" }, { status: 500 });
  }
}
