-- Tabla para registrar quejas y reclamos legales detectados por Nora

CREATE TABLE nora_complaints (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    chat_history JSONB NOT NULL,
    nora_response TEXT NOT NULL,
    status TEXT DEFAULT 'PENDIENTE_REVISION'
);

-- Políticas de Seguridad (RLS)
ALTER TABLE nora_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los administradores pueden ver todos los reclamos" 
ON nora_complaints 
FOR SELECT 
USING (true); -- Ajusta según tu configuración de roles

CREATE POLICY "Cualquiera puede insertar reclamos (Nora Server)" 
ON nora_complaints 
FOR INSERT 
WITH CHECK (true);
