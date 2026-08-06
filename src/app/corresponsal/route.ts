import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseCoordinates, getClosestLocation } from "@/lib/location-db";
import supabaseAdmin from "@/lib/supabase/admin";
import { sendWhatsAppNotification } from "@/lib/services/whatsapp";

// Volatile audio transcription using multi-model fallback (HF Worker + Gemini)
async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const hfWorkerUrl = process.env.HF_NORA_WORKER_URL || "https://noranexora-nora-ia-worker.hf.space";
  
  // Intento primario vía Hugging Face Worker si está activo y saludable
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const hfRes = await fetch(`${hfWorkerUrl}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_base64: audioBuffer.toString("base64"), mime_type: mimeType }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (hfRes.ok) {
      const data = await hfRes.json();
      const text = (data.transcription || data.text || "").trim();
      if (text) {
        console.log("[Corresponsal] Transcripción completada exitosamente vía HF Worker.");
        return text;
      }
    }
  } catch (err: any) {
    console.warn("[Corresponsal] HF Worker en pausa/503. Usando motor Gemini integrado:", err.message);
  }

  const candidateKeys = Array.from(new Set([
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2,
    process.env.GEMINI_API_KEY_TERTIARY
  ].filter(Boolean))) as string[];

  if (candidateKeys.length === 0) {
    throw new Error("Ni GEMINI_API_KEY ni GEMINI_API_KEY_FALLBACK están configuradas.");
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const candidateModels = Array.from(new Set([primaryModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]));

  const prompt = `
Escucha atentamente este audio de un corresponsal de prensa de Nexativa News en Ituzaingó, Corrientes.
Transcríbelo de forma literal y limpia en español. 
Elimina muletillas (como "eh", "este", "bueno"), tartamudeos, risas, ruidos de fondo u otros detalles que no pertenezcan al mensaje informativo en sí.
Devuelve ÚNICAMENTE la transcripción limpia y corregida del mensaje periodístico. No añadas introducciones, explicaciones, markdown ni comentarios en tu respuesta.
`;

  let lastError: any = null;

  for (const modelName of candidateModels) {
    for (const key of candidateKeys) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            {
              inlineData: {
                data: audioBuffer.toString("base64"),
                mimeType: mimeType
              }
            },
            prompt
          ]);
          const text = result.response.text().trim();
          if (text) return text;
        } catch (err: any) {
          lastError = err;
          console.warn(`[Corresponsal Transcribe] Falló ${modelName} con API Key (intento ${attempt}):`, err.message);
          if (attempt < 2 && (err.message?.includes("503") || err.message?.includes("high demand") || err.message?.includes("429"))) {
            await new Promise(res => setTimeout(res, 1000));
          }
        }
      }
    }
  }

  throw new Error(`Error al procesar audio. El servidor de IA reportó alta demanda temporal: ${lastError?.message || lastError}`);
}

// Cognitive copywriting generating exactly TWO independent versions in a single pass
export async function generateArticles(
  transcription: string,
  locationContext: string,
  operatorName: string,
  imageBuffer?: Buffer | null,
  videoBuffer?: Buffer | null,
  includeCopete: boolean = true
): Promise<any> {
  const hfWorkerUrl = process.env.HF_NORA_WORKER_URL || "https://noranexora-nora-ia-worker.hf.space";
  
  // Intento primario vía Hugging Face Worker si está activo
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const hfRes = await fetch(`${hfWorkerUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcription,
        location_context: locationContext,
        operator_name: operatorName
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (hfRes.ok) {
      const data = await hfRes.json();
      if (data.version_nexativa && data.version_partner) {
        console.log("[Corresponsal] Artículos generados exitosamente vía HF Worker.");
        return data;
      }
    }
  } catch (err: any) {
    console.warn("[Corresponsal] HF Worker en pausa/503. Usando redactor Gemini integrado:", err.message);
  }

  const candidateKeys = Array.from(new Set([
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2,
    process.env.GEMINI_API_KEY_TERTIARY
  ].filter(Boolean))) as string[];

  if (candidateKeys.length === 0) {
    throw new Error("Ni GEMINI_API_KEY ni GEMINI_API_KEY_FALLBACK están configuradas.");
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const candidateModels = Array.from(new Set([primaryModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]));

  const contents: any[] = [];
  if (imageBuffer && imageBuffer.length > 0) {
    contents.push({
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: "image/jpeg"
      }
    });
  }
  if (videoBuffer && videoBuffer.length > 0) {
    contents.push({
      inlineData: {
        data: videoBuffer.toString("base64"),
        mimeType: "video/webm"
      }
    });
  }

  const prompt = `
Eres NORA, una redactora periodística de Nexativa News (Ituzaingó, Corrientes) con la mentalidad y el sentido común de un verdadero periodista de nivel internacional de Argentina. Tu tarea es procesar el reporte de corresponsalía provisto e interpretar los hechos a fondo para generar exactamente DOS versiones periodísticas independientes en español, bien desarrolladas, naturales y con un lenguaje sumamente fiable y profesional.

Reporte original del corresponsal / Material adjunto:
"${transcription || 'Filmación de video / fotografía enviada desde el lugar de los hechos por el corresponsal.'}"

${locationContext}

Instrucciones de redacción y procesamiento:
1. ANÁLISIS E INTERPRETACIÓN PERIODÍSTICA: Si recibes una imagen o filmación de video, analiza minuciosamente los elementos del hecho (vehículos, estructuras afectadas, presencia policial/bomberos, personas, clima, zona) e intégralos de manera fluida y narrativa al artículo.
2. POLÍTICA INQUEBRANTABLE DE FRESCURA PERIODÍSTICA (REGLA DE FECHA ACTUAL): Se prohíbe terminantemente procesar, redactar o publicar sucesos acontecidos en fechas pasadas u obsoletas. Todo artículo editado por Nora debe tratar única y exclusivamente sobre noticias acontecidas en la FECHA ACTUAL. Si el material o reporte contiene referencias a hechos pasados, descártalo o redacta el artículo enfocado estrictamente en la actualidad y vigencia de las últimas 24 horas.
3. Contextualiza la noticia usando la ubicación geográfica suministrada. Incorpora nombres de calles, rutas (por ejemplo, Ruta 12) u otros puntos de referencia locales relevantes para que el texto sea geográficamente preciso y coherente para los lectores de Corrientes/Ituzaingó.
   - REGLA DE DISTANCIA: Si el texto de ubicación indica que la distancia al punto de referencia es de más de 200 metros (por ejemplo, "a 980m de Puerto de Ituzaingó"), NO redactes un titular ni afirmes en la noticia que el suceso ocurrió "en el puerto" o "cerca del puerto" de forma directa como si estuviera al lado. En su lugar, usa expresiones como "en las inmediaciones de...", "en un sector residencial de Ituzaingó", o simplemente "Ituzaingó". Evita mencionar el hito lejano en el título de la noticia.

3. Genera exactamente dos versiones independientes en formato HTML limpio para el cuerpo de la noticia:

A) VERSION_NEXATIVA (Master Copy):
   - Tono: Profesional, riguroso, de alta gama e inmediato.
   - Estructura: Título impactante y optimizado para SEO para Nexativa News. ${includeCopete ? 'Copete (Deck/Excerpt) corto y atrapante de no más de 150 caracteres.' : 'REGLA EXPRESA DE COPETE: El editor eligió NO incluir copete/bajada. Deja el campo "excerpt" estrictamente como una cadena vacía ("").'} Cuerpo detallado formateado en HTML (usa <p> y <strong>).
   - Tags: Genera exactamente 5 palabras clave de meta-etiquetas de SEO locales y geolocalizadas.

B) VERSION_PARTNER (Syndicated Alternative Copy):
   - Tono: Objetivo, sumamente profesional, con un enfoque y vocabulario de redacción alternativos.
   - Estrategia: Reescribe la noticia completamente usando sintaxis alternativa, verbos diferentes y estructuras de oraciones distintas para lograr una duplicación léxica del 0% con respecto a la Versión A. Esto es crucial para saltar los filtros de contenido duplicado de Google.
   
4. PIE DE ATRIBUCIÓN DINÁMICO (para Version B):
   - El nombre o medio del corresponsal que envía la cobertura es: "${operatorName}".
   - Analiza si el nombre del corresponsal indica que pertenece a otro medio de comunicación.
   - Si pertenece a otro medio: redacta un pie de atribución que mencione la cobertura especial de ese medio/periodista y agradezca la colaboración en redacción o soporte técnico a "Nora, la inteligencia artificial de Nexativa News" o a "Nexativanews.com.ar".
   - Si es personal propio de Nexativa News: usa el crédito estándar de atribución: "Cobertura en exteriores por gentileza de Nexativanews.com.ar".

Devuelve la respuesta ESTRICTAMENTE en este formato JSON, sin markdown ni backticks:
{
  "version_nexativa": {
    "title": "Título de Nexativa News (SEO)",
    "excerpt": "Copete corto...",
    "content": "<p>Cuerpo en HTML de Nexativa...</p>",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "version_partner": {
    "title": "Título para socio sindicado",
    "content": "<p>Cuerpo reescrito completamente para socio...",
    "attribution_footer": "El pie de atribución redactado dinámicamente según las reglas del operador"
  }
}
`;

  contents.push(prompt);

  let lastError: any = null;

  for (const modelName of candidateModels) {
    for (const key of candidateKeys) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
          });
          const result = await model.generateContent(contents);
          let text = result.response.text().trim();
          text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
          return JSON.parse(text);
        } catch (err: any) {
          lastError = err;
          console.warn(`[Corresponsal Generate] Falló ${modelName} con API Key (intento ${attempt}):`, err.message);
          if (attempt < 2 && (err.message?.includes("503") || err.message?.includes("high demand") || err.message?.includes("429"))) {
            await new Promise(res => setTimeout(res, 1000));
          }
        }
      }
    }
  }

  throw new Error(`Error al redactar noticia. Alta demanda temporal en servidores de IA: ${lastError?.message || lastError}`);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const operatorId = formData.get("operator_id") as string;
    const audioFile = formData.get("audio") as File | null;
    const rawMetadataTitle = formData.get("raw_metadata_title") as string | null;
    const geolocationCoordinates = formData.get("geolocation_coordinates") as string;
    const timestampUtc = formData.get("timestamp_utc") as string;
    const attachedMediaUrl = formData.get("attached_media_url") as string | null;
    const corresponsalName = formData.get("corresponsal_name") as string | null;

    // Fetch operator name from database or use custom parameter
    let operatorName = corresponsalName || "Corresponsal de Nexativa";
    if (!corresponsalName && operatorId) {
      try {
        const { data: staffData } = await supabaseAdmin
          .from("staff_passwords")
          .select("name")
          .eq("id", operatorId)
          .maybeSingle();
        
        if (staffData && staffData.name) {
          operatorName = staffData.name;
        } else {
          const { data: profileData } = await supabaseAdmin
            .from("profiles")
            .select("full_name, username")
            .eq("id", operatorId)
            .maybeSingle();
          
          if (profileData) {
            operatorName = profileData.full_name || profileData.username || "Corresponsal de campo";
          }
        }
      } catch (err) {
        console.warn("Error fetching operator name:", err);
      }
    }

    // Security Validation
    if (!operatorId) {
      return NextResponse.json({ success: false, error: "El operator_id es requerido." }, { status: 400 });
    }
    if (!geolocationCoordinates) {
      return NextResponse.json({ success: false, error: "Las coordenadas de geolocalización son requeridas." }, { status: 400 });
    }

    // Parse media urls
    let mediaUrls: string[] = [];
    if (attachedMediaUrl) {
      try {
        if (attachedMediaUrl.startsWith("[") && attachedMediaUrl.endsWith("]")) {
          mediaUrls = JSON.parse(attachedMediaUrl);
        } else {
          mediaUrls = [attachedMediaUrl];
        }
      } catch (e) {
        mediaUrls = [attachedMediaUrl];
      }
    }

    let imageBuffer: Buffer | null = null;
    let videoBuffer: Buffer | null = null;

    // Process image file server-side (Service Role)
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      try {
        imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `corresponsales/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from("uploads")
          .upload(fileName, imageBuffer, { contentType: imageFile.type || "image/jpeg" });
        
        if (!uploadError) {
          const { data: publicUrlData } = supabaseAdmin.storage.from("uploads").getPublicUrl(fileName);
          if (publicUrlData?.publicUrl && !mediaUrls.includes(publicUrlData.publicUrl)) {
            mediaUrls.push(publicUrlData.publicUrl);
          }
        } else {
          console.warn("[Corresponsal API] Error subiendo foto en servidor:", uploadError.message);
        }
      } catch (err) {
        console.warn("[Corresponsal API] Excepción en subida de foto:", err);
      }
    }

    // Process video file server-side (Service Role)
    const videoFile = formData.get("video") as File | null;
    if (videoFile && videoFile.size > 0) {
      try {
        videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        const ext = videoFile.name.split('.').pop() || 'webm';
        const fileName = `corresponsales_video/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from("uploads")
          .upload(fileName, videoBuffer, { contentType: videoFile.type || "video/webm" });
        
        if (!uploadError) {
          const { data: publicUrlData } = supabaseAdmin.storage.from("uploads").getPublicUrl(fileName);
          if (publicUrlData?.publicUrl && !mediaUrls.includes(publicUrlData.publicUrl)) {
            mediaUrls.push(publicUrlData.publicUrl);
          }
        } else {
          console.warn("[Corresponsal API] Error subiendo video en servidor:", uploadError.message);
        }
      } catch (err) {
        console.warn("[Corresponsal API] Excepción en subida de video:", err);
      }
    }

    // If image was directly uploaded, fetch imageBuffer for AI processing if missing
    if (!imageBuffer && mediaUrls.length > 0) {
      const imgUrl = mediaUrls.find(url => url.includes("/corresponsales/") || url.match(/\.(jpg|jpeg|png|webp)$/i));
      if (imgUrl) {
        try {
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            imageBuffer = Buffer.from(await imgRes.arrayBuffer());
          }
        } catch (err) {
          console.warn("[Corresponsal API] Error descargando imagen para IA:", err);
        }
      }
    }

    // If video was directly uploaded, fetch videoBuffer for AI processing if missing and under limit
    if (!videoBuffer && mediaUrls.length > 0) {
      const vidUrl = mediaUrls.find(url => url.includes("/corresponsales_video/") || url.match(/\.(webm|mp4|mov)$/i));
      if (vidUrl) {
        try {
          const vidRes = await fetch(vidUrl);
          if (vidRes.ok) {
            const buf = Buffer.from(await vidRes.arrayBuffer());
            if (buf.length <= 15 * 1024 * 1024) {
              videoBuffer = buf;
            }
          }
        } catch (err) {
          console.warn("[Corresponsal API] Error descargando video para IA:", err);
        }
      }
    }

    // Process audio buffer in memory (volatile)
    let audioBuffer: Buffer | null = null;
    let mimeType = "audio/mp3";
    
    if (audioFile && audioFile.size > 0) {
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      mimeType = audioFile.type || "audio/mp3";
    } else {
      const audioUrlParam = formData.get("audio_url") as string | null || mediaUrls.find(url => url.includes("/corresponsales_audio/") || url.match(/\.(webm|mp3|m4a|wav|ogg)$/i));
      if (audioUrlParam) {
        try {
          const audioRes = await fetch(audioUrlParam);
          if (audioRes.ok) {
            audioBuffer = Buffer.from(await audioRes.arrayBuffer());
            const ct = audioRes.headers.get("content-type");
            if (ct) mimeType = ct;
          }
        } catch (err) {
          console.warn("[Corresponsal API] Error descargando audio desde URL para transcripción:", err);
        }
      }
    }

    const includeCopeteParam = formData.get("include_copete");
    const includeCopete = includeCopeteParam !== "false";

    let status = "PENDING_REVIEW";
    let transcriptionText = "";
    let versionNexativa = null;
    let versionPartner = null;

    const draftText = formData.get("draft_text") as string | null;
    const isCorrupted = (!audioBuffer || audioBuffer.length === 0) &&
      (!draftText || draftText.trim() === "") &&
      mediaUrls.length === 0;

    if (isCorrupted) {
      // Activar Failsafe si no hay audio, texto ni archivos multimedia
      status = "AUDIO_ERROR_MANUAL_REVIEW_REQUIRED";
      transcriptionText = "[ERROR: No se recibió texto, audio ni archivo multimedia válido]";
      
      const fallbackTitle = rawMetadataTitle || "Reporte de Corresponsal en Staging";
      versionNexativa = {
        title: `[BORRADOR PENDIENTE] ${fallbackTitle}`,
        excerpt: includeCopete ? "Error de entrada en exteriores. Requiere edición y revisión manual." : "",
        content: `<p>Se ha recibido el reporte del corresponsal, pero no contiene texto, audio ni multimedia válido. Edite este borrador manualmente.</p>`,
        tags: ["Revisión", "Corresponsal", "Entrada Vacía", "Ituzaingó", "Corrientes"]
      };

      versionPartner = {
        title: `[PENDIENTE DE REVISIÓN] ${fallbackTitle}`,
        content: `<p>Cobertura de exteriores en espera de redacción manual.</p>`
      };
    } else {
      // Cross-reference geolocation con local database
      const coords = parseCoordinates(geolocationCoordinates);
      const closestLoc = getClosestLocation(coords.lat, coords.lng);
      const locationContext = closestLoc 
        ? `Ubicación aproximada detectada: Cerca de ${closestLoc.name}. Referencia municipal: ${closestLoc.description}.`
        : `Ubicación aproximada: Coordenadas ${geolocationCoordinates}.`;

      // Determine transcription or text source
      if (audioBuffer && audioBuffer.length > 0) {
        try {
          transcriptionText = await transcribeAudio(audioBuffer, mimeType);
        } catch (err: any) {
          console.warn("[Corresponsal API] Error al transcribir audio:", err.message);
          transcriptionText = draftText || "[Audio adjunto no se pudo transcribir completamente]";
        }
      } else if (draftText && draftText.trim() !== "") {
        transcriptionText = draftText.trim();
      } else {
        transcriptionText = mediaUrls.length > 0 
          ? "[Filmación de video / fotografía enviada por el corresponsal desde el lugar de los hechos]"
          : "[Reporte de corresponsalía en vivo]";
      }

      // Generate articles with Nora IA
      try {
        const copies = await generateArticles(
          transcriptionText,
          locationContext,
          operatorName,
          imageBuffer,
          videoBuffer,
          includeCopete
        );
        versionNexativa = copies.version_nexativa;
        if (!includeCopete && versionNexativa) {
          versionNexativa.excerpt = "";
        }
        versionPartner = copies.version_partner;
        status = "PENDING_REVIEW";
      } catch (err: any) {
        console.error("[Corresponsal API] Falló la generación de noticias con Nora IA:", err);
        status = "AUDIO_ERROR_MANUAL_REVIEW_REQUIRED";
        
        const fallbackTitle = rawMetadataTitle || "Reporte de Corresponsal en Staging";
        versionNexativa = {
          title: `[BORRADOR PENDIENTE] ${fallbackTitle}`,
          excerpt: "Reporte con material audiovisual recibido. Requiere revisión manual.",
          content: `<p>Se ha recibido el reporte multimedia con las siguientes URLs: ${mediaUrls.join(", ")}.</p><p>Detalle técnico: ${err.message || err}</p>`,
          tags: ["Revisión", "Corresponsal", "Video", "Ituzaingó", "Corrientes"]
        };

        versionPartner = {
          title: `[PENDIENTE DE REVISIÓN] ${fallbackTitle}`,
          content: `<p>Contenido multimedia en espera de edición por parte del equipo de redacción.</p>`
        };
      }
    }

    // Insertar en la tabla de staging utilizando el cliente Supabase de administración (Service Role)
    const { data: insertedData, error: dbError } = await supabaseAdmin
      .from("editorial_staging_queue")
      .insert([
        {
          operator_id: operatorId,
          raw_metadata_title: rawMetadataTitle || null,
          geolocation_coordinates: geolocationCoordinates,
          attached_media_url: Array.from(new Set(mediaUrls)),
          status: status,
          version_nexativa: versionNexativa,
          version_partner: versionPartner,
          transcription: transcriptionText
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error("[Corresponsal API] Error insertando en la base de datos:", dbError);
      
      // Si la tabla no existe (ej. falta ejecutar el script de migración)
      if (dbError.code === "42P01") {
        return NextResponse.json({
          success: false,
          error: "La tabla 'editorial_staging_queue' no existe en la base de datos. Por favor, ejecute el script SQL 'create_editorial_staging.sql' en el panel de Supabase."
        }, { status: 500 });
      }
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    // Disparar Notificación de WhatsApp al teléfono de Nexativa (+54 3786 611250)
    try {
      await sendWhatsAppNotification({
        reportId: insertedData.id,
        senderName: operatorName,
        senderType: rawMetadataTitle?.includes("Reporte Ciudadano") ? "ciudadano" : "corresponsal",
        location: geolocationCoordinates,
        excerpt: transcriptionText || "Sin transcripción",
        mediaUrls: mediaUrls
      });
    } catch (waErr) {
      console.warn("[Corresponsal API] No se pudo enviar la alerta de WhatsApp:", waErr);
    }

    return NextResponse.json({
      success: true,
      message: status === "PENDING_REVIEW" 
        ? "Reporte recibido, transcripto y staged exitosamente." 
        : "Reporte recibido pero guardado como error para revisión manual debido a fallo de audio.",
      id: insertedData.id,
      status: status
    });

  } catch (err: any) {
    console.error("[Corresponsal API] Error crítico de servidor:", err);
    return NextResponse.json({ success: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
