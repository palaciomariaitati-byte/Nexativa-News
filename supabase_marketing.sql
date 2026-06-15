-- Añadir flag de publicado en redes a noticias
ALTER TABLE articles ADD COLUMN IF NOT EXISTS social_published BOOLEAN DEFAULT false;

-- Crear tabla de campañas de marketing (anuncios)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  target_audience TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, paused, finished
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  social_published BOOLEAN DEFAULT false
);

-- Configurar RLS (Row Level Security) para marketing_campaigns
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede leer campañas" 
ON marketing_campaigns 
FOR SELECT 
USING (true);

CREATE POLICY "Staff puede insertar campañas" 
ON marketing_campaigns 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff puede actualizar campañas" 
ON marketing_campaigns 
FOR UPDATE 
USING (true);

CREATE POLICY "Staff puede eliminar campañas" 
ON marketing_campaigns 
FOR DELETE 
USING (true);
