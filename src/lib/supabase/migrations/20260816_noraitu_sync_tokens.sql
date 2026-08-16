-- ========================================================================
-- 📲 TABLA EFÍMERA DE SINCRONIZACIÓN POR CÓDIGO QR (NORA TITÁN)
-- Ubicación: src/lib/supabase/migrations/20260816_noraitu_sync_tokens.sql
-- ========================================================================

CREATE TABLE IF NOT EXISTS noraitu_sync_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    desktop_socket_id TEXT,
    user_id TEXT,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORIZED', 'CONSUMED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Índice para búsquedas rápidas por token y estado activo
CREATE INDEX IF NOT EXISTS idx_noraitu_sync_tokens_lookup 
ON noraitu_sync_tokens (token_id, status, expires_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE noraitu_sync_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad permisivas para emparejamiento efímero anónimo
CREATE POLICY "Permitir crear tokens efimeros" 
ON noraitu_sync_tokens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir consultar tokens efimeros validos" 
ON noraitu_sync_tokens 
FOR SELECT 
USING (expires_at > NOW());

CREATE POLICY "Permitir autorizar tokens efimeros" 
ON noraitu_sync_tokens 
FOR UPDATE 
USING (expires_at > NOW() AND status = 'PENDING');
