import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { id, type } = await req.json();
    if (!id || !type) return NextResponse.json({ error: "ID y type son obligatorios" }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    // 1. Obtener la URL del Webhook
    const { data: settings } = await supabase.from('settings').select('make_webhook_url').single();
    if (!settings?.make_webhook_url) {
      return NextResponse.json({ error: "No hay una URL de Webhook de Make configurada en Redes Sociales." }, { status: 400 });
    }

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

      // Si es una noticia, usamos a Nora para generar un copy rápido y atractivo
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("No Gemini API Key");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `Actúa como Community Manager Experto. Escribe UN solo post (copy) cautivador y viral para redes sociales sobre esta noticia. Usa emojis, hashtags relevantes y un tono profesional pero atrapante. 
      Título: ${article.title}
      Resumen: ${article.excerpt}
      Cuerpo: ${article.content.substring(0, 1000)}`;

      const result = await model.generateContent(prompt);
      const socialCopy = result.response.text();

      payload = {
        ...payload,
        title: article.title,
        content: socialCopy,
        image_url: article.image_url,
        url: `https://www.nexativanews.com.ar/news/${article.slug || id}`,
        category: article.category
      };
      tableToUpdate = "articles";
    }

    // 3. Enviar a Make.com
    const makeRes = await fetch(settings.make_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!makeRes.ok) {
      return NextResponse.json({ error: "Make.com rechazó la petición: " + makeRes.statusText }, { status: 500 });
    }

    // 4. Marcar como publicado en redes
    if (tableToUpdate) {
      await supabase.from(tableToUpdate).update({ social_published: true }).eq("id", id);
    }

    return NextResponse.json({ success: true, message: "Webhook enviado con éxito" });

  } catch (error: any) {
    console.error("Error en social-publish:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
