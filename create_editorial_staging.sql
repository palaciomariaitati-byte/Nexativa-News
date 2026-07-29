-- ==============================================================================
-- NEXATIVA NEWS - STAGING BUFFER & ALERTS SCHEMA (RESET & REBUILD)
-- ==============================================================================
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run" (Ejecutar).
-- Esto eliminará la estructura antigua con restricciones obsoletas (varchar(20))
-- y creará la tabla limpia con soporte para textos y audios sin límite.
-- ==============================================================================

-- 1. Eliminar tablas antiguas/obsoletas para limpiar restricciones viejas (como type varchar(20))
DROP TABLE IF EXISTS public.editorial_alerts CASCADE;
DROP TABLE IF EXISTS public.editorial_staging_queue CASCADE;

-- 2. Crear la tabla de staging con los tipos de datos actualizados (text sin límite)
CREATE TABLE public.editorial_staging_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL DEFAULT 'a8b297ea-5d91-402c-91d4-88ca6e2f19f3'::uuid,
  raw_metadata_title text,
  geolocation_coordinates text NOT NULL DEFAULT '-27.5973, -56.6874',
  attached_media_url text[] DEFAULT '{}'::text[],
  audio_url text,
  status text NOT NULL DEFAULT 'PENDING_REVIEW',
  version_nexativa jsonb,
  version_partner jsonb,
  transcription text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Tabla para registrar las alertas de fallos críticos del Webhook del Socio
CREATE TABLE public.editorial_alerts (
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

-- 5. Políticas de acceso total
DROP POLICY IF EXISTS "allow_all_staging" ON public.editorial_staging_queue;
CREATE POLICY "allow_all_staging" ON public.editorial_staging_queue FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_alerts" ON public.editorial_alerts;
CREATE POLICY "allow_all_alerts" ON public.editorial_alerts FOR ALL USING (true) WITH CHECK (true);

-- 6. OBLIGATORIO: Refrescar la memoria caché de esquemas en Supabase / PostgREST
NOTIFY pgrst, 'reload schema';
