-- ============================================================================
-- MIGRACIÓN DE BASE DE DATOS PARA AGENTE EXECUTIVE: VALEN
-- TABLAS: nexativa_metrics, valen_global_leads, valen_memory, valen_task_logs
-- ============================================================================

-- 1. TABLA DE MÉTRICAS DEL ECOSISTEMA
CREATE TABLE IF NOT EXISTS public.nexativa_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  google_search_clicks INTEGER DEFAULT 0,
  google_trending_keywords JSONB DEFAULT '[]'::jsonb,
  social_media_engagement JSONB DEFAULT '{"likes": 0, "shares": 0, "mentions": 0}'::jsonb,
  job_board_conversions INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. TABLA DE LEADS Y PROSPECTOS DE EXPANSIÓN GLOBAL
CREATE TABLE IF NOT EXISTS public.valen_global_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_name TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'CORPORATE_ADVERTISER', -- 'VC_INVESTOR', 'REGIONAL_PARTNER', 'CORPORATE_ADVERTISER', 'PRESS_MEDIA'
  contact_info TEXT,
  pitch_summary TEXT,
  status TEXT DEFAULT 'PROSPECT', -- 'PROSPECT', 'PITCH_SENT', 'REPLIED', 'CONVERTED', 'CLOSED'
  conversion_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE MEMORIA PERSISTENTE Y ENTRENAMIENTO DE VALEN
CREATE TABLE IF NOT EXISTS public.valen_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  key TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'brand_guidelines', -- 'brand_guidelines', 'strategic_goal', 'learned_preference'
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE LOGS DE TAREAS Y TASA DE ÉXITO (KPIS)
CREATE TABLE IF NOT EXISTS public.valen_task_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  task_type TEXT NOT NULL, -- 'EXECUTIVE_REPORT', 'PITCH_GENERATION', 'OUTREACH_TASK', 'MEMORY_TRAINING', 'CHAT'
  title TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'COMPLETED', -- 'COMPLETED', 'PENDING', 'FAILED'
  success_score NUMERIC(5,2) DEFAULT 100.00
);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.nexativa_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valen_global_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valen_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valen_task_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO
DROP POLICY IF EXISTS "Permitir lectura y escritura nexativa_metrics" ON public.nexativa_metrics;
CREATE POLICY "Permitir lectura y escritura nexativa_metrics" ON public.nexativa_metrics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y escritura valen_global_leads" ON public.valen_global_leads;
CREATE POLICY "Permitir lectura y escritura valen_global_leads" ON public.valen_global_leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y escritura valen_memory" ON public.valen_memory;
CREATE POLICY "Permitir lectura y escritura valen_memory" ON public.valen_memory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y escritura valen_task_logs" ON public.valen_task_logs;
CREATE POLICY "Permitir lectura y escritura valen_task_logs" ON public.valen_task_logs FOR ALL USING (true) WITH CHECK (true);

-- DATOS SEMILLA INICIALES PARA MEMORIA DE VALEN
INSERT INTO public.valen_memory (key, category, content)
VALUES 
('brand_vision', 'strategic_goal', 'Nexativa News es un medio digital disruptivo impulsado por IA con costo $0 de cómputo operativo y alcance masivo. Meta: valuación > $10,000,000 USD.'),
('tone_guidelines', 'learned_preference', 'VALEN habla con tono ejecutivo sobrio, humano, transparente, directo, profesional pero cercano. Sin rodeos innecesarios.'),
('core_products', 'brand_guidelines', 'Ecosistema Nexativa: Periódico Digital, Marketplace Local, Clasificados de Empleo Autónomo, Estudio Surrealista Publicitario y Franquicias Regionales.')
ON CONFLICT (key) DO NOTHING;
