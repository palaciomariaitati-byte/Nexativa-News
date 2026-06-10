-- ==============================================================================
-- Nexativa News - Zero-Cost Social Broadcast Queue Schema
-- Este archivo es 100% aditivo y no modifica las tablas existentes.
-- ==============================================================================

-- 1. Crear tipo enumerado para los estados de la cola
CREATE TYPE public.broadcast_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 2. Crear tipo enumerado para las plataformas
CREATE TYPE public.broadcast_platform AS ENUM ('telegram', 'twitter');

-- 3. Crear la tabla de cola
CREATE TABLE IF NOT EXISTS public.broadcast_queue (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id    UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    platform      public.broadcast_platform NOT NULL,
    status        public.broadcast_status NOT NULL DEFAULT 'pending',
    attempts      INT NOT NULL DEFAULT 0,
    max_attempts  INT NOT NULL DEFAULT 3,
    error_message TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at  TIMESTAMP WITH TIME ZONE
);

-- 4. Crear índice para buscar tareas pendientes rápidamente (vital para el cron)
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_pending 
ON public.broadcast_queue (status, created_at) 
WHERE status = 'pending';

-- 5. Trigger Function para encolar automáticamente
CREATE OR REPLACE FUNCTION public.enqueue_article_broadcasts()
RETURNS TRIGGER AS $$
BEGIN
    -- Encolar para Telegram
    INSERT INTO public.broadcast_queue (article_id, platform)
    VALUES (NEW.id, 'telegram');

    -- Encolar para Twitter
    INSERT INTO public.broadcast_queue (article_id, platform)
    VALUES (NEW.id, 'twitter');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger en la tabla articles
-- (Solo se ejecutará si la tabla articles existe)
DROP TRIGGER IF EXISTS trg_enqueue_article_broadcasts ON public.articles;
CREATE TRIGGER trg_enqueue_article_broadcasts
AFTER INSERT ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_article_broadcasts();

-- 7. RPC Function para procesar la cola de forma segura (FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.pop_broadcast_tasks(batch_size INT)
RETURNS SETOF public.broadcast_queue AS $$
BEGIN
    RETURN QUERY
    WITH queued AS (
        SELECT id FROM public.broadcast_queue
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.broadcast_queue
    SET status = 'processing', updated_at = NOW()
    WHERE id IN (SELECT id FROM queued)
    RETURNING *;
END;
$$ LANGUAGE plpgsql;
