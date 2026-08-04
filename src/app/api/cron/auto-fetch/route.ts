import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const maxDuration = 60; // 60 seconds max execution time for cron

// Feeds RSS de respaldo gratuitos si no hay ninguno configurado en ajustes
const DEFAULT_RSS_FEEDS = [
  'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419', // Google News Argentina en Vivo
  'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml',
];

export async function GET(request: Request) {
  try {
    console.log('[Auto-Fetch] Inicia sincronización automática de noticias...');

    const supabase = createServerSupabaseClient();

    // 1. Obtener la URL del RSS configurada en Settings o usar el Feed por defecto
    let rssUrl = DEFAULT_RSS_FEEDS[0];

    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'auto_news_rss_url')
        .maybeSingle();

      if (settingsData && settingsData.value) {
        rssUrl = settingsData.value;
      }
    } catch (sErr) {}

    console.log(`[Auto-Fetch] Extrayendo noticias automáticas de: ${rssUrl}`);

    // 2. Extraer el RSS usando el proxy rss2json
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(proxyUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} de rss2json`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error(`Error en rss2json: ${json.message}`);
    }

    const items = json.items || [];
    if (items.length === 0) {
      return NextResponse.json({ success: true, message: 'No se encontraron artículos nuevos en el feed RSS.' });
    }

    // 3. Obtener URLs existentes para evitar duplicados
    let existingUrls = new Set<string>();
    try {
      const { data: existingArticles } = await supabase
        .from('articles')
        .select('external_url')
        .not('external_url', 'is', null);

      if (existingArticles) {
        existingUrls = new Set(existingArticles.map((a: any) => a.external_url));
      }
    } catch (e) {}

    // 4. Procesar e insertar artículos nuevos
    let addedCount = 0;

    for (const item of items) {
      const link = item.link;
      if (!link || existingUrls.has(link)) {
        continue; // Ya existe o no tiene enlace
      }

      const title = item.title || 'Noticia de Última Hora';
      const rawContent = item.description || item.content || '';
      let cleanExcerpt = rawContent.replace(/<[^>]+>/g, '').trim().substring(0, 180) + '...';
      if (!cleanExcerpt || cleanExcerpt === '...') cleanExcerpt = 'Noticia de última hora actualizada automáticamente en Nexativa News.';

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
        content: `<!-- Auto-imported from ${json.feed?.title || 'Noticias en Vivo'} -->\n\n<p>${rawContent}</p>\n\n<p><i>Fuente oficial: <a href="${link}" target="_blank" rel="noopener noreferrer">Leer nota completa aquí</a></i></p>`,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        external_url: link,
        category: 'general',
        status: 'published',
        created_at: new Date().toISOString(),
      };

      try {
        const { error: insertError } = await supabase.from('articles').insert([payload]);
        if (!insertError) {
          console.log(`[Auto-Fetch] ✅ Noticia ingresada: ${title}`);
          addedCount++;
          existingUrls.add(link);
        }
      } catch (iErr) {
        console.error(`[Auto-Fetch] Error insertando noticia ${title}:`, iErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Sincronización completa. Se añadieron ${addedCount} noticias automáticamente.`,
      added: addedCount,
    });
  } catch (error: any) {
    console.error('[Auto-Fetch] Error general:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
