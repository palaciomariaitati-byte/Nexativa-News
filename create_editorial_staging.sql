-- ==============================================================================
-- NEXATIVA NEWS - STAGING BUFFER & ALERTS SCHEMA
-- ==============================================================================
-- Copia todo este código, pegalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run" para crear las tablas necesarias para la corresponsalía.
-- ==============================================================================

-- 1. Tabla para la cola de staging editorial
CREATE TABLE IF NOT EXISTS public.editorial_staging_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL,
  raw_metadata_title text,
  geolocation_coordinates text NOT NULL,
  attached_media_url text[] DEFAULT '{}'::text[],
  audio_url text, -- Solo de referencia, el audio real no se expone públicamente
  status text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED_NEXATIVA_ONLY', 'APPROVED_PARTNER_ONLY', 'APPROVED_ALL_SIMULTANEOUS', 'AUDIO_ERROR_MANUAL_REVIEW_REQUIRED')),
  version_nexativa jsonb, -- Estructura: { title, excerpt, content, tags: [] }
  version_partner jsonb,  -- Estructura: { title, content }
  transcription text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tabla para registrar las alertas de fallos críticos del Webhook del Socio
CREATE TABLE IF NOT EXISTS public.editorial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id uuid REFERENCES public.editorial_staging_queue(id) ON DELETE CASCADE,
  alert_type text NOT NULL, -- Ej: 'WEBHOOK_FAILURE'
  message text NOT NULL,
  details jsonb, -- Ej: { partner_webhook_url, error, attempts, timestamp }
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Habilitar la Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.editorial_staging_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_alerts ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso total (la seguridad lógica la maneja Next.js y el Service Role key en el servidor)
DROP POLICY IF EXISTS "allow_all_staging" ON public.editorial_staging_queue;
CREATE POLICY "allow_all_staging" ON public.editorial_staging_queue FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_alerts" ON public.editorial_alerts;
CREATE POLICY "allow_all_alerts" ON public.editorial_alerts FOR ALL USING (true) WITH CHECK (true);

-- Refrescar la memoria caché de Supabase
NOTIFY pgrst, 'reload schema';
