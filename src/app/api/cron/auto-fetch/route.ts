import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const maxDuration = 60; // 60 seconds max execution time for cron

export async function GET(request: Request) {
  try {
    console.log("[Auto-Fetch] Inicia sincronización automática de noticias...");

    const supabase = createServerSupabaseClient();

    // 1. Obtener la URL del RSS configurada en Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'auto_news_rss_url')
      .single();

    if (settingsError || !settingsData || !settingsData.value) {
      console.log("[Auto-Fetch] No hay URL configurada en settings o hubo un error:", settingsError);
      return NextResponse.json({ success: false, message: 'RSS URL no configurada en ajustes.' });
    }

    const rssUrl = settingsData.value;
    console.log(`[Auto-Fetch] Extrayendo noticias de: ${rssUrl}`);

    // 2. Extraer el RSS usando el proxy rss2json
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=`; 
    // Nota: rss2json tiene límites en la capa gratuita si no usamos api_key, pero cada 60 mins debería estar bien.
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} de rss2json`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error(`Error en rss2json: ${json.message}`);
    }

    const items = json.items || [];
    if (items.length === 0) {
      return NextResponse.json({ success: true, message: 'No se encontraron artículos en el RSS.' });
    }

    // 3. Procesar artículos nuevos
    let addedCount = 0;
    
    // Obtenemos todos los URLs que ya existen para comparar rápido
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('external_url')
      .not('external_url', 'is', null);

    const existingUrls = new Set((existingArticles || []).map((a: any) => a.external_url));

    for (const item of items) {
      const link = item.link;
      if (!link || existingUrls.has(link)) {
        continue; // Ya existe o no tiene enlace
      }

      // Preparamos los datos
      const title = item.title;
      
      // Limpiar el contenido HTML para el resumen
      let rawContent = item.description || item.content || "";
      let cleanExcerpt = rawContent.replace(/<[^>]+>/g, '').trim().substring(0, 150) + "...";
      if (!cleanExcerpt || cleanExcerpt === "...") cleanExcerpt = "Noticia destacada extraída automáticamente.";

      // Extraer imagen si viene en enclosure o thumbnail
      let imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link) || null;
      if (!imageUrl && rawContent.includes('<img')) {
        const imgMatch = rawContent.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
      }

      const payload = {
        title,
        excerpt: cleanExcerpt,
        content: `<!-- Auto-imported from ${json.feed.title || 'RSS'} -->\n\n<p>${rawContent}</p>\n\n<p><i>Fuente original: <a href="${link}" target="_blank">Leer nota completa aquí</a></i></p>`,
        image_url: imageUrl,
        external_url: link,
        category: 'internacional', // Default o podríamos mapear con item.categories
        status: 'published', // Se publica instantáneamente según pedido
        author_id: null,
      };

      const { error: insertError } = await supabase.from('articles').insert([payload]);
      if (insertError) {
        console.error(`[Auto-Fetch] Error insertando noticia ${title}:`, insertError);
      } else {
        console.log(`[Auto-Fetch] ✅ Noticia ingresada: ${title}`);
        addedCount++;
        existingUrls.add(link); // Añadir para no duplicar en la misma pasada
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sincronización completa. Se añadieron ${addedCount} noticias nuevas.`,
      added: addedCount 
    });

  } catch (error: any) {
    console.error("[Auto-Fetch] Error general:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
