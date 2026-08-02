-- ==============================================================================
-- NEXATIVA NEWS - MULTI-PARTNER ADVERTISING & ARBITRATION SCHEMA
-- ==============================================================================

-- 1. Tabla de Spots de Pauta Publicitaria
CREATE TABLE IF NOT EXISTS public.ad_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  video_url text NOT NULL,
  partner_id text NOT NULL DEFAULT 'cadena4', -- ID del socio (ej: 'cadena4', 'radio_corrientes', 'nexativa_main')
  channel_target text NOT NULL DEFAULT 'partner_only' CHECK (channel_target IN ('master_only', 'partner_only', 'global')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'queued_buffer', 'paused')),
  created_by_role text NOT NULL DEFAULT 'partner_operator' CHECK (created_by_role IN ('master_nexativa', 'partner_operator')),
  position integer NOT NULL DEFAULT 1,
  duration_seconds integer NOT NULL DEFAULT 30,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tabla de Configuración de Intercalado por Socio / Canal
CREATE TABLE IF NOT EXISTS public.ad_settings (
  partner_id text PRIMARY KEY DEFAULT 'nexativa_main',
  interval_minutes integer NOT NULL DEFAULT 15,
  is_auto_interleave boolean NOT NULL DEFAULT true,
  trigger_now_token text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ad_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público/admin
DROP POLICY IF EXISTS "allow_all_ad_spots" ON public.ad_spots;
CREATE POLICY "allow_all_ad_spots" ON public.ad_spots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_ad_settings" ON public.ad_settings;
CREATE POLICY "allow_all_ad_settings" ON public.ad_settings FOR ALL USING (true) WITH CHECK (true);

-- Insertar configuración inicial por defecto para Nexativa Main y Cadena 4
INSERT INTO public.ad_settings (partner_id, interval_minutes, is_auto_interleave)
VALUES 
  ('nexativa_main', 15, true),
  ('cadena4', 15, true)
ON CONFLICT (partner_id) DO NOTHING;

-- Notificar recarga de esquema en PostgREST / Supabase
NOTIFY pgrst, 'reload schema';
