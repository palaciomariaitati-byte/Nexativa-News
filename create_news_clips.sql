-- ==============================================================================
-- NEXATIVA NEWS - TABLA DE CLIPS DE VIDEO Y RECORTES INDIVIDUALES
-- Firma Desarrolladora: Nexora One & Nora AI Engine
-- ==============================================================================
-- Copia este código en el "SQL Editor" de tu panel de Supabase y presiona "Run"
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.news_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  video_url text NOT NULL,
  source_title text DEFAULT 'Programa',
  start_time_seconds integer NOT NULL DEFAULT 0,
  end_time_seconds integer NOT NULL DEFAULT 60,
  start_timestamp text NOT NULL DEFAULT '00:00',
  end_timestamp text NOT NULL DEFAULT '01:00',
  duration_seconds integer NOT NULL DEFAULT 60,
  impact_score integer DEFAULT 8,
  category text NOT NULL DEFAULT 'nacional',
  social_caption text,
  thumbnail_url text,
  flash_id uuid REFERENCES public.news_flashes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'used', 'archived')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.news_clips ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso total para lectura y escritura
DROP POLICY IF EXISTS "allow_all_news_clips" ON public.news_clips;
CREATE POLICY "allow_all_news_clips" ON public.news_clips FOR ALL USING (true) WITH CHECK (true);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_news_clips_created_at ON public.news_clips (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_clips_category ON public.news_clips (category);

-- Migración automática: Copiar segmentos de news_flashes existentes a news_clips si aún no están
DO $$
DECLARE
  f RECORD;
  seg RECORD;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'news_flashes') THEN
    FOR f IN SELECT id, video_url, thumbnail_url, category, segments, created_at FROM public.news_flashes LOOP
      IF f.segments IS NOT NULL AND jsonb_array_length(f.segments) > 0 THEN
        FOR seg IN SELECT * FROM jsonb_to_recordset(f.segments) AS x(
          title text,
          summary text,
          video_url text,
          source_title text,
          start_time_seconds integer,
          end_time_seconds integer,
          start_timestamp text,
          end_timestamp text,
          duration_seconds integer,
          impact_score integer,
          category text,
          social_caption text
        ) LOOP
          INSERT INTO public.news_clips (
            title,
            summary,
            video_url,
            source_title,
            start_time_seconds,
            end_time_seconds,
            start_timestamp,
            end_timestamp,
            duration_seconds,
            impact_score,
            category,
            social_caption,
            thumbnail_url,
            flash_id,
            created_at
          )
          VALUES (
            COALESCE(seg.title, 'Clip Informativo'),
            seg.summary,
            COALESCE(seg.video_url, f.video_url),
            COALESCE(seg.source_title, 'Programa'),
            COALESCE(seg.start_time_seconds, 0),
            COALESCE(seg.end_time_seconds, 60),
            COALESCE(seg.start_timestamp, '00:00'),
            COALESCE(seg.end_timestamp, '01:00'),
            COALESCE(seg.duration_seconds, 60),
            COALESCE(seg.impact_score, 8),
            COALESCE(seg.category, f.category, 'nacional'),
            seg.social_caption,
            f.thumbnail_url,
            f.id,
            f.created_at
          )
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END $$;

-- Refrescar la memoria caché de esquemas en Supabase / PostgREST
NOTIFY pgrst, 'reload schema';
