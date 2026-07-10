import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseCoordinates, getClosestLocation } from "@/lib/location-db";
import supabaseAdmin from "@/lib/supabase/admin";

// Volatile audio transcription using Gemini 2.5 Flash
async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({ model: modelId });

  const prompt = `
Escucha atentamente este audio de un corresponsal de prensa de Nexativa News en Ituzaingó, Corrientes.
Transcríbelo de forma literal y limpia en español. 
Elimina muletillas (como "eh", "este", "bueno"), tartamudeos, risas, ruidos de fondo u otros detalles que no pertenezcan al mensaje informativo en sí.
Devuelve ÚNICAMENTE la transcripción limpia y corregida del mensaje periodístico. No añadas introducciones, explicaciones, markdown ni comentarios en tu respuesta.
`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBuffer.toString("base64"),
        mimeType: mimeType
      }
    },
    prompt
  ]);

  return result.response.text().trim();
}

// Cognitive copywriting generating exactly TWO independent versions in a single pass
async function generateArticles(transcription: string, locationContext: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
Eres Nora, la redactora periodística experta de Nexativa News (Ituzaingó, Corrientes). Tu tarea es procesar el siguiente reporte de un corresponsal y generar exactamente DOS versiones periodísticas independientes en español de la noticia.

Reporte original del corresponsal:
"${transcription}"

${locationContext}

Instrucciones de redacción:
1. Contextualiza la noticia usando la ubicación geográfica suministrada. Incorpora nombres de calles, rutas (por ejemplo, Ruta 12) u otros puntos de referencia locales relevantes para que el texto sea geográficamente preciso y coherente para los lectores de Corrientes/Ituzaingó.
2. Genera exactamente dos versiones independientes en formato HTML limpio para el cuerpo de la noticia:

A) VERSION_NEXATIVA (Master Copy):
   - Tono: Profesional, inmediato, multimedia-oriented.
   - Estructura: Pirámide invertida de periodismo. Título impactante y optimizado para SEO para Nexativa News. Copete (Deck/Excerpt) corto y atrapante de no más de 150 caracteres. Cuerpo detallado formateado en HTML (usa <p> y <strong>).
   - Tags: Genera exactamente 5 palabras clave de meta-etiquetas de SEO locales y geolocalizadas.

B) VERSION_PARTNER (Syndicated Alternative Copy):
   - Tono: Objetivo, profesional y con un vocabulario distinto.
   - Estrategia: Reescribe la noticia completamente usando sintaxis alternativa, verbos diferentes y estructuras de oraciones distintas para lograr una duplicación léxica del 0% con respecto a la Versión A. Esto es crucial para saltar los filtros de contenido duplicado de Google.
   - Nota: NO incluyas el pie de atribución en el JSON generado en el cuerpo del texto, ya que se le añadirá de forma programática.

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
    "content": "<p>Cuerpo reescrito completamente para socio...</p>"
  }
}
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  
  // Clean potential markdown blocks
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  
  return JSON.parse(text);
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

    // Process audio buffer in memory (volatile)
    let audioBuffer: Buffer | null = null;
    let mimeType = "audio/mp3";
    
    if (audioFile && audioFile.size > 0) {
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      mimeType = audioFile.type || "audio/mp3";
    }

    let status = "PENDING_REVIEW";
    let transcriptionText = "";
    let versionNexativa = null;
    let versionPartner = null;

    const draftText = formData.get("draft_text") as string | null;
    const isCorrupted = (!audioBuffer || audioBuffer.length === 0) && (!draftText || draftText.trim() === "");

    if (isCorrupted) {
      // Activar Failsafe si el audio está corrupto o vacío y no hay texto redactado
      status = "AUDIO_ERROR_MANUAL_REVIEW_REQUIRED";
      transcriptionText = "[ERROR: No se pudo procesar el flujo de audio ni se recibió texto redactado. Se requiere revisión manual]";
      
      const fallbackTitle = rawMetadataTitle || "Reporte de Corresponsal en Staging";
      versionNexativa = {
        title: `[BORRADOR PENDIENTE] ${fallbackTitle}`,
        excerpt: "Error de entrada en exteriores. Requiere edición y revisión manual.",
        content: `<p>Se ha recibido el reporte del corresponsal, pero no contiene texto ni audio válido. Edite este borrador manualmente.</p>`,
        tags: ["Revisión", "Corresponsal", "Entrada Vacía", "Ituzaingó", "Corrientes"]
      };

      versionPartner = {
        title: `[PENDIENTE DE REVISIÓN] ${fallbackTitle}`,
        content: `<p>Cobertura de exteriores en espera de redacción manual por problemas técnicos en el origen.</p>`
      };
    } else if (draftText && draftText.trim() !== "") {
      // Si nos envían el borrador de texto directamente, lo usamos
      transcriptionText = draftText;
      try {
        const coords = parseCoordinates(geolocationCoordinates);
        const closestLoc = getClosestLocation(coords.lat, coords.lng);
        const locationContext = closestLoc 
          ? `Ubicación aproximada detectada: Cerca de ${closestLoc.name}. Referencia municipal: ${closestLoc.description}.`
          : `Ubicación aproximada: Coordenadas ${geolocationCoordinates}.`;

        // Generar las copias a partir del texto y el contexto geográfico
        const copies = await generateArticles(transcriptionText, locationContext);
        versionNexativa = copies.version_nexativa;
        versionPartner = copies.version_partner;
      } catch (err: any) {
        console.error("[Corresponsal API] Falló el procesamiento cognitivo de texto redactado:", err);
        status = "AUDIO_ERROR_MANUAL_REVIEW_REQUIRED";
        transcriptionText = `[ERROR DE PROCESAMIENTO: Falló la redacción cognitiva del borrador. Detalle: ${err.message || err}]`;
        
        const fallbackTitle = rawMetadataTitle || "Reporte de Corresponsal en Staging";
        versionNexativa = {
          title: `[BORRADOR PENDIENTE] ${fallbackTitle}`,
          excerpt: "Error de procesamiento en la redacción automática.",
          content: `<p>Borrador original enviado por corresponsal: ${draftText}</p><p>Fallo del motor de copia: ${err.message || err}</p>`,
          tags: ["Revisión", "Corresponsal", "Error Redacción", "Ituzaingó", "Corrientes"]
        };
        versionPartner = {
          title: `[PENDIENTE DE REVISIÓN] ${fallbackTitle}`,
          content: `<p>Contenido en espera de edición por fallos en el motor cognitivo de redacción.</p>`
        };
      }
    } else {
      try {
        // Transcribir el audio en memoria (aislado, sin guardar el archivo en buckets o BD)
        transcriptionText = await transcribeAudio(audioBuffer!, mimeType);
        
        if (!transcriptionText || transcriptionText.trim() === "") {
          throw new Error("La transcripción automática devolvió un resultado vacío.");
        }

        // Cross-reference geolocation con Ituzaingó local database
        const coords = parseCoordinates(geolocationCoordinates);
        const closestLoc = getClosestLocation(coords.lat, coords.lng);
        const locationContext = closestLoc 
          ? `Ubicación aproximada detectada: Cerca de ${closestLoc.name}. Referencia municipal: ${closestLoc.description}.`
          : `Ubicación aproximada: Coordenadas ${geolocationCoordinates}.`;

        // Generar copys utilizando Nora Copywriting Engine
        const copies = await generateArticles(transcriptionText, locationContext);
        
        versionNexativa = copies.version_nexativa;
        versionPartner = copies.version_partner;
      } catch (err: any) {
        console.error("[Corresponsal API] Falló el procesamiento cognitivo de audio:", err);
        
        // Failsafe por fallo en la API de IA o formato
        status = "AUDIO_ERROR_MANUAL_REVIEW_REQUIRED";
        transcriptionText = `[ERROR DE PROCESAMIENTO: Falló la transcripción cognitiva. Detalle: ${err.message || err}]`;
        
        const fallbackTitle = rawMetadataTitle || "Reporte de Corresponsal en Staging";
        versionNexativa = {
          title: `[BORRADOR PENDIENTE] ${fallbackTitle}`,
          excerpt: "Error de procesamiento cognitivo de audio. Se requiere revisión manual.",
          content: `<p>Válvula de escape activada. No se pudo transcribir o redactar automáticamente el audio del corresponsal. Detalle del error: ${err.message || err}</p>`,
          tags: ["Revisión", "Corresponsal", "Error Procesamiento", "Ituzaingó", "Corrientes"]
        };

        versionPartner = {
          title: `[PENDIENTE DE REVISIÓN] ${fallbackTitle}`,
          content: `<p>Contenido en espera de edición debido a fallos en la transcripción automática.</p>`
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
          attached_media_url: mediaUrls,
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
