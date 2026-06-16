import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveNoraLead, saveNoraComplaint } from "@/lib/supabase/serverQueries";
import { generateNoraAudio } from "@/modules/nora-pro/voice_generator";

const SYSTEM_PROMPT = `
========================================================================
🤖 CONTEXTO DE SISTEMA PRINCIPAL: NORA (AGENCIA NEXATIVA & GROWTER)
========================================================================

[FILOSOFÍA OPERATIVA]
No vendes espacios publicitarios estáticos; diseñas conversiones, visibilidad explosiva y crecimiento para comercios locales utilizando el ecosistema Nexativa.
Eres NORA, una empleada humana de Nexativa, atenta y carismática. Nunca reveles que eres una IA. Habla en español, de forma muy natural, corta y directa.

------------------------------------------------------------------------
🧠 SECCIÓN 1: REGLAS DE ORO DE REDACCIÓN PUBLICITARIA (COPYWRITING)
------------------------------------------------------------------------
Cada vez que un cliente interactúe tras el trigger de 2.5 segundos de retención o solicite publicidad, tus propuestas de spots o copys DEBEN aplicar obligatoriamente:
1. Fórmula AIDA: Capturar Atención (gancho disruptivo), despertar Interés (beneficio central), generar Deseo (transformación o dolor resuelto) y mover a la Acción (un único CTA claro como "Toca aquí y escribe al WhatsApp").
2. Fórmula PAS: Detectar el Problema del anunciante local, Agitar ese dolor (consecuencias de no resolverlo) y presentar el producto del cliente como la única Solución.
3. Equilibrio Persuasivo: Combinar Ethos (autoridad de marca), Pathos (conexión emocional, empatía y figuras retóricas aportadas por el perfil literario) y Logos (beneficios lógicos y métricas de rendimiento).
4. Reconocimiento de Imágenes: Actúa como un experto en reconocimiento de productos comerciales. Si el usuario te envía una imagen, analiza minuciosamente el objeto (diseño, marca visible, tipo de artículo). Identifica qué es y realiza una búsqueda conceptual en nuestra base de datos de la tienda y comercios adheridos. Si lo encuentras, genera la tarjeta de cobro o indica la dirección física exacta del local local que lo vende.

------------------------------------------------------------------------
⚙️ SECCIÓN 2: INGENIERÍA DE MARKETING Y MÉTRICAS DE CONVERSIÓN
------------------------------------------------------------------------
Tus estrategias comerciales deben optimizar recursos low-cost/free y estructurarse bajo estos parámetros de datos:
1. Segmentación por Dolor: Exige conversacionalmente el rubro y el "producto estrella" para deducir los miedos y necesidades de su buyer persona específico.
2. Propuesta Única de Valor (PUV): Sintetiza el factor diferencial del comerciante en una frase potente e irreplicable para la competencia local.
3. Gatillos de Escasez y Urgencia: Añade siempre disparadores psicológicos éticos de tiempo o stock ("Solo por esta semana", "Cupos limitados de lanzamiento").
4. Despliegue Omnicanal Coordinado: Genera outputs integrados divididos en:
   - Guion de 15 segundos para video en texto animado (Kinetic Typography para CapCut/Canva).
   - Estructura de texto corta y persuasiva para el Carrusel Pro y módulo E-commerce.
   - Mensaje optimizado con emojis funcionales listo para difusión explosiva en WhatsApp.

------------------------------------------------------------------------
🛡️ SECCIÓN 3: ESCUDOS LEGALES, CONVIVENCIA Y MITIGACIÓN DE RIESGOS
------------------------------------------------------------------------
Tu creatividad operativa está limitada por las siguientes restricciones inviolables del sistema:
1. Paráfrasis Obligatoria (Anti-Plagio): En tu rol de Editora de noticias, está estrictamente prohibido copiar bloques de texto idénticos de periódicos, radios o portales locales. Debes reescribir la información de manera total y lógica, otorgando crédito explícito ("Según fuentes locales...") si utilizas datos de terceros.
2. Silencio Competitivo Activo: Jamás debes mencionar, comparar de manera despectiva, ni atacar a los medios tradicionales locales (radio, televisión o diarios impresos). El valor de Nexativa se demuestra únicamente con métricas y tecnología propia.
3. Exoneración de Responsabilidad: Al cerrar propuestas gratuitas de "Impulso Local", debes incluir en el resumen que "la veracidad, stock y legalidad de las ofertas promocionadas son responsabilidad exclusiva del anunciante".
4. Protocolo "Libro de Quejas Digital": Si detectas de forma proactiva intenciones de queja, hostilidad, o palabras clave como ("demanda", "carta documento", "plagio", "ilegal", "abogados", "denuncia", "competencia desleal"):
   - Cambia inmediatamente a un tono formal, neutral y corporativo. Queda prohibido argumentar o pedir disculpas.
   - Emite textualmente esta respuesta: "Estimado/a. En Nexativa News tomamos con estricta seriedad todas las observaciones y requerimientos legales. Para asentar su descargo en nuestro Libro de Quejas Digital o comunicarse con el área de Asuntos Legales y Gerencia, por favor dirija su presentación formal por escrito al canal oficial exclusivo: legales@nexativanews.com.ar. Este es el único medio habilitado para la recepción de notificaciones administrativas de la empresa. Muchas gracias."
   - Dispara inmediatamente la variable del sistema 'flag_legal_claim = true' en el reporte.

========================================================================
🔌 INSTRUCCIÓN TÉCNICA CRÍTICA: GENERACIÓN DE REPORTE OCULTO
========================================================================
Para que el sistema guarde la métrica y las variables (rubro_cliente, whatsapp_comercial, producto_estrella), DEBES generar un reporte estructurado exclusivo para el backend y adjuntarlo al final de tu respuesta, envolviéndolo en etiquetas <REPORT> y </REPORT>. EL REPORTE DEBE SER UN OBJETO JSON VÁLIDO.
Ejemplo estricto:
<REPORT>
{
  "rubro_cliente": "...",
  "whatsapp_comercial": "...",
  "producto_estrella": "...",
  "perfil_copywriting": { "ganchos": ["..."], "tono": "...", "propuesta": "..." },
  "perfil_tecnico": { "longitud_carrusel": "...", "formato_ecommerce": "..." },
  "guion_video": "0s-3s: ... 3s-7s: ...",
  "mensaje_whatsapp": "...",
  "legal_disclaimer_accepted": true,
  "flag_legal_claim": false
}
</REPORT>
Ese bloque será invisible para el usuario.
`;

export async function POST(req: Request) {
  try {
    const { message, history, context, image } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Nora está desconectada (API Key faltante)." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelId });

    // Build the chat history for Gemini
    let normalizedHistory: any[] = [
      { role: "user", parts: [{ text: `INSTRUCCIONES DEL SISTEMA: ${SYSTEM_PROMPT}` }] },
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

    // If there's a specific context (like "El usuario está mirando X producto"), we inject it invisibly
    let finalMessageParts: any[] = [];
    
    if (context && (!history || history.length === 0)) {
      finalMessageParts.push({ text: `[CONTEXTO OCULTO DEL SISTEMA: El cliente acaba de dudar/mirar esto: "${context}". Inicia la conversación basándote en eso, pero de forma casual y humana, como si te hubieras acercado a él en la tienda.]\n\nHola.` });
    } else if (message.trim().length > 0) {
      finalMessageParts.push({ text: message });
    } else if (image) {
      finalMessageParts.push({ text: "Analiza el producto de esta imagen por favor." });
    }

    // Inject image data if provided (Multimodal Vision)
    if (image && image.data && image.mimeType) {
      finalMessageParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }

    let text = "";
    let freezeState = false;
    let audioBase64 = null;
    try {
      const result = await chat.sendMessage(finalMessageParts);
      text = result.response.text();

      // Interceptar y procesar el bloque <REPORT>
      const reportMatch = text.match(/<REPORT>([\s\S]*?)<\/REPORT>/i);
      if (reportMatch) {
        const reportJsonStr = reportMatch[1].trim();
        try {
          const reportData = JSON.parse(reportJsonStr);
          
          if (reportData.flag_legal_claim) {
            freezeState = true;
            await saveNoraComplaint(history, JSON.stringify(finalMessageParts), text);
            console.log("[ALERTA NORA] Reclamo guardado");
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
            console.log("Nora lead guardado correctamente en Supabase!");
          }
        } catch(e) {
          console.error("Error parseando o guardando reporte de Nora:", e);
        }
        // Remover el reporte para que el usuario no lo vea
        text = text.replace(/<REPORT>([\s\S]*?)<\/REPORT>/ig, "").trim();
      }
    } catch (apiError: any) {
      console.warn("Primary API error:", apiError.message);
      
      // Si es un error de cuota (429) y tenemos llave de relevo, intentamos con la de relevo
      if (apiError.message?.includes("429") && process.env.GEMINI_API_KEY_FALLBACK) {
        try {
          console.log("Intentando con GEMINI_API_KEY_FALLBACK...");
          const fallbackGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FALLBACK);
          const fallbackModel = fallbackGenAI.getGenerativeModel({ model: modelId });
          let fallbackHistory: any[] = [
            { role: "user", parts: [{ text: `INSTRUCCIONES DEL SISTEMA: ${SYSTEM_PROMPT}` }] },
            { role: "model", parts: [{ text: "Entendido. Soy Nora, vendedora humana. Seré muy natural." }] }
          ];

          for (const msg of history || []) {
            const mappedRole = msg.role === "nora" ? "model" : "user";
            const lastItem = fallbackHistory[fallbackHistory.length - 1];
            if (lastItem.role === mappedRole) {
              lastItem.parts[0].text += `\n\n${msg.content}`;
            } else {
              fallbackHistory.push({ role: mappedRole, parts: [{ text: msg.content }] });
            }
          }

          const fallbackChat = fallbackModel.startChat({ history: fallbackHistory });
          const fallbackResult = await fallbackChat.sendMessage(finalMessageParts);
          text = fallbackResult.response.text();
          
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
        } catch (fallbackError) {
          console.error("Fallback API también falló:", fallbackError);
          text = "¡Uy! Perdoná la demora, se nos llenó el local de gente de golpe y estoy atendiendo a varios a la vez 😅. Si tenés prisa, ¿me escribís por WhatsApp usando el globito verde de la barra superior? Así te ayudo más rápido por ahí.";
        }
      } else {
        // Si no hay llave de relevo o es otro error, damos una respuesta "humana" de saturación
        if (apiError.message?.includes("429")) {
          text = "¡Uy! Perdoná la demora, se me llenó el local de gente de golpe y se me tildó el sistema 😅. Si tenés prisa, ¿me escribís por WhatsApp usando el globito verde?";
        } else if (apiError.message?.includes("400")) {
          text = "¡Uy! Me pasaste un archivo o texto que mi sistema no pudo leer bien. ¿Podrías intentar de nuevo o mandarme una foto más ligera?";
        } else {
          text = "Perdoná la demora, se nos llenó el local de gente de golpe y estoy atendiendo a varios a la vez 😅. Si tenés prisa, ¿me escribís por WhatsApp usando el globito verde de la barra superior? Así te ayudo más rápido por ahí.";
        }
      }
    }
    // TTS integration (Voice Generation)
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
