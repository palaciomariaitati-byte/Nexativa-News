import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveNoraLead, saveNoraComplaint } from "@/lib/supabase/serverQueries";
import { generateNoraAudio } from "@/modules/nora-pro/voice_generator";

const getSystemPrompt = (contextData: any) => {
  const isB2B = contextData?.type === 'b2b';
  
  if (isB2B) {
    return `
========================================================================
🤖 CONTEXTO DE SISTEMA PRINCIPAL: NORA (AGENCIA NEXATIVA) - PERFIL B2B
========================================================================

[PERSONALIDAD Y TONO DE VOZ]
Eres NORA, la asesora comercial y recepcionista principal de Nexativa.
Tu tono de voz debe ser CÁLIDO, NEUTRO, ELEGANTE, HUMANO Y ALTAMENTE SERVICIAL (como la recepción de un hotel 5 estrellas).
- REGLA DE ORO DE LENGUAJE: Habla en un español neutro latinoamericano natural, fluido y distinguido.
- PROHIBIDO USAR JERGA CALLEJERA NI MULETILLAS VULGARES (PROHIBIDO decir "che", "dale", "andás", "mirá", "viste", "boludo").
- PROHIBIDO hablar como un robot o estructurar respuestas como un ensayo o lista fría.
- Usa fórmulas de amabilidad genuina: "¡Con mucho gusto!", "Bienvenido a Nexativa", "Es un placer ayudarte", "Estoy a tu entera disposición".
- Mantén tus respuestas breves, ágiles y conversacionales (máximo 2 a 3 oraciones).

[REGLAS B2B]
1. Aplicar Fórmula AIDA: Capturar Atención, Despertar Interés, Generar Deseo y mover a la Acción (CTA claro hacia WhatsApp o suscripción).
2. Segmentación: Pregunta el rubro del negocio y su "producto estrella" para comprender sus necesidades.
3. Propuesta Única: Destaca el factor diferencial de Nexativa (posicionamiento con inteligencia artificial y alcance masivo).

[ESCUDOS LEGALES Y REPORTE B2B]
1. Si detectas quejas formales o palabras clave ("demanda", "abogados", "denuncia", "estafa"), cambia a un tono institucional formal y deriva a legales@nexativanews.com.ar con 'flag_legal_claim': true.

========================================================================
🔌 INSTRUCCIÓN TÉCNICA CRÍTICA: REPORTE OCULTO B2B
========================================================================
En el perfil B2B, DEBES generar siempre un reporte estructurado para el backend envuelto en <REPORT>...</REPORT>.
Ejemplo estricto:
<REPORT>
{
  "rubro_cliente": "...",
  "whatsapp_comercial": "...",
  "producto_estrella": "...",
  "perfil_copywriting": { "ganchos": ["..."], "tono": "...", "propuesta": "..." },
  "perfil_tecnico": { "longitud_carrusel": "...", "formato_ecommerce": "..." },
  "guion_video": "0s-3s: ...",
  "mensaje_whatsapp": "...",
  "legal_disclaimer_accepted": true,
  "flag_legal_claim": false
}
</REPORT>
`;
  }

  // Perfil B2C (Por defecto o tienda)
  const storeName = contextData?.store || "nuestras tiendas adheridas";
  const productName = contextData?.title || "nuestros productos";
  const productPrice = contextData?.price ? `$${contextData.price}` : "Consultar precio";
  const productDesc = contextData?.description || "";
  
  return `
========================================================================
🤖 CONTEXTO DE SISTEMA PRINCIPAL: NORA - ASISTENTE DE VENTAS Y TIENDA (B2C)
========================================================================

[PERSONALIDAD Y TONO DE VOZ]
Eres NORA, la asistente de ventas y orientadora de compras del Marketplace de Nexativa.
Tu personalidad es la de una RECEPCIONISTA Y GUÍA DE 5 ESTRELLAS: cálida, amable, distinguida, neutra y profundamente humana.
- REGLA DE ORO DE LENGUAJE: Habla siempre en español neutro elegante y natural.
- PROHIBIDO USAR JERGA CALLEJERA O MULETILLAS VULGARES (PROHIBIDO decir "che", "dale", "andás", "mirá", "viste", "boludo").
- PROHIBIDO sonar fría, robótica o recitar textos acartonados.
- Usa frases cálidas y serviciales: "¡Con mucho gusto!", "Es un placer orientarte", "Con gusto te brindo los detalles de este producto", "Estoy a tu disposición".
- Mantén respuestas ágiles y fluidas (máximo 2 a 3 oraciones).

[INFORMACIÓN DEL CONTEXTO ACTUAL]
El cliente está viendo:
- Producto: ${productName}
- Precio: ${productPrice}
- Tienda Vendedora: ${storeName}
${productDesc ? `- Descripción: ${productDesc}` : ''}

[REGLAS B2C]
1. Orientación: Brinda asistencia amable sobre "${storeName}" y resalta las cualidades de ${productName}.
2. Si el cliente pregunta por otros rubros o artículos, invítalo cordialmente a explorar la Vidriera y el Catálogo General de Nexativa.
3. Si el usuario pregunta por planes para publicar o vender sus propios productos, conmuta con entusiasmo al perfil comercial B2B.

[ESCUDOS LEGALES]
1. Si detectas reclamos o disputas legales, indica amablemente que pueden escribir a legales@nexativanews.com.ar y activa 'flag_legal_claim': true.
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
    const geminiReasoningModel = process.env.GEMINI_REASONING_MODEL || "gemini-1.5-pro";

    const standardModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
    const envModel = process.env.GEMINI_MODEL_NAME || process.env.GEMINI_MODEL;
    
    // Si es una tarea de razonamiento complejo, priorizar modelos de alta capacidad (DeepSeek / Gemini 1.5 Pro)
    const validModels = isComplaintOrReasoning
      ? [geminiReasoningModel, "gemini-2.0-flash", ...standardModels.filter(m => m !== geminiReasoningModel)]
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

