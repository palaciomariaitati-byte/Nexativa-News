import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Genera el vector embedding (768 dimensiones) para un texto usando Gemini text-embedding-004 (Gratuito)
 */
export async function generateTextEmbedding(text: string): Promise<number[] | null> {
  const keysPool = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_FALLBACK_2,
    process.env.GEMINI_API_KEY_TERTIARY,
  ].filter(Boolean) as string[];

  if (keysPool.length === 0) {
    console.warn("[Embedding Warning] No se encontraron API keys configuradas.");
    return null;
  }

  const cleanText = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 8000);

  const embeddingModels = ["gemini-embedding-001", "gemini-embedding-2"];

  for (const apiKey of keysPool) {
    for (const em of embeddingModels) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: em });
        const result = await model.embedContent(cleanText);
        if (result.embedding && result.embedding.values) {
          return result.embedding.values;
        }
      } catch (err: any) {
        console.warn(`[Embedding Fallback Warning] Error con key (${apiKey.substring(0, 6)}...) y modelo (${em}):`, err.message);
      }
    }
  }

  return null;
}

/**
 * Fragmenta y guarda la memoria semántica de un artículo en Supabase (pgvector)
 */
export async function indexArticleSemanticMemory(articleId: string, title: string, content: string, category: string = "local"): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Unificar título y contenido limpio
    const fullText = `${title}\n\n${content.replace(/<[^>]+>/g, ' ')}`;
    const embedding = await generateTextEmbedding(fullText);

    if (!embedding) {
      console.error(`[Memory Index Error] No se pudo generar embedding para el artículo ${articleId}`);
      return false;
    }

    const { error } = await supabase
      .from("article_embeddings")
      .insert({
        article_id: articleId,
        chunk_content: fullText.substring(0, 2000), // Guardar extracto significativo
        metadata: { title, category, indexed_at: new Date().toISOString() },
        embedding: embedding
      });

    if (error) {
      console.error("[Memory Index Supabase Error]:", error);
      return false;
    }

    console.log(`[Memory Index Success] ✅ Artículo "${title}" indexado vectorialmente.`);
    return true;
  } catch (err: any) {
    console.error("[Memory Index Exception]:", err);
    return false;
  }
}

/**
 * Procesa asíncronamente en segundo plano un lote de artículos recién insertados
 */
export function autoIndexArticlesAsync(articles: Array<{ id: string; title: string; content?: string; category?: string }>): void {
  if (!articles || articles.length === 0) return;

  // Ejecución asíncrona no bloqueante
  Promise.allSettled(
    articles.map(article => 
      indexArticleSemanticMemory(
        article.id, 
        article.title || "Sin título", 
        article.content || "", 
        article.category || "local"
      )
    )
  ).then(results => {
    const success = results.filter(r => r.status === "fulfilled" && r.value).length;
    console.log(`[Auto-Indexing Async] 🚀 Indexación finalizada: ${success}/${articles.length} procesados.`);
  }).catch(err => {
    console.warn("[Auto-Indexing Async Warning] Fallo en procesamiento en segundo plano:", err);
  });
}

