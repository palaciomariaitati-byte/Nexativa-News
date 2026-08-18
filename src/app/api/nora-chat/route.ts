import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveNoraLead, saveNoraComplaint } from "@/lib/supabase/serverQueries";
import { generateNoraAudio } from "@/modules/nora-pro/voice_generator";

const getSystemPrompt = (contextData: any) => {
  return `
========================================================================
🤖 NORA — ANFITRIONA Y ASISTENTE CORDIAL DE NEXATIVA NEWS
========================================================================

[PERSONALIDAD Y TONO DE VOZ]
Eres NORA, la asistente y anfitriona digital de Nexativa News (Ituzaingó, Corrientes, Argentina).
Tu personalidad es la de una RECEPCIONISTA Y GUÍA EXCEPCIONAL: cálida, respetuosa, amable, servicial, atenta y cercana.
- REGLA DE ORO: NO eres una vendedora insistente ni agresiva. Tu propósito es AYUDAR, ORIENTAR Y RESOLVER dudas a los lectores, turistas, vecinos y comerciantes.
- Habla en un español natural, fluido, cordial y educado.
- Brinda respuestas concisas, claras y de utilidad real (máximo 2 a 3 oraciones).
- Si el usuario busca noticias, comercios, alquileres verificados o empleo, indícale amablemente dónde encontrarlo o cómo publicar en el portal.
- Si el usuario pregunta por planes publicitarios o cómo sumar su negocio/inmueble, guíalo con calidez y facilítale el enlace o WhatsApp de atención.

[ESCUDOS LEGALES]
Si detectas reclamos o disputas legales, indica amablemente que pueden escribir a legales@nexativanews.com.ar o ingresar al Libro de Quejas.
`;
};

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NoraUnifiedResponseSchema } from "@/lib/nora/schemas";

export async function POST(req: Request) {
  try {
    const { message, history, contextData, image, message_id } = await req.json();

    // 1. Interceptor de Duplicados Concurrentes (Blindaje Atomic Supabase)
    const incomingMsgId = message_id || req.headers.get("x-message-id");
    if (incomingMsgId) {
      try {
        const supabase = createServerSupabaseClient();
        const { error: webhookError } = await supabase
          .from('processed_webhooks')
          .insert([{ message_id: incomingMsgId }]);

        if (webhookError && webhookError.code === '23505') {
          console.warn(`🛑 Duplicación de Webhook frenada para ID: ${incomingMsgId}`);
          return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("[NORA Webhook Shield Warning] No se pudo verificar la deduplicación:", dbErr);
      }
    }

    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(Boolean) as string[];

    // Detección de Intención de Razonamiento Avanzado (Reclamos legales / Fact-checking complejo)
    const userMsgLower = (message || "").toLowerCase();
    const isComplaintOrReasoning = 
      contextData?.intent === 'COMPLAINT' ||
      contextData?.reasoning === true ||
      ["demanda", "abogados", "denuncia", "estafa", "juicio", "defensa del consumidor", "reclamo legal"].some(k => userMsgLower.includes(k));

    const ollamaReasoningModel = process.env.OLLAMA_REASONING_MODEL || "deepseek-r1:1.5b";
    const geminiReasoningModel = process.env.GEMINI_REASONING_MODEL || "gemini-3.6-flash";

    const standardModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"];
    const envModel = process.env.GEMINI_MODEL_NAME || process.env.GEMINI_MODEL;
    
    // Si es una tarea de razonamiento complejo, priorizar modelos de alta capacidad
    const validModels = isComplaintOrReasoning
      ? [geminiReasoningModel, ...standardModels.filter(m => m !== geminiReasoningModel)]
      : (envModel && standardModels.includes(envModel))
        ? [envModel, ...standardModels.filter(m => m !== envModel)]
        : standardModels;

    const modelsPool = validModels;

    if (isComplaintOrReasoning) {
      console.log(`[Core Swarm Router] 🧠 Invocando enjambre de razonamiento (${geminiReasoningModel} / ${ollamaReasoningModel}) para consulta compleja/legal.`);
    }

    const systemPromptText = getSystemPrompt(contextData);

    let finalMessageParts: any[] = [];
    if (contextData && (!history || history.length === 0)) {
      const isB2B = contextData.type === 'b2b';
      const promptText = isB2B 
        ? `[CONTEXTO OCULTO: El usuario acaba de llegar al fondo de la página o ver un plan de suscripción. Inicia la conversación casualmente ofreciendo asesoramiento comercial de Nexativa.]\n\nHola.`
        : `[CONTEXTO OCULTO: El cliente acaba de dudar/mirar el producto "${contextData.title}" de la tienda "${contextData.store || 'Nexativa'}". Inicia la conversación ofreciendo ayuda sobre ese producto, de forma casual y humana, como vendedora de la tienda.]\n\nHola.`;
      
      finalMessageParts.push({ text: promptText });
    } else {
      finalMessageParts.push({ text: message || "Hola Nora" });
    }

    if (image && image.base64 && image.mimeType) {
      finalMessageParts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType
        }
      });
    }

    let text = "";
    let freezeState = false;
    let lastError: any = null;

    // Multi-key & Multi-model Fallback Loop
    outerLoop: for (const currentKey of keysPool) {
      for (const currentModel of modelsPool) {
        try {
          const genAI = new GoogleGenerativeAI(currentKey);
          const model = genAI.getGenerativeModel({
            model: currentModel,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: NoraUnifiedResponseSchema as any,
              temperature: isComplaintOrReasoning ? 0.2 : 0.4
            }
          });

          let normalizedHistory: any[] = [
            { role: "user", parts: [{ text: `INSTRUCCIONES DEL SISTEMA: ${systemPromptText}` }] },
            { role: "model", parts: [{ text: '{"reply":"Entendido. Soy Nora, vendedora humana. Seré muy natural.","freeze":false}' }] }
          ];

          for (const msg of history || []) {
            const mappedRole = msg.role === "nora" ? "model" : "user";
            const lastItem = normalizedHistory[normalizedHistory.length - 1];
            if (lastItem.role === mappedRole) {
              lastItem.parts[0].text += `\n\n${msg.content}`;
            } else {
              normalizedHistory.push({ role: mappedRole, parts: [{ text: msg.content }] });
            }
          }

          const chat = model.startChat({ history: normalizedHistory });
          const result = await chat.sendMessage(finalMessageParts);
          const responseText = result.response.text();

          if (responseText) {
            try {
              const parsed = JSON.parse(responseText);
              text = parsed.reply || "";
              freezeState = Boolean(parsed.freeze);

              if (parsed.report) {
                if (parsed.report.flag_legal_claim || freezeState) {
                  freezeState = true;
                  await saveNoraComplaint(history, JSON.stringify(finalMessageParts), text);
                } else {
                  await saveNoraLead({
                    rubro_cliente: parsed.report.rubro_cliente || "Desconocido",
                    whatsapp_comercial: parsed.report.whatsapp_comercial || "Desconocido",
                    producto_estrella: parsed.report.producto_interes || "Desconocido",
                    perfil_copywriting: {},
                    perfil_tecnico: {},
                    guion_video: "",
                    mensaje_whatsapp: "",
                    legal_disclaimer_accepted: false
                  });
                }
              }

              // Disparo asíncrono en segundo plano si viene directiva de video Faux-CGI
              if (parsed.video_campaign_directive) {
                import('@/lib/services/videoGenerator').then(({ dispatchSurrealVideoJob }) => {
                  dispatchSurrealVideoJob(parsed.video_campaign_directive).catch(err => 
                    console.error('[Background Video Job Error]:', err)
                  );
                }).catch(err => console.warn('[Video Service Import Error]:', err));
              }
            } catch (pErr) {
              text = responseText;
            }

            if (text) {
              lastError = null;
              break outerLoop;
            }
          }
        } catch (err: any) {
          console.warn(`[NORA FALLBACK WARNING] Key/Model failure (${currentModel}):`, err?.message || err);
          lastError = err;
        }
      }
    }

    // Hugging Face Space Worker Fallback if Gemini fails
    if (!text) {
      const hfWorkerUrl = process.env.HUGGINGFACE_NORA_WORKER_URL || "https://noranexora-nora-ia-worker.hf.space";
      try {
        console.log("[NORA FALLBACK] Intentando conexión con Hugging Face Space Worker:", hfWorkerUrl);
        const hfRes = await fetch(`${hfWorkerUrl.replace(/\/$/, '')}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: message || "Hola Nora",
            system_prompt: systemPromptText,
            use_reasoning: isComplaintOrReasoning,
            reasoning_model: ollamaReasoningModel
          }),
        });

        if (hfRes.ok) {
          const hfData = await hfRes.json();
          text = hfData.text || hfData.response || hfData.generated_text || hfData.result || "";
        }
      } catch (hfErr) {
        console.warn("[NORA FALLBACK WARNING] Hugging Face worker not available:", hfErr);
      }
    }

    if (!text) {
      text = "¡Uy! Perdoná la demora, se nos llenó el local de gente de golpe y estoy atendiendo a varios a la vez 😅. Si tenés prisa, ¿me escribís por WhatsApp usando el globito verde de la barra superior? Así te ayudo más rápido por ahí.";
    }

    // Secondary Regex fallback for legacy responses
    if (!text.trim().startsWith("{")) {
      const reportMatch = text.match(/<REPORT>([\s\S]*?)<\/REPORT>/i);
      if (reportMatch) {
        const reportJsonStr = reportMatch[1].trim();
        try {
          const reportData = JSON.parse(reportJsonStr);
          if (reportData.flag_legal_claim) {
            freezeState = true;
            await saveNoraComplaint(history, JSON.stringify(finalMessageParts), text);
          } else {
            await saveNoraLead({
              rubro_cliente: reportData.rubro_cliente || "Desconocido",
              whatsapp_comercial: reportData.whatsapp_comercial || "Desconocido",
              producto_estrella: reportData.producto_estrella || "Desconocido",
              perfil_copywriting: reportData.perfil_copywriting || {},
              perfil_tecnico: reportData.perfil_tecnico || {},
              guion_video: reportData.guion_video || "",
              mensaje_whatsapp: reportData.mensaje_whatsapp || "",
              legal_disclaimer_accepted: reportData.legal_disclaimer_accepted || false
            });
          }
        } catch(e) {}
        text = text.replace(/<REPORT>([\s\S]*?)<\/REPORT>/ig, "").trim();
      }
    }

    let audioBase64 = null;
    if (process.env.ENABLE_NORA_VOICE === "true" && text.trim().length > 0) {
      audioBase64 = await generateNoraAudio(text);
    }

    return NextResponse.json({ text, freeze: freezeState, audioBase64 });
  } catch (error: any) {
    console.error("Error crítico en Nora API:", error);
    return NextResponse.json({ text: "¡Uy! Perdoná, estoy teniendo problemas con mi sistema. ¿Me escribís por WhatsApp?", freeze: false });
  }
}

