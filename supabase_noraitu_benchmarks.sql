-- ========================================================================
-- 📊 TABLA DE TELEMETRÍA Y BENCHMARKS GLOBALES DE RENDIMIENTO (NORA ITU)
-- Mide SLA en tiempo real: Latencia de Voz (<1s), Precisión Visual y TCR
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.noraitu_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID REFERENCES public.noraitu_sessions(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  interaction_mode TEXT NOT NULL CHECK (interaction_mode IN ('voice', 'visual', 'text', 'live_vision')),
  
  -- Métricas de Latencia en Tiempo Real (ms)
  stt_latency_ms INTEGER,
  ttft_latency_ms INTEGER,
  tts_latency_ms INTEGER,
  total_latency_ms INTEGER NOT NULL,
  sla_voice_passed BOOLEAN GENERATED ALWAYS AS (total_latency_ms <= 1000) STORED,
  
  -- Modelo y Proveedor de Inferencia
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  
  -- Métricas de Accesibilidad y Tasa de Finalización de Tareas (TCR)
  accessibility_profile TEXT CHECK (accessibility_profile IN ('general', 'inclusion_tea', 'blindness_vision_loss', 'docente', 'catedra')),
  task_type TEXT,
  task_step_number INTEGER,
  task_total_steps INTEGER,
  task_completed BOOLEAN DEFAULT FALSE,
  
  -- Telemetría de Calidad Visual
  vision_confidence_score NUMERIC(5,2),
  ocr_detected BOOLEAN DEFAULT FALSE,
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices de alto rendimiento para monitoreo y dashboards
CREATE INDEX IF NOT EXISTS idx_noraitu_metrics_mode_created 
  ON public.noraitu_performance_metrics (interaction_mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_noraitu_metrics_sla 
  ON public.noraitu_performance_metrics (sla_voice_passed, total_latency_ms);

CREATE INDEX IF NOT EXISTS idx_noraitu_metrics_accessibility 
  ON public.noraitu_performance_metrics (accessibility_profile, task_completed);

-- Habilitar RLS con acceso público para inserción de telemetría segura
ALTER TABLE public.noraitu_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir insercion anonima de telemetria"
  ON public.noraitu_performance_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Lectura publica de metricas anonimizadas"
  ON public.noraitu_performance_metrics
  FOR SELECT
  USING (true);
