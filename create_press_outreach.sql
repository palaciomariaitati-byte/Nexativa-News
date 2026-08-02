-- SQL Migration: Tabla para seguimiento de campañas de Pitching y Prensa Anti-Spam
-- Archivo: create_press_outreach.sql

CREATE TABLE IF NOT EXISTS press_outreach_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journalist_name VARCHAR(255) NOT NULL,
    media_outlet VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) DEFAULT 'General',
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'INTERESTED', 'PUBLISHED', 'DECLINED', 'OPT_OUT')),
    pitch_subject TEXT,
    pitch_body TEXT,
    follow_up_count INT DEFAULT 0 CHECK (follow_up_count <= 2),
    last_contacted_at TIMESTAMPTZ,
    response_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por correo y estado
CREATE INDEX IF NOT EXISTS idx_press_outreach_email ON press_outreach_logs(email);
CREATE INDEX IF NOT EXISTS idx_press_outreach_status ON press_outreach_logs(status);

-- RLS Policies (Solo lectura/escritura administrativa)
ALTER TABLE press_outreach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso administrativo a press_outreach_logs" 
ON press_outreach_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);
