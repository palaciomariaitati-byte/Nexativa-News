import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { id, type } = await req.json();
    if (!id || !type) return NextResponse.json({ error: "ID y type son obligatorios" }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    // Cargar configuraciones de Make Webhook e Instagram Direct API Token
    const { data: settingsList } = await supabase.from('settings').select('*');
    const settingsMap: Record<string, string> = {};
    if (settingsList) {
      settingsList.forEach((s) => {
        if (s.key && s.value) settingsMap[s.key] = s.value.trim();
      });
    }

    const make_webhook_url = settingsMap['make_webhook_url'] || '';
    const ig_token = settingsMap['instagram_access_token'] || '';
    const ig_user_id = settingsMap['instagram_account_id'] || '';

    let payload: any = { source: type, url: "https://www.nexativanews.com.ar" };
    let tableToUpdate = "";
    let articleTitle = "";
    let socialCopy = "";
    let imageUrl = "";

    // 1. Extraer datos según el tipo
    if (type === "marketing") {
      const { data: campaign, error } = await supabase.from("marketing_campaigns").select("*").eq("id", id).single();
      if (error || !campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
      
      articleTitle = campaign.campaign_name;
      socialCopy = campaign.content || campaign.campaign_name;
      imageUrl = campaign.image_url;

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

      articleTitle = article.title;
      imageUrl = article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
      socialCopy = `📲 ¡ÚLTIMO MOMENTO! 🌿\n\n${article.title}\n\n${article.excerpt || ''}\n\n👉 Leé la nota completa en https://www.nexativanews.com.ar/noticias/${article.id}\n\n#Ituzaingó #Corrientes #NexativaNews #Noticias`;

      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_FALLBACK || process.env.GEMINI_API_KEY_FALLBACK_2;
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
          
          const prompt = `Actúa como Community Manager de Nexativa News en Argentina. Escribe UN solo post (copy) cautivador y viral para redes sociales (Instagram/Facebook/X) sobre esta noticia. Usa emojis, hashtags relevantes (#Ituzaingó #Corrientes #NexativaNews) y un tono periodístico atrapante. 
          Título: ${article.title}
          Resumen: ${article.excerpt || ''}`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) socialCopy = text.trim();
        } catch (aiErr: any) {
          console.warn("[Social Publish] Gemini API key falló, usando plantilla periodística de respaldo:", aiErr.message);
        }
      }

      payload = {
        ...payload,
        title: article.title,
        content: socialCopy,
        image_url: imageUrl,
        url: `https://www.nexativanews.com.ar/noticias/${article.id}`,
        category: article.category || 'nacional'
      };
      tableToUpdate = "articles";
    }

    let directIgSuccess = false;
    let makeWebhookSuccess = false;

    // 2. Publicación Directa a la API Graph de Instagram (Si hay token e ID de cuenta)
    if (ig_token && ig_user_id && imageUrl) {
      try {
        console.log('[Social Publish] Intentando publicación directa vía Meta Graph API...');
        
        // Paso A: Crear contenedor de imagen
        const containerUrl = `https://graph.facebook.com/v18.0/${ig_user_id}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(socialCopy)}&access_token=${encodeURIComponent(ig_token)}`;
        const containerRes = await fetch(containerUrl, { method: 'POST' });
        const containerData = await containerRes.json();

        if (containerData && containerData.id) {
          // Paso B: Publicar contenedor
          const publishUrl = `https://graph.facebook.com/v18.0/${ig_user_id}/media_publish?creation_id=${containerData.id}&access_token=${encodeURIComponent(ig_token)}`;
          const pubRes = await fetch(publishUrl, { method: 'POST' });
          const pubData = await pubRes.json();

          if (pubData && pubData.id) {
            directIgSuccess = true;
            console.log('[Social Publish] ✅ Publicación Directa en Instagram Exitosa. ID:', pubData.id);
          }
        }
      } catch (igErr) {
        console.error('[Social Publish] Error en Instagram Direct API:', igErr);
      }
    }

    // 3. Envío al Webhook de Make.com (Si está configurado)
    if (make_webhook_url) {
      try {
        const makeRes = await fetch(make_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (makeRes.ok) makeWebhookSuccess = true;
      } catch (mErr) {}
    }

    // 4. Marcar como publicado en redes en Supabase
    if (tableToUpdate) {
      await supabase.from(tableToUpdate).update({ social_published: true }).eq("id", id);
    }

    return NextResponse.json({
      success: true,
      message: directIgSuccess
        ? "🎉 ¡Publicado DIRECTAMENTE en tu feed de Instagram y redes!"
        : "🎉 Noticia enviada a redes sociales exitosamente.",
      social_copy: socialCopy,
      image_url: imageUrl,
      direct_ig: directIgSuccess,
      make_webhook: makeWebhookSuccess,
    });

  } catch (error: any) {
    console.error("[Social Publish Error]:", error);
    return NextResponse.json({ error: error.message || "Error al procesar envío a redes" }, { status: 500 });
  }
}
