-- Tabla para almacenar los prospectos generados por Nora

CREATE TABLE nora_leads (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rubro_cliente TEXT NOT NULL,
    whatsapp_comercial TEXT NOT NULL,
    producto_estrella TEXT NOT NULL,
    perfil_copywriting JSONB NOT NULL,
    perfil_tecnico JSONB NOT NULL,
    guion_video TEXT NOT NULL,
    mensaje_whatsapp TEXT NOT NULL,
    status TEXT DEFAULT 'EN ESPERA'
);

-- Políticas de Seguridad (RLS) - Opcional según configuración del proyecto
ALTER TABLE nora_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los administradores pueden ver todos los leads" 
ON nora_leads 
FOR SELECT 
USING (true); -- Ajusta esto según tu configuración de roles de admin

CREATE POLICY "Cualquiera puede insertar leads (Nora Server)" 
ON nora_leads 
FOR INSERT 
WITH CHECK (true);

-- Actualización (Módulo Legal)
ALTER TABLE nora_leads ADD COLUMN IF NOT EXISTS legal_disclaimer_accepted BOOLEAN DEFAULT false;

