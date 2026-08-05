import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NewsGenerator } from '@/modules/nora-pro/news_generator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // 60 seconds max execution time for cron

// Feeds RSS de respaldo directos
const DEFAULT_RSS_FEEDS = [
  'https://news.google.com/rss/search?q=Ituzaing%C3%B3+Corrientes&hl=es-419&gl=AR&ceid=AR:es-419',
  'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419',
];

function cleanExcerptText(raw: string): string {
  if (!raw) return '';
  let text = raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  text = text.replace(/<[^>]+>/g, '').trim();
  text = text.replace(/https?:\/\/\S+/gi, '').trim();
  return text.substring(0, 180);
}

function detectCategoryFromUrlOrText(rssUrl: string, title: string): string {
  const lowerUrl = rssUrl.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (
    lowerUrl.includes('sports') ||
    lowerUrl.includes('tycsports') ||
    lowerUrl.includes('ole') ||
    lowerTitle.includes('fútbol') ||
    lowerTitle.includes('boca') ||
    lowerTitle.includes('river') ||
    lowerTitle.includes('racing') ||
    lowerTitle.includes('salas') ||
    lowerTitle.includes('partido')
  ) {
    return 'deportes';
  }
  if (
    lowerUrl.includes('corrientes') ||
    lowerUrl.includes('ituzaing') ||
    lowerUrl.includes('ellitoral') ||
    lowerTitle.includes('corrientes') ||
    lowerTitle.includes('ituzaingó')
  ) {
    return 'local';
  }
  if (
    lowerUrl.includes('mundo') ||
    lowerUrl.includes('internacional') ||
    lowerTitle.includes('eeuu') ||
    lowerTitle.includes('europa') ||
    lowerTitle.includes('sudáfrica')
  ) {
    return 'internacional';
  }
  return 'nacional';
}

function getContextualImage(title: string, category: string): string {
  const t = title.toLowerCase();

  if (category === 'deportes' || t.includes('salas') || t.includes('fútbol') || t.includes('boca') || t.includes('river') || t.includes('racing') || t.includes('gol')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('sangre') || t.includes('crohn') || t.includes('sarcopenia') || t.includes('enfermedad') || t.includes('salud') || t.includes('médic')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80';
  }
  if (category === 'internacional' || t.includes('sudáfrica') || t.includes('eeuu') || t.includes('europa') || t.includes('cumbre')) {
    return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80';
  }
  if (category === 'local' || t.includes('corrientes') || t.includes('ituzaingó') || t.includes('iberá') || t.includes('río') || t.includes('paraná')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
}

export async function GET(request: Request) {
  try {
    console.log('[Auto-Fetch] Inicia ingesta periodística de NORA AI para Ituzaingó y Fuentes Globales...');

    const supabase = createServerSupabaseClient();
    let totalAddedCount = 0;

    // 1. Obtener Webhook de Make.com para redes sociales (si está configurado)
    let makeWebhookUrl = '';
    try {
      const { data: makeSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'make_webhook_url')
        .maybeSingle();

      if (makeSetting && makeSetting.value) {
        makeWebhookUrl = makeSetting.value.trim();
      }
    } catch (mErr) {}

    // 2. Invocación de NORA AI para redactar noticias locales exclusivas de Ituzaingó & Corrientes
    try {
      const nora = new NewsGenerator();
      const ituzaingoArticles = await nora.generateItuzaingoNews(2);

      for (const art of ituzaingoArticles) {
        const { data: insertedData, error: insErr } = await supabase
          .from('articles')
          .insert([art])
          .select('id')
          .single();

        if (!insErr) {
          totalAddedCount++;
          console.log(`[Auto-Fetch] 🧠 NORA AI publicó noticia local: ${art.title}`);

          // Disparar Webhook a Make.com para auto-publicar en Redes Sociales (Instagram, Facebook, X)
          if (makeWebhookUrl && insertedData?.id) {
            try {
              await fetch(makeWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: art.title,
                  excerpt: art.excerpt,
                  url: `https://nexativanews.com.ar/noticias/${insertedData.id}`,
                  image_url: art.image_url,
                  social_copy: art.social_copy,
                  category: art.category,
                }),
              });
            } catch (wErr) {}
          }
        }
      }
    } catch (noraErr) {
      console.error('[Auto-Fetch] Error en Nora AI local:', noraErr);
    }

    // 3. Obtener lista de URLs RSS generales
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

    // 4. Cargar URLs de artículos existentes
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

    // 5. Ingesta general complementaria
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
        const itemMatches = Array.from(xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi));

        for (const match of itemMatches) {
          const itemXml = match[1];
          const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
          const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
          const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);

          const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim() : '';
          const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim() : '';
          const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim() : '';

          if (!link || existingUrls.has(link)) continue;

          const cleanExcerpt = cleanExcerptText(rawDesc) || 'Noticia destacada publicada en vivo en Nexativa News.';
          const category = detectCategoryFromUrlOrText(rssUrl, title);
          const finalImage = getContextualImage(title, category);

          const payload = {
            title,
            excerpt: cleanExcerpt,
            content: `<p>${cleanExcerpt}</p>\n\n<p><i>Fuente oficial: <a href="${link}" target="_blank" rel="noopener noreferrer">Leer nota completa en el portal de origen</a></i></p>`,
            image_url: finalImage,
            external_url: link,
            category: category,
            status: 'published',
            created_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase.from('articles').insert([payload]);
          if (!insertError) {
            totalAddedCount++;
            existingUrls.add(link);
          }
        }
      } catch (fErr) {}
    }

    return NextResponse.json({
      success: true,
      message: `🎉 NORA AI procesó y publicó ${totalAddedCount} noticias locales e internacionales en Nexativa News.`,
      added: totalAddedCount,
    });
  } catch (error: any) {
    console.error('[Auto-Fetch] Error general:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
