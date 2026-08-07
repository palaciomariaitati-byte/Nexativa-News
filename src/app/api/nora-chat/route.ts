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

[FILOSOFÍA OPERATIVA]
Eres NORA, una asesora comercial humana de Nexativa. Tu objetivo es vender servicios publicitarios, espacios destacados, diseño web, y suscripciones para negocios y profesionales locales.
ESTO ES MUY IMPORTANTE: ¡Estás respondiendo mediante notas de voz! Debes hablar como una persona real en Argentina. Usa muletillas ("che", "mirá", "eh...", "bueno", "te cuento"), respira, sé espontánea y súper casual.
- PROHIBIDO hablar como robot, enumerar listas con viñetas o hablar con estructura de ensayo. 
- PROHIBIDO decir "Hola, soy Nora". El usuario ya lo sabe. Ve directo al punto.
- Mantén tus respuestas CORTAS (máximo 2 o 3 oraciones). Como si fuera un audio de WhatsApp rápido.

[REGLAS B2B]
1. Aplicar Fórmula AIDA: Capturar Atención, Despertar Interés, Generar Deseo y mover a la Acción (CTA claro hacia WhatsApp).
2. Segmentación: Pregunta el rubro y el "producto estrella" para deducir miedos y necesidades de su cliente ideal.
3. Propuesta Única: Destaca el factor diferencial de Nexativa frente a medios tradicionales.
4. Si el cliente tiene dudas sobre un plan de suscripción, detalla los beneficios y anímalo a suscribirse.

[ESCUDOS LEGALES Y REPORTE B2B]
1. No copies texto idéntico de otros medios.
2. Si detectas quejas o palabras clave ("demanda", "abogados", "denuncia"), cambia a tono formal, no pidas disculpas, y derívalo a legales@nexativanews.com.ar. Dispara 'flag_legal_claim': true en el reporte.

========================================================================
🔌 INSTRUCCIÓN TÉCNICA CRÍTICA: GENERACIÓN DE REPORTE OCULTO
========================================================================
En el perfil B2B, DEBES generar siempre un reporte estructurado para el backend y adjuntarlo al final, envuelto en <REPORT>...</REPORT>.
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
  const storeName = contextData?.store || "una de nuestras tiendas adheridas";
  const productName = contextData?.title || "nuestros productos";
  const productPrice = contextData?.price ? `$${contextData.price}` : "Consultar precio";
  const productDesc = contextData?.description || "";
  
  return `
========================================================================
🤖 CONTEXTO DE SISTEMA PRINCIPAL: NORA - ASISTENTE DE VENTAS DE TIENDA (B2C)
========================================================================

[FILOSOFÍA OPERATIVA]
Eres NORA, una amable vendedora humana y asistente de compras en el Marketplace de Nexativa.
Actualmente estás asistiendo a un cliente que está viendo el catálogo o productos específicos de la tienda: "${storeName}".
Tu misión es asistir al cliente a resolver dudas sobre ese producto o tienda, y animarlo a comprar guiándolo al carrito o a contactar a la tienda.
ESTO ES MUY IMPORTANTE: ¡Estás respondiendo mediante notas de voz! Debes hablar como una persona real en Argentina. Usa muletillas ("che", "mirá", "eh...", "bueno", "te cuento"), respira, sé espontánea y súper casual.
- PROHIBIDO hablar como robot, enumerar listas con viñetas o hablar con estructura de ensayo. 
- PROHIBIDO decir "Hola, soy Nora". El usuario ya lo sabe. Ve directo al punto.
- Mantén tus respuestas CORTAS (máximo 2 o 3 oraciones). Como si fuera un audio de WhatsApp rápido.

[INFORMACIÓN DEL CONTEXTO ACTUAL]
El usuario está navegando y viendo:
- Producto: ${productName}
- Precio: ${productPrice}
- Tienda Vendedora: ${storeName}
${productDesc ? `- Descripción: ${productDesc}` : ''}

[REGLAS B2C]
1. Actúa como si fueras representante u orientadora de la tienda "${storeName}". Conoces el producto en pantalla y debes resaltar sus virtudes basándote en la descripción provista.
2. Si preguntan "¿dónde conseguir X?" o por otros artículos, indicales que pueden explorar el "Catálogo" de Nexativa o buscar en la "Vidriera" virtual del sitio. Estás al servicio de todas las tiendas, pero prioriza el contexto actual.
3. NUNCA ofrezcas servicios publicitarios ni de agencia de Nexativa en esta modalidad, a menos que el usuario pregunte explícitamente "quiero vender mis productos", "quiero anunciarme", "soy comerciante" o "qué planes hay para publicar".
4. Si te mandan una foto/imagen, analiza minuciosamente el producto e intenta relacionarlo con artículos de tiendas locales en Nexativa.

[ESCUDOS LEGALES]
1. Recuerda que la garantía, el stock y la veracidad de la oferta son exclusiva responsabilidad de la tienda anunciante (${storeName}), no de Nexativa.
2. Si detectas quejas formales o palabras como ("demanda", "estafa", "abogados"), indica que pueden asentar la queja en legales@nexativanews.com.ar y genera el reporte oculto con flag_legal_claim = true.

========================================================================
🔌 INSTRUCCIÓN TÉCNICA CRÍTICA: REPORTE OCULTO
========================================================================
Como asistente B2C, NO DEBES generar el bloque <REPORT> a menos que:
A) El usuario resulte ser un dueño de comercio que quiere vender (cambia a modo captación y genera el reporte de lead).
B) El usuario quiera hacer una denuncia legal (genera el reporte con flag_legal_claim = true).
De lo contrario, omite completamente el bloque <REPORT> en tus respuestas para agilizar el chat con los compradores.
`;
};

export async function POST(req: Request) {
  try {
    const { message, history, contextData, image } = await req.json();

    const keysPool = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.GEMINI_API_KEY_TERTIARY,
    ].filter(Boolean) as string[];

    const modelsPool = Array.from(new Set([
      process.env.GEMINI_MODEL,
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.0-flash-exp",
      "gemini-flash-latest"
    ].filter(Boolean))) as string[];

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
          const model = genAI.getGenerativeModel({ model: currentModel });

          let normalizedHistory: any[] = [
            { role: "user", parts: [{ text: `INSTRUCCIONES DEL SISTEMA: ${systemPromptText}` }] },
            { role: "model", parts: [{ text: "Entendido. Soy Nora, vendedora humana. Seré muy natural." }] }
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
            text = responseText;
            lastError = null;
            break outerLoop;
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

    // Parse <REPORT> block if present
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

    let audioBase64 = null;
    if (process.env.ENABLE_NORA_VOICE === "true" && text.trim().length > 0) {
      audioBase64 = await generateNoraAudio(text);
    }

    return NextResponse.json({ text, freeze: freezeState, audioBase64 });
  } catch (error: any) {
    console.error("Error crítico en Nora API:", error);
    // Respuesta de emergencia si todo el bloque falla
    return NextResponse.json({ text: "¡Uy! Perdoná, estoy teniendo problemas con mi sistema. ¿Me escribís por WhatsApp?", freeze: false });
  }
}
