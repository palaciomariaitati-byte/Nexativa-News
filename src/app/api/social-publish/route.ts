import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { id, type } = await req.json();
    if (!id || !type) return NextResponse.json({ error: "ID y type son obligatorios" }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    // 1. Obtener la URL del Webhook de Make.com
    const { data: settingsItem } = await supabase.from('settings').select('value').eq('key', 'make_webhook_url').maybeSingle();
    if (!settingsItem?.value) {
      return NextResponse.json({ error: "No hay una URL de Webhook de Make configurada en Redes Sociales." }, { status: 400 });
    }
    const make_webhook_url = settingsItem.value.trim();

    let payload: any = { source: type, url: "https://www.nexativanews.com.ar" };
    let tableToUpdate = "";

    // 2. Extraer datos según el tipo
    if (type === "marketing") {
      const { data: campaign, error } = await supabase.from("marketing_campaigns").select("*").eq("id", id).single();
      if (error || !campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
      
      payload = {
        ...payload,
        client: campaign.client_name,
        title: campaign.campaign_name,
        content: campaign.content,
        image_url: campaign.image_url,
        target_audience: campaign.target_audience
      };
      tableToUpdate = "marketing_campaigns";

    } else if (type === "news") {
      const { data: article, error } = await supabase.from("articles").select("*").eq("id", id).single();
      if (error || !article) return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });

      // Generar copy seguro con soporte Multi-Key y fallback en caso de error de API key
      let socialCopy = `📰 ${article.title}\n\n${article.excerpt || ''}\n\n👉 Leé la nota completa en https://www.nexativanews.com.ar/noticias/${article.id}\n#NexativaNews #Argentina`;

      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_FALLBACK || process.env.GEMINI_API_KEY_FALLBACK_2;
      
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          const prompt = `Actúa como Community Manager periodístico. Escribe UN solo post (copy) cautivador y viral para redes sociales sobre esta noticia. Usa emojis, hashtags relevantes y un tono profesional pero atrapante. 
          Título: ${article.title}
          Resumen: ${article.excerpt || ''}`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) socialCopy = text;
        } catch (aiErr: any) {
          console.warn("[Social Publish] Gemini API key falló, usando plantilla segura de respaldo:", aiErr.message);
        }
      }

      payload = {
        ...payload,
        title: article.title,
        content: socialCopy,
        image_url: article.image_url,
        url: `https://www.nexativanews.com.ar/noticias/${article.id}`,
        category: article.category || 'nacional'
      };
      tableToUpdate = "articles";

    } else if (type === "press_release" || type === "press_pitch") {
      const { generateHito1PressKit } = await import('@/modules/nora-pro/press_generator');
      const pressKit = generateHito1PressKit();
      
      payload = {
        ...payload,
        title: pressKit.headline,
        subheadline: pressKit.subheadline,
        content: pressKit.bodyParagraphs.join("\n\n"),
        url: "https://nexativanews.com.ar/prensa/estudio-servicios-2026",
        x_thread: pressKit.socialSnippets.xThread,
        linkedin_post: pressKit.socialSnippets.linkedInPost,
        whatsapp_alert: pressKit.socialSnippets.whatsAppAlert,
        press_pitch_email: pressKit.pressPitchEmail
      };
    }

    // 3. Enviar a Make.com
    const makeRes = await fetch(make_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!makeRes.ok) {
      return NextResponse.json({ error: "Make.com respondió con estado: " + makeRes.statusText }, { status: 500 });
    }

    // 4. Marcar como publicado en redes
    if (tableToUpdate) {
      await supabase.from(tableToUpdate).update({ social_published: true }).eq("id", id);
    }

    return NextResponse.json({ success: true, message: "🎉 Noticia enviada a redes exitosamente" });

  } catch (error: any) {
    console.error("[Social Publish Error]:", error);
    return NextResponse.json({ error: error.message || "Error al procesar envío a redes" }, { status: 500 });
  }
}
