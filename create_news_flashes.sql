-- ==============================================================================
-- NEXATIVA NEWS - FLASH DE NOTICIAS SCHEMA (1 a 5 Minutos)
-- ==============================================================================
-- Copia este código en el "SQL Editor" de tu panel de Supabase y presiona "Run"
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.news_flashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  duration_seconds integer NOT NULL DEFAULT 180,
  video_url text NOT NULL,
  thumbnail_url text,
  embed_url text,
  segments jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL DEFAULT 'nacional',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  partner_visible boolean NOT NULL DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.news_flashes ENABLE ROW LEVEL SECURITY;

-- Politicas de acceso total para lectura y escritura
DROP POLICY IF EXISTS "allow_all_flashes" ON public.news_flashes;
CREATE POLICY "allow_all_flashes" ON public.news_flashes FOR ALL USING (true) WITH CHECK (true);

-- Refrescar la memoria caché de esquemas en Supabase / PostgREST
NOTIFY pgrst, 'reload schema';
