-- 1. BLINDAJE DE WHATSAPP CONTRA DUPLICADOS AUTOMÁTICOS
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
    message_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_created_at 
ON public.processed_webhooks(processed_at);

-- 2. INFRAESTRUCTURA VECTORIAL DESACOPLADA PARA NORA
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.article_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    chunk_content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(768) NOT NULL
);

-- Índice HNSW de alta velocidad para búsqueda por similitud de coseno
CREATE INDEX IF NOT EXISTS idx_article_embeddings_hnsw 
ON public.article_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Función RPC para búsquedas semánticas eficientes desde el backend
CREATE OR REPLACE FUNCTION match_articles(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (id UUID, article_id UUID, chunk_content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT 
    id, 
    article_id, 
    chunk_content, 
    1 - (article_embeddings.embedding <=> query_embedding) AS similarity
  FROM public.article_embeddings
  WHERE 1 - (article_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
