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
    lowerTitle.includes('partido') ||
    lowerTitle.includes('dt')
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
    lowerTitle.includes('sudáfrica') ||
    lowerTitle.includes('ucrania')
  ) {
    return 'internacional';
  }
  return 'nacional';
}

/**
 * Genera una imagen contextual de altísima precisión basada en las palabras clave del título
 */
function getContextualImage(title: string, category: string): string {
  const t = title.toLowerCase();

  // ⚽ DEPORTES (Fútbol, Racing, Boca, River, Maxi Salas, Selección)
  if (category === 'deportes' || t.includes('salas') || t.includes('fútbol') || t.includes('boca') || t.includes('river') || t.includes('racing') || t.includes('partido') || t.includes('gol') || t.includes('campeón')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'; // Pelota / Estadio de Fútbol
  }

  // 🏥 SALUD / MEDICINA (Sangre, Crohn, Sarcopenia, Vacuna, Estudio)
  if (t.includes('sangre') || t.includes('crohn') || t.includes('sarcopenia') || t.includes('enfermedad') || t.includes('salud') || t.includes('médic') || t.includes('estudio') || t.includes('vacuna') || t.includes('virus')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'; // Medicina / Laboratorio
  }

  // 🌍 INTERNACIONAL / DIPLOMACIA (Sudáfrica, EEUU, Cumbre, Presidente, Cancillería)
  if (category === 'internacional' || t.includes('sudáfrica') || t.includes('eeuu') || t.includes('europa') || t.includes('cumbre') || t.includes('canciller') || t.includes('embajada')) {
    return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80'; // Diplomacia / Mapa Mundial
  }

  // 💼 ECONOMÍA / MERCADO (Dólar, Inflación, Mercado, Impuesto, Pyme, Banco)
  if (t.includes('dólar') || t.includes('inflación') || t.includes('economía') || t.includes('banco') || t.includes('mercado') || t.includes('afip') || t.includes('precio')) {
    return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80'; // Finanzas / Mercado
  }

  // 🌿 CORRIENTES / LOCAL (Río, Ituzaingó, Iberá, Paraná, Naturaleza)
  if (category === 'local' || t.includes('corrientes') || t.includes('ituzaingó') || t.includes('iberá') || t.includes('río') || t.includes('paraná')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'; // Naturaleza / Río
  }

  // Default Nacional
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
}

/**
 * Intenta extraer la imagen real meta og:image del portal de origen
 */
async function fetchRealOgImage(targetUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

    if (ogMatch && ogMatch[1]) {
      let img = ogMatch[1].trim();
      if (img.startsWith('//')) img = 'https:' + img;
      if (img.startsWith('http')) return img;
    }
  } catch (e) {}
  return null;
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
    console.log('[Auto-Fetch] Inicia ingesta inteligente con portadas de alta fidelidad...');

    const supabase = createServerSupabaseClient();

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

    // 2. Cargar URLs de artículos existentes
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

    // 3. Iterar e insertar noticias con imagen contextual / OG:Image real
    let totalAddedCount = 0;

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
          const cleanExcerpt = cleanExcerptText(item.description || '') || 'Noticia destacada publicada en vivo en Nexativa News.';
          const category = detectCategoryFromUrlOrText(rssUrl, title);

          // Intentar extraer la imagen real og:image o usar la imagen contextual del tema
          let finalImage = item.thumbnail;
          if (!finalImage) {
            finalImage = await fetchRealOgImage(link);
          }
          if (!finalImage) {
            finalImage = getContextualImage(title, category);
          }

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
            console.log(`[Auto-Fetch] ✅ Noticia ingresada con portada contextual (${category}): ${title}`);
            totalAddedCount++;
            existingUrls.add(link);
          }
        }
      } catch (feedErr) {
        console.error(`[Auto-Fetch] Error procesando fuente ${rssUrl}:`, feedErr);
      }
    }

    // 4. Actualizar imágenes existentes en la base de datos que tenían fotos genéricas mismatch
    try {
      const { data: existingMismatch } = await supabase
        .from('articles')
        .select('id, title, category, image_url')
        .eq('status', 'published')
        .limit(50);

      if (existingMismatch) {
        for (const art of existingMismatch) {
          const correctImg = getContextualImage(art.title, art.category || 'nacional');
          if (art.image_url !== correctImg) {
            await supabase.from('articles').update({ image_url: correctImg }).eq('id', art.id);
          }
        }
      }
    } catch (uErr) {}

    return NextResponse.json({
      success: true,
      message: `🎉 Ingesta e imágenes contextuales sincronizadas. Se procesaron las portadas de todas las noticias.`,
      added: totalAddedCount,
      sourcesCount: rssUrls.length,
    });
  } catch (error: any) {
    console.error('[Auto-Fetch] Error general:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
