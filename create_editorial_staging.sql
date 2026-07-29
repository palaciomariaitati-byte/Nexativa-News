-- ==============================================================================
-- NEXATIVA NEWS - STAGING BUFFER & ALERTS SCHEMA MIGRATION
-- ==============================================================================
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run" (Ejecutar).
-- ==============================================================================

-- 1. Asegurar la creación de la tabla si no existe
CREATE TABLE IF NOT EXISTS public.editorial_staging_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Migrar/Agregar todas las columnas requeridas por el Corresponsal Móvil
ALTER TABLE public.editorial_staging_queue 
  ADD COLUMN IF NOT EXISTS operator_id uuid NOT NULL DEFAULT 'a8b297ea-5d91-402c-91d4-88ca6e2f19f3'::uuid,
  ADD COLUMN IF NOT EXISTS raw_metadata_title text,
  ADD COLUMN IF NOT EXISTS geolocation_coordinates text NOT NULL DEFAULT '-27.5973, -56.6874',
  ADD COLUMN IF NOT EXISTS attached_media_url text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDING_REVIEW',
  ADD COLUMN IF NOT EXISTS version_nexativa jsonb,
  ADD COLUMN IF NOT EXISTS version_partner jsonb,
  ADD COLUMN IF NOT EXISTS transcription text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 3. Tabla para registrar las alertas de fallos críticos del Webhook del Socio
CREATE TABLE IF NOT EXISTS public.editorial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id uuid REFERENCES public.editorial_staging_queue(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  message text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Habilitar la Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.editorial_staging_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_alerts ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de acceso (sin restricciones para el servicio role y cliente)
DROP POLICY IF EXISTS "allow_all_staging" ON public.editorial_staging_queue;
CREATE POLICY "allow_all_staging" ON public.editorial_staging_queue FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_alerts" ON public.editorial_alerts;
CREATE POLICY "allow_all_alerts" ON public.editorial_alerts FOR ALL USING (true) WITH CHECK (true);

-- 6. OBLIGATORIO: Refrescar la memoria caché de esquemas en Supabase / PostgREST
NOTIFY pgrst, 'reload schema';
