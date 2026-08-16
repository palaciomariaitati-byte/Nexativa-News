-- ========================================================================
-- MIGRACIÓN DE BASE DE DATOS: ECOSISTEMA NORAITU (CHAT & MEMORIA STATEFUL)
-- TABLAS AISLADAS PARA SESIONES, MENSAJES Y PERSISTENCIA GLOBAL A COSTO $0
-- ========================================================================

-- 1. Tabla de Sesiones de Conversación
CREATE TABLE IF NOT EXISTS public.noraitu_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT DEFAULT 'Nueva Conversación',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Mensajes del Chat
CREATE TABLE IF NOT EXISTS public.noraitu_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.noraitu_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices de Ultra Baja Latencia (B-Tree)
CREATE INDEX IF NOT EXISTS idx_noraitu_sessions_user_time 
ON public.noraitu_sessions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_noraitu_messages_session_time 
ON public.noraitu_messages(session_id, created_at ASC);

-- 4. Trigger para auto-actualizar updated_at en sesiones
CREATE OR REPLACE FUNCTION update_noraitu_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.noraitu_sessions
    SET updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_noraitu_session_time ON public.noraitu_messages;
CREATE TRIGGER trg_update_noraitu_session_time
AFTER INSERT ON public.noraitu_messages
FOR EACH ROW
EXECUTE FUNCTION update_noraitu_session_timestamp();

-- 5. Configuración de Seguridad y Row Level Security (RLS)
ALTER TABLE public.noraitu_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noraitu_messages ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para Service Role Backend y Acceso Público Anónimo con ID
CREATE POLICY "Permitir todo a Service Role en noraitu_sessions" 
ON public.noraitu_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir todo a Service Role en noraitu_messages" 
ON public.noraitu_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);
