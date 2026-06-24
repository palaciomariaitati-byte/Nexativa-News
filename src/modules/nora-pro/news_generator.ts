import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ENABLE_NORA_PRO = process.env.ENABLE_NORA_PRO === 'true';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Fallback o mock
const MOCK_RSS_URL = 'https://feeds.bbci.co.uk/mundo/rss.xml';

export class NewsGenerator {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Genera 1 o 2 noticias nuevas a partir del feed RSS configurado.
   * Utiliza Gemini para reescribirlas y respetar los derechos de autor (Fair Use).
   */
  public async generateNewArticles(count: number = 2): Promise<any[]> {
    if (!ENABLE_NORA_PRO) {
      console.log("[Nora News Generator] NORA PRO desactivado. No se generarán noticias.");
      return [];
    }

    try {
      const supabase = createServerSupabaseClient();

      // 1. Obtener la URL del RSS configurada
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'auto_news_rss_url')
        .single();

      const rssUrl = (settingsData && settingsData.value) ? settingsData.value : MOCK_RSS_URL;

      // 2. Extraer el RSS usando el proxy rss2json
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Error fetching RSS feed");

      const json = await response.json();
      if (json.status !== 'ok') throw new Error("RSS2JSON returned error");

      const items = json.items || [];
      if (items.length === 0) return [];

      // 3. Filtrar artículos que ya están en la BD (para no repetir fuentes)
      const { data: existingArticles } = await supabase
        .from('articles')
        .select('external_url')
        .not('external_url', 'is', null);

      const existingUrls = new Set((existingArticles || []).map((a: any) => a.external_url));
      
      const newItems = items.filter((item: any) => item.link && !existingUrls.has(item.link));
      
      // Tomamos solo los necesarios (count)
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

    // Extraer imagen
    let imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link) || null;
    if (!imageUrl && rawContent.includes('<img')) {
      const imgMatch = rawContent.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    if (!this.genAI) {
      console.warn("No GEMINI_API_KEY found, returning raw item as fallback (not recommended for copyright).");
      return {
        title,
        excerpt: rawContent.substring(0, 100) + "...",
        content: `<p>${rawContent}</p><p><i>Fuente: <a href="${link}" target="_blank">Enlace Original</a></i></p>`,
        image_url: imageUrl,
        external_url: link,
        category: 'internacional',
        status: 'published'
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = `
Eres Nora, una redactora periodística profesional de NexativaNews. 
Tu tarea es reescribir la siguiente noticia para que sea 100% original, respetando los derechos de autor ("fair use") y aportando valor.
Usa un tono periodístico pero accesible para una audiencia local.
Crea un nuevo título atrapante.
Genera un resumen corto (excerpt) de no más de 150 caracteres.
Genera el contenido de la noticia en formato HTML válido (usando <p>, <strong>, etc.), pero NO incluyas un link a la fuente original en tu respuesta, yo lo agregaré programáticamente.

Noticia original a reescribir:
Título: ${title}
Contenido base: ${rawContent.replace(/<[^>]+>/g, '')}

Devuelve la respuesta ESTRICTAMENTE en este formato JSON, sin markdown ni backticks:
{
  "newTitle": "El nuevo título",
  "excerpt": "El nuevo resumen corto...",
  "htmlContent": "<p>El contenido reescrito...</p>"
}
      `;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text().trim();
      
      // Intentar parsear el JSON
      let parsed = null;
      try {
        // En caso de que Gemini devuelva backticks de markdown
        const cleanedText = textResponse.replace(/^\`\`\`json/m, '').replace(/^\`\`\`/m, '').trim();
        parsed = JSON.parse(cleanedText);
      } catch (e) {
        console.error("Error parsing Gemini JSON:", e, textResponse);
        return null;
      }

      // Añadimos la atribución programáticamente
      const finalHtmlContent = \`\${parsed.htmlContent}\n\n<p><i>Fuente original: <a href="\${link}" target="_blank" rel="noopener noreferrer">Leer nota completa aquí</a></i></p>\`;

      return {
        title: parsed.newTitle || title,
        excerpt: parsed.excerpt || title,
        content: finalHtmlContent,
        image_url: imageUrl,
        external_url: link,
        category: 'internacional', // O se podría detectar dinámicamente
        status: 'published',
        author_id: null
      };

    } catch (error) {
      console.error("[Nora News Generator] Error con Gemini:", error);
      return null;
    }
  }
}
