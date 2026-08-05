import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // 60 seconds max execution time for cron

// Feeds RSS de respaldo gratuitos directos
const DEFAULT_RSS_FEEDS = [
  'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419', // Google News Argentina
];

function cleanCdata(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
}

function detectCategoryFromUrlOrText(rssUrl: string, title: string): string {
  const lowerUrl = rssUrl.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (lowerUrl.includes('sports') || lowerUrl.includes('tycsports') || lowerUrl.includes('ole') || lowerTitle.includes('fútbol') || lowerTitle.includes('boca') || lowerTitle.includes('river')) {
    return 'deportes';
  }
  if (lowerUrl.includes('corrientes') || lowerUrl.includes('ituzaing') || lowerUrl.includes('ellitoral') || lowerTitle.includes('corrientes') || lowerTitle.includes('ituzaingó')) {
    return 'local';
  }
  if (lowerUrl.includes('mundo') || lowerUrl.includes('internacional') || lowerTitle.includes('eeuu') || lowerTitle.includes('europa') || lowerTitle.includes('ucrania')) {
    return 'internacional';
  }
  return 'nacional'; // Por defecto Nacional (Coincide con la pestaña por defecto de Nexativa)
}

function parseRssXml(xmlText: string) {
  const items: any[] = [];
  const itemMatches = Array.from(xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi));

  for (const match of itemMatches) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);

    const title = cleanCdata(titleMatch ? titleMatch[1] : '');
    const link = cleanCdata(linkMatch ? linkMatch[1] : '');
    const rawDesc = cleanCdata(descMatch ? descMatch[1] : '');

    if (title && link) {
      let imageUrl = null;
      const imgMatch = rawDesc.match(/<img[^>]+src="([^">]+)"/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }

      items.push({
        title,
        link,
        description: rawDesc,
        thumbnail: imageUrl,
      });
    }
  }

  return items;
}

export async function GET(request: Request) {
  try {
    console.log('[Auto-Fetch] Inicia ingesta inteligente de noticias por categoría...');

    const supabase = createServerSupabaseClient();

    // Migración automática: cambiar artículos existentes con categoría 'general' a 'nacional'
    try {
      await supabase
        .from('articles')
        .update({ category: 'nacional' })
        .or('category.is.null,category.eq.general');
    } catch (mErr) {}

    // 1. Obtener lista de URLs RSS configuradas
    let rssUrls: string[] = DEFAULT_RSS_FEEDS;
    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'auto_news_rss_url')
        .maybeSingle();

      if (settingsData && settingsData.value && settingsData.value.trim()) {
        const raw = settingsData.value.trim();
        const splitUrls = raw
          .split(/[\n,]+/)
          .map((u: string) => u.trim())
          .filter((u: string) => u.startsWith('http'));

        if (splitUrls.length > 0) {
          rssUrls = splitUrls;
        }
      }
    } catch (sErr) {}

    // 2. Cargar URLs de artículos existentes para evitar duplicados
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

    // 3. Iterar e insertar noticias con categoría mapeada
    let totalAddedCount = 0;
    const defaultImages = [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    ];

    for (const rssUrl of rssUrls) {
      try {
        const resRss = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          cache: 'no-store',
        });

        if (!resRss.ok) continue;

        const xmlText = await resRss.text();
        const items = parseRssXml(xmlText);

        for (const item of items) {
          const link = item.link;
          if (!link || existingUrls.has(link)) continue;

          const title = item.title;
          const rawContent = item.description || '';
          let cleanExcerpt = rawContent.replace(/<[^>]+>/g, '').trim().substring(0, 180) + '...';
          if (!cleanExcerpt || cleanExcerpt === '...') cleanExcerpt = 'Noticia destacada publicada en vivo en Nexativa News.';

          const category = detectCategoryFromUrlOrText(rssUrl, title);
          const randomImg = defaultImages[totalAddedCount % defaultImages.length];

          const payload = {
            title,
            excerpt: cleanExcerpt,
            content: `<p>${rawContent || cleanExcerpt}</p>\n\n<p><i>Fuente oficial: <a href="${link}" target="_blank" rel="noopener noreferrer">Leer nota completa en el portal de origen</a></i></p>`,
            image_url: item.thumbnail || randomImg,
            external_url: link,
            category: category, // 'nacional' | 'deportes' | 'local' | 'internacional'
            status: 'published',
            created_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase.from('articles').insert([payload]);
          if (!insertError) {
            console.log(`[Auto-Fetch] ✅ Noticia ingresada (${category}): ${title}`);
            totalAddedCount++;
            existingUrls.add(link);
          }
        }
      } catch (feedErr) {
        console.error(`[Auto-Fetch] Error procesando fuente ${rssUrl}:`, feedErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Ingesta inteligente completa. Se publicaron ${totalAddedCount} noticias visibles en el portal.`,
      added: totalAddedCount,
      sourcesCount: rssUrls.length,
    });
  } catch (error: any) {
    console.error('[Auto-Fetch] Error general:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
