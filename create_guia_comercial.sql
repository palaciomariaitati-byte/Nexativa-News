-- SQL Migration: Tabla para Páginas Amarillas 2.0 (Guía Comercial Geolocalizada)
-- Archivo: create_guia_comercial.sql

CREATE TABLE IF NOT EXISTS directory_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Ituzaingó',
    province VARCHAR(100) DEFAULT 'Corrientes',
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    latitude NUMERIC(10, 6) DEFAULT -27.5853,
    longitude NUMERIC(10, 6) DEFAULT -56.6853,
    tier VARCHAR(20) DEFAULT 'BRONCE' CHECK (tier IN ('BRONCE', 'PLATA', 'ORO')),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED')),
    is_verified BOOLEAN DEFAULT true,
    stealth_status VARCHAR(50) DEFAULT 'PENDING' CHECK (stealth_status IN ('PENDING', 'INVITED_COURTESY', 'DEMO_ACTIVATED', 'SUBSCRIBED', 'DECLINED')),
    subscription_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas y geolocalización
CREATE INDEX IF NOT EXISTS idx_directory_category ON directory_businesses(category);
CREATE INDEX IF NOT EXISTS idx_directory_tier ON directory_businesses(tier);
CREATE INDEX IF NOT EXISTS idx_directory_status ON directory_businesses(status);

-- Habilitar RLS con acceso público de lectura y administrativo de escritura
ALTER TABLE directory_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública de comercios activos" 
ON directory_businesses 
FOR SELECT 
USING (status = 'ACTIVE');

CREATE POLICY "Permitir gestión administrativa de comercios" 
ON directory_businesses 
FOR ALL 
USING (true) 
WITH CHECK (true);
