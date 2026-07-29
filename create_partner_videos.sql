-- ==============================================================================
-- NEXATIVA NEWS - PARTNER VIDEOS INBOX SCHEMA
-- Firma Desarrolladora: MyJNexoraVisual
-- ==============================================================================
-- Copia este código en el "SQL Editor" de tu panel de Supabase y presiona "Run"
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.partner_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL DEFAULT 'Cadena 4',
  title text NOT NULL,
  video_url text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'archived')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.partner_videos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso total
DROP POLICY IF EXISTS "allow_all_partner_videos" ON public.partner_videos;
CREATE POLICY "allow_all_partner_videos" ON public.partner_videos FOR ALL USING (true) WITH CHECK (true);

-- Refrescar la memoria caché de esquemas en Supabase / PostgREST
NOTIFY pgrst, 'reload schema';
