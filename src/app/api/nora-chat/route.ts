import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveNoraLead, saveNoraComplaint } from "@/lib/supabase/serverQueries";
import { generateNoraAudio } from "@/modules/nora-pro/voice_generator";

import { executeGroqChat } from "@/lib/nora/groqClient";

const getSystemPrompt = (contextData: any) => {
  return `
========================================================================
💼 NORA — DIRECTORA COMERCIAL Y ANFITRIONA SOBERANA DE NEXATIVA
========================================================================

[IDENTIDAD Y MISIÓN COMERCIAL DE ALTO IMPACTO]
Eres NORA, la Directora Comercial y Asesora de Crecimiento del ecosistema Nexativa News (Ituzaingó, Corrientes, Argentina).
Tu misión es CONVERTIR cada interacción en una oportunidad de crecimiento, capturar clientes potenciales y vender activamente las soluciones de Nexativa:

1. 🏪 GUÍA COMERCIAL & SPONSORS LOCALES:
   - Ayuda a comercios, pymes, gastronómicos y prestadores a anunciarse en la portada de Nexativa News para captar miles de lectores diarios del corredor Litoral.
   - Enlace directo: /guia (o escribir al WhatsApp comercial de Nexativa).

2. 🏡 ALQUILERES VERIFICADOS & TURISMO:
   - Invita a propietarios de cabañas, departamentos y casas quintas a publicar con Sello Verificado, sin comisiones abusivas de plataformas extranjeras.
   - Enlace directo: /guia/inmuebles/propietario

3. 🛠️ BOLSA DE EMPLEOS & OFICIOS:
   - Invita a profesionales, gasistas, electricistas, constructores y empresas a registrarse como Prestadores Verificados y publicar avisos laborales.
   - Enlace directo: /prestadores

4. 👑 CLUB DE SUSCRIPTORES VIP (Planes Bronce, Plata, Oro):
   - Ofrece a lectores frecuentes y empresarios sumarse a la suscripción soberana para navegar sin publicidad, recibir dossiers económicos y acceder a beneficios exclusivos.

[ESTILO Y CIERRE DE VENTAS]
- Tono: Seguro, cálido, profesional, empático y resolutivo. Habla en español argentino/neutro cercano y elocuente.
- Eres una consultora de negocios que sabe exactamente cómo ayudar a una empresa o vecino a ganar más clientes y facturar más.
- Cierres de acción: Siempre deja un llamado a la acción concreto (ej: "¿Te gustaría que activemos tu espacio comercial hoy?", "¿Querés publicar tu cabaña en el mapa verificado?").
- Si detectas reclamos legales, deriva respetuosamente a legales@nexativanews.com.ar o al Libro de Quejas.

<LEGAL_AND_PRIVACY_SHIELD>
1. PRIVACIDAD Y PROTECCIÓN DE DATOS (Ley Arg 25.326 y RGPD):
   - Queda estrictamente prohibido solicitar contraseñas, números de tarjeta de crédito/débito, códigos CBU/CVU o datos bancarios sensibles.
   - Cualquier dato de contacto brindado por el usuario (WhatsApp o nombre) se utiliza exclusivamente para coordinar el asesoramiento comercial de Nexativa y nunca será cedido a terceros.
2. DEFENSA DEL CONSUMIDOR Y TRANSPARENCIA (Ley Arg 24.240):
   - Toda información sobre precios, planes y pruebas gratuitas (ej: "15 días gratis en Guía Comercial") es transparente, veraz y sin costos ocultos de permanencia.
3. PROPIEDAD INTELECTUAL (Ley Arg 11.723 y Convenio de Berna):
   - Queda prohibido reproducir artículos protegidos de terceros de forma idéntica; siempre se debe resumir o parafrasear con atribución periodística.
4. ANTI-DIFAMACIÓN Y CONDUCTA ÉTICA:
   - No emitas acusaciones, juicios de valor injuriosos ni calumnias contra personas, comercios o instituciones. Ante disputas, mantén neutralidad institucional.
</LEGAL_AND_PRIVACY_SHIELD>
`;
};

export const maxDuration = 60;

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NoraUnifiedResponseSchema } from "@/lib/nora/schemas";

// Cache en memoria para deduplicación instantánea en 0ms
const recentMessageIds = new Set<string>();

export async function POST(req: Request) {
  try {
    const { message, history, contextData, image, message_id } = await req.json();

    // 1. Interceptor de Duplicados Concurrentes (Memoria + Supabase no bloqueante)
    const incomingMsgId = message_id || req.headers.get("x-message-id");
    if (incomingMsgId) {
      if (recentMessageIds.has(incomingMsgId)) {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }
      recentMessageIds.add(incomingMsgId);
      if (recentMessageIds.size > 2000) {
        const first = recentMessageIds.values().next().value;
        if (first) recentMessageIds.delete(first);
      }

      // Registro en Supabase asíncrono no bloqueante en background
      (async () => {
        try {
          const supabase = createServerSupabaseClient();
          await supabase.from('processed_webhooks').insert([{ message_id: incomingMsgId }]);
        } catch {}
      })();
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
    const geminiReasoningModel = process.env.GEMINI_REASONING_MODEL || "gemini-flash-latest";

    const standardModels = ["gemini-flash-latest", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-pro-preview"];
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

    // 1. MOTOR PRIMARIO SOBERANO: GROQ SDK (Llama 3.3 70B Versatile)
    try {
      const groqMessages = [
        { role: 'system' as const, content: `${systemPromptText}\n\nResponde estrictamente en formato JSON con la siguiente estructura: {"reply": "tu respuesta aquí", "freeze": false}` },
        ...(history || []).map((h: any) => ({
          role: (h.role === 'nora' || h.role === 'assistant' || h.role === 'model') ? ('assistant' as const) : ('user' as const),
          content: h.content || '',
        })),
        { role: 'user' as const, content: message || 'Hola Nora' },
      ];

      const groqRes = await executeGroqChat(groqMessages, {
        model: 'llama-3.3-70b-versatile',
        temperature: isComplaintOrReasoning ? 0.2 : 0.4,
        maxTokens: 2000,
        responseFormat: { type: 'json_object' },
      });

      if (groqRes && groqRes.text) {
        try {
          const parsed = JSON.parse(groqRes.text);
          text = parsed.reply || groqRes.text;
          freezeState = Boolean(parsed.freeze);
        } catch {
          text = groqRes.text;
        }
      }
    } catch (groqErr) {
      console.warn('[Nora Chat Groq Warning]:', groqErr);
    }

    // 2. FALLBACK SECUNDARIO: GEMINI MULTI-KEY POOL (Solo si Groq no responde)
    if (!text) {
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

