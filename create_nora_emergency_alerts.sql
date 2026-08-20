-- ========================================================================
-- 🚨 TABLA OPCIONAL PARA HISTORIAL DE ALERTAS SOS EN NUBE (NORA LAZARILLO)
-- Ejecutar en Supabase SQL Editor si deseas registrar el historial de alertas
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_phone TEXT,
  contact_name TEXT,
  message_payload TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Política de lectura/escritura para el servicio del backend
CREATE POLICY "Permitir insercion de alertas SOS a service_role"
  ON public.emergency_alerts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir insercion publica de alertas SOS"
  ON public.emergency_alerts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
