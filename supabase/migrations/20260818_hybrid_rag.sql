-- ========================================================================
-- 🔍 MIGRACIÓN SUPABASE: RAG HÍBRIDO (PGVECTOR + BM25 FULLTEXT SEARCH)
-- Ubicación: supabase/migrations/20260818_hybrid_rag.sql
-- ========================================================================

-- 1. Habilitar extensión pgvector si aún no está activa
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Añadir columna tsvector para búsqueda BM25 en español en la tabla articles
ALTER TABLE IF EXISTS articles 
ADD COLUMN IF NOT EXISTS fts_es tsvector 
GENERATED ALWAYS AS (to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))) STORED;

-- 3. Crear índice GIN ultrarrápido para BM25 en Postgres
CREATE INDEX IF NOT EXISTS articles_fts_es_idx ON articles USING gin(fts_es);

-- 4. Función de búsqueda híbrida combinando similitud del coseno y BM25
CREATE OR REPLACE FUNCTION match_articles_hybrid(
  query_text text,
  query_embedding vector(768),
  match_count int DEFAULT 6,
  fulltext_weight float DEFAULT 0.35,
  semantic_weight float DEFAULT 0.65
)
RETURNS TABLE (
  id bigint,
  title text,
  excerpt text,
  content text,
  category text,
  external_url text,
  created_at timestamp with time zone,
  score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_search AS (
    SELECT 
      a.id,
      1 - (ae.embedding <=> query_embedding) AS sem_score
    FROM article_embeddings ae
    JOIN articles a ON a.id = ae.article_id
    ORDER BY ae.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  fulltext_search AS (
    SELECT 
      a.id,
      ts_rank_cd(a.fts_es, websearch_to_tsquery('spanish', query_text)) AS fts_score
    FROM articles a
    WHERE a.fts_es @@ websearch_to_tsquery('spanish', query_text)
    ORDER BY fts_score DESC
    LIMIT match_count * 2
  )
  SELECT 
    a.id,
    a.title,
    a.excerpt,
    a.content,
    a.category,
    a.external_url,
    a.created_at,
    (
      coalesce(ss.sem_score, 0.0) * semantic_weight + 
      coalesce(fts.fts_score, 0.0) * fulltext_weight
    )::float AS score
  FROM articles a
  LEFT JOIN semantic_search ss ON a.id = ss.id
  LEFT JOIN fulltext_search fts ON a.id = fts.id
  WHERE ss.sem_score IS NOT NULL OR fts.fts_score IS NOT NULL
  ORDER BY score DESC
  LIMIT match_count;
END;
$$;
