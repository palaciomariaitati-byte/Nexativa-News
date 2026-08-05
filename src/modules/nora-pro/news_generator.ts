import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ENABLE_NORA_PRO = process.env.ENABLE_NORA_PRO === 'true';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const MOCK_RSS_URL = 'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419';

function cleanCdata(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
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
        content: rawDesc,
        description: rawDesc,
        thumbnail: imageUrl,
      });
    }
  }

  return items;
}

export class NewsGenerator {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_FALLBACK;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  public async generateNewArticles(count: number = 2): Promise<any[]> {
    try {
      const supabase = createServerSupabaseClient();

      let rssUrl = MOCK_RSS_URL;
      try {
        const { data: settingsData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'auto_news_rss_url')
          .maybeSingle();

        if (settingsData && settingsData.value && settingsData.value.trim()) {
          rssUrl = settingsData.value.trim();
        }
      } catch (sErr) {}

      // Fetch directo del XML (Sin rss2json)
      const resRss = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        cache: 'no-store',
      });

      if (!resRss.ok) {
        console.warn(`[Nora News Generator] Error HTTP ${resRss.status} al leer RSS directo.`);
        return [];
      }

      const xmlText = await resRss.text();
      const items = parseRssXml(xmlText);

      if (items.length === 0) return [];

      const { data: existingArticles } = await supabase
        .from('articles')
        .select('external_url')
        .not('external_url', 'is', null);

      const existingUrls = new Set((existingArticles || []).map((a: any) => a.external_url));
      const newItems = items.filter((item: any) => item.link && !existingUrls.has(item.link));
      const itemsToProcess = newItems.slice(0, count);

      const generatedArticles = [];

      for (const item of itemsToProcess) {
        const article = await this.rewriteArticleWithGemini(item);
        if (article) {
          generatedArticles.push(article);
        }
      }

      return generatedArticles;
    } catch (error) {
      console.error("[Nora News Generator] Error:", error);
      return [];
    }
  }

  private async rewriteArticleWithGemini(item: any): Promise<any | null> {
    const rawContent = item.content || item.description || "";
    const title = item.title || "";
    const link = item.link || "";

    let imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link) || null;
    if (!imageUrl && rawContent.includes('<img')) {
      const imgMatch = rawContent.match(/<img[^>]+src="([^">]+)"/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_FALLBACK;

    if (!apiKey) {
      console.warn("No GEMINI_API_KEY found, returning raw item as fallback.");
      return {
        title,
        excerpt: rawContent.replace(/<[^>]+>/g, '').substring(0, 150) + "...",
        content: `<p>${rawContent}</p><p><i>Fuente: <a href="${link}" target="_blank" rel="noopener noreferrer">Enlace Original</a></i></p>`,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        external_url: link,
        category: 'general',
        status: 'published'
      };
    }

    const prompt = `
Eres NORA, redactora periodística de Nexativa News en Argentina.
Tu tarea es tomar la noticia provista y reescribirla de manera completa, inteligente y original para respetarlos derechos de autor ("fair use").

Título original: ${title}
Contenido: ${rawContent.replace(/<[^>]+>/g, '')}

Devuelve la respuesta ESTRICTAMENTE en este formato JSON sin markdown:
{
  "newTitle": "Título atrapante nuevo",
  "excerpt": "Resumen corto de 150 caracteres...",
  "htmlContent": "<p>Contenido periodístico reescrito...</p>"
}
    `;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text().trim();
      const cleanedText = textResponse.replace(/^\`\`\`json/m, '').replace(/^\`\`\`/m, '').trim();
      const parsed = JSON.parse(cleanedText);

      const finalHtmlContent = `${parsed.htmlContent}\n\n<p><i>Fuente original: <a href="${link}" target="_blank" rel="noopener noreferrer">Leer nota completa aquí</a></i></p>`;

      return {
        title: parsed.newTitle || title,
        excerpt: parsed.excerpt || title,
        content: finalHtmlContent,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        external_url: link,
        category: 'general',
        status: 'published',
        author_id: null
      };
    } catch (error) {
      console.error("[Nora News Generator] Error Gemini:", error);
      return {
        title,
        excerpt: rawContent.replace(/<[^>]+>/g, '').substring(0, 150) + "...",
        content: `<p>${rawContent}</p><p><i>Fuente: <a href="${link}" target="_blank" rel="noopener noreferrer">Enlace Original</a></i></p>`,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        external_url: link,
        category: 'general',
        status: 'published'
      };
    }
  }
}
