import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // 60 segundos tiempo máximo de ejecución

// Feeds RSS directos de medios oficiales (Infobae, Clarín, La Nación, TyC Sports, El Litoral)
// Estos medios entregan imágenes reales HD en sus tags media:content / enclosure
const DIRECT_MEDIA_FEEDS = [
  'https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml',
  'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml',
  'https://www.clarin.com/rss/lo-ultimo/',
  'https://www.tycsports.com/rss/rss.xml',
  'https://www.ellitoral.com.ar/rss',
  'https://news.google.com/rss/search?q=Ituzaing%C3%B3+Corrientes&hl=es-419&gl=AR&ceid=AR:es-419',
];

function cleanCdata(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
}

/**
 * Limpia y desinfecta el texto del resumen eliminando etiquetas HTML y códigos escapados como &lt;a href...
 */
function sanitizeExcerptText(raw: string | null): string {
  if (!raw) return 'Noticia destacada en vivo en Nexativa News.';

  let text = raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Eliminar cualquier código HTML o enlaces
  text = text.replace(/<[^>]+>/g, '').trim();
  text = text.replace(/https?:\/\/\S+/gi, '').trim();

  // Si queda muy corto o con símbolos raros, dar texto limpio por defecto
  if (!text || text.length < 10) return 'Noticia publicada y maquetada en vivo en Nexativa News.';

  return text.substring(0, 180);
}

/**
 * Determina si una URL de imagen es válida y NO es un logo genérico de Google
 */
function isValidArticleImage(url: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();

  if (
    u.includes('googleusercontent') ||
    u.includes('news.google') ||
    u.includes('logo') ||
    u.includes('icon') ||
    u.includes('favicon') ||
    u.includes('placeholder')
  ) {
    return false;
  }
  return u.startsWith('http');
}

/**
 * Clasificador temático de imágenes contextuales en HD para cuando un medio no provee foto
 */
function getTopicImage(title: string, category: string): string {
  const t = title.toLowerCase();

  // ⚽ DEPORTES (Fútbol, Mastantuono, Real Madrid, Racing, Boca, River, San Lorenzo, Selección, Tenis, Básquet)
  if (
    category === 'deportes' ||
    t.includes('mastantuono') ||
    t.includes('real madrid') ||
    t.includes('salas') ||
    t.includes('fútbol') ||
    t.includes('futbol') ||
    t.includes('boca') ||
    t.includes('river') ||
    t.includes('racing') ||
    t.includes('gol') ||
    t.includes('partido') ||
    t.includes('dt ')
  ) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
  }

  // 🏥 SALUD / MEDICINA (Psicólogo, Chaco, Crohn, Sarcopenia, Sangre, Virus, Vacuna, Estudio)
  if (
    t.includes('psicólogo') ||
    t.includes('psicologo') ||
    t.includes('sangre') ||
    t.includes('crohn') ||
    t.includes('sarcopenia') ||
    t.includes('enfermedad') ||
    t.includes('salud') ||
    t.includes('médic') ||
    t.includes('estudio') ||
    t.includes('hospital')
  ) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80';
  }

  // 🏛️ POLÍTICA & GOBIERNO (Milei, Brasil, Conflicto, Ley de Tierras, Sesión, Congreso)
  if (
    t.includes('milei') ||
    t.includes('brasil') ||
    t.includes('ley de tierras') ||
    t.includes('congreso') ||
    t.includes('diputados') ||
    t.includes('senadores') ||
    t.includes('gobierno') ||
    t.includes('presidente')
  ) {
    return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80';
  }

  // 🌿 CORRIENTES & REGIONAL (Ituzaingó, Iberá, Yacyretá, Valdés, Paraná, Río)
  if (
    category === 'local' ||
    t.includes('corrientes') ||
    t.includes('ituzaingó') ||
    t.includes('ituzaingo') ||
    t.includes('iberá') ||
    t.includes('yacyretá') ||
    t.includes('río') ||
    t.includes('paraná')
  ) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
  }

  // ⚖️ POLICIALES & JUSTICIA (Asesinado, Chats, Maltrato, Chaco, Juez, Policiales, Fiscal)
  if (
    t.includes('asesinado') ||
    t.includes('novia') ||
    t.includes('chats') ||
    t.includes('maltrato') ||
    t.includes('crimen') ||
    t.includes('policía') ||
    t.includes('detenido') ||
    t.includes('justicia')
  ) {
    return 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
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
    lowerTitle.includes('mastantuono') ||
    lowerTitle.includes('real madrid') ||
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
    lowerTitle.includes('sudáfrica') ||
    lowerTitle.includes('ucrania')
  ) {
    return 'internacional';
  }
  return 'nacional';
}

/**
 * Parsea el XML del feed buscando imágenes en media:content, enclosure, media:thumbnail e img tags HTML.
 * Aplica POLÍTICA ESTRICTA DE NOTICIAS ACTUALES (Descharta noticias de más de 48 hs de antigüedad).
 */
function parseRssXml(xmlText: string) {
  const items: any[] = [];
  const itemMatches = Array.from(xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi));

  for (const match of itemMatches) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const pubDateMatch = itemXml.match(/<(pubDate|dc:date|updated|published)>([\s\S]*?)<\/(pubDate|dc:date|updated|published)>/i);

    const title = cleanCdata(titleMatch ? titleMatch[1] : '');
    const link = cleanCdata(linkMatch ? linkMatch[1] : '');
    const rawDesc = cleanCdata(descMatch ? descMatch[1] : '');
    const pubDateStr = cleanCdata(pubDateMatch ? pubDateMatch[2] : '');

    if (title && link) {
      // 1. POLÍTICA ESTRICTA DE NOTICIAS ACTUALES (Rechazar artículos antiguos > 48 horas)
      let itemDate = new Date();
      if (pubDateStr) {
        const parsedDate = new Date(pubDateStr);
        if (!isNaN(parsedDate.getTime())) {
          itemDate = parsedDate;
        }
      }

      const now = new Date();
      const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);

      // Descartar si tiene más de 48 horas de antigüedad
      if (hoursDiff > 48) {
        console.log(`[Auto-Fetch] ⛔ Rechazada noticia antigua (${itemDate.toISOString().slice(0, 10)}): ${title}`);
        continue;
      }

      // Descartar si la URL contiene patrones de fechas pasadas (ej: /2026-5-1- o /2025/ o /2024/)
      if (link.match(/\/(202[0-5]|2026-[1-7])-/i)) {
        console.log(`[Auto-Fetch] ⛔ Rechazada noticia con URL fechada en el pasado: ${link}`);
        continue;
      }

      let imageUrl: string | null = null;

      // 2. Buscar en <media:content url="...">
      const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      if (mediaMatch && mediaMatch[1] && isValidArticleImage(mediaMatch[1])) {
        imageUrl = mediaMatch[1];
      }

      // 3. Buscar en <enclosure url="...">
      if (!imageUrl) {
        const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
        if (enclosureMatch && enclosureMatch[1] && isValidArticleImage(enclosureMatch[1])) {
          imageUrl = enclosureMatch[1];
        }
      }

      // 4. Buscar en <media:thumbnail url="...">
      if (!imageUrl) {
        const thumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
        if (thumbMatch && thumbMatch[1] && isValidArticleImage(thumbMatch[1])) {
          imageUrl = thumbMatch[1];
        }
      }

      // 5. Buscar en <img src="..."> en el contenido HTML
      if (!imageUrl && rawDesc.includes('<img')) {
        const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1] && isValidArticleImage(imgMatch[1])) {
          imageUrl = imgMatch[1];
        }
      }

      items.push({
        title,
        link,
        pubDate: itemDate.toISOString(),
        description: rawDesc,
        thumbnail: imageUrl,
      });
    }
  }

  return items;
}

export async function GET(request: Request) {
  try {
    console.log('[Auto-Fetch] Inicia sincronización HD de imágenes de medios oficiales...');

    const supabase = createServerSupabaseClient();

    // 1. Cargar lista de fuentes (Usar medios oficiales directos si no hay o para complementar)
    let rssUrls: string[] = DIRECT_MEDIA_FEEDS;
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
          rssUrls = Array.from(new Set([...splitUrls, ...DIRECT_MEDIA_FEEDS]));
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

    // 3. Ingesta de noticias con foto real HD
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
          const cleanExcerpt = sanitizeExcerptText(item.description);
          const category = detectCategoryFromUrlOrText(rssUrl, title);

          // Asignar imagen real del medio u foto contextual HD representativa del tema
          let finalImage = item.thumbnail;
          if (!isValidArticleImage(finalImage)) {
            finalImage = getTopicImage(title, category);
          }

          const payload = {
            title,
            excerpt: cleanExcerpt,
            content: `<p>${cleanExcerpt}</p>\n\n<p><i>Fuente oficial: <a href="${link}" target="_blank" rel="noopener noreferrer">Leer nota completa en el portal de origen</a></i></p>`,
            image_url: finalImage,
            external_url: link,
            category: category,
            status: 'published',
            created_at: item.pubDate || new Date().toISOString(),
          };

          const { error: insertError } = await supabase.from('articles').insert([payload]);
          if (!insertError) {
            console.log(`[Auto-Fetch] ✅ Noticia reciente ingresada (${category}): ${title}`);
            totalAddedCount++;
            existingUrls.add(link);
          }
        }
      } catch (feedErr) {
        console.error(`[Auto-Fetch] Error procesando fuente ${rssUrl}:`, feedErr);
      }
    }

    // 4. Purga y limpieza estricta de noticias antiguas (> 48h o URLs fechadas en el pasado) en la BD
    try {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: oldArticles } = await supabase
        .from('articles')
        .select('id, title, external_url, created_at')
        .lt('created_at', twoDaysAgo);

      if (oldArticles && oldArticles.length > 0) {
        const oldIds = oldArticles.map((a: any) => a.id);
        await supabase.from('articles').delete().in('id', oldIds);
        console.log(`[Auto-Fetch] 🧹 Purgadas ${oldIds.length} noticias de fecha obsoleta de la base de datos.`);
      }
    } catch (purgeErr) {}

    return NextResponse.json({
      success: true,
      message: `🎉 Sincronización HD completa. Se reemplazaron logos de Google por portadas HD y se limpiaron los resúmenes.`,
      added: totalAddedCount,
      sourcesCount: rssUrls.length,
    });
  } catch (error: any) {
    console.error('[Auto-Fetch] Error general:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
