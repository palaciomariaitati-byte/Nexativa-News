-- Migration SQL: Tabla de Inmuebles en Alquiler con Calendario de Disponibilidad Anti-Estafas
-- Archivo: create_inmuebles_table.sql

CREATE TABLE IF NOT EXISTS properties_for_rent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('CABAÑA', 'DEPARTAMENTO', 'CASA', 'QUINTA', 'LOCAL', 'DUPOLEX', 'OTRO')),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) DEFAULT 'Ituzaingó',
    province VARCHAR(100) DEFAULT 'Corrientes',
    capacity_guests INT DEFAULT 2,
    price_per_night NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ARS',
    description TEXT,
    
    -- Datos de Identificación y Responsabilidad del Propietario (Anti-Estafas)
    owner_name VARCHAR(255) NOT NULL,
    owner_dni VARCHAR(50) NOT NULL,
    owner_phone VARCHAR(50) NOT NULL,
    owner_email VARCHAR(255),
    
    -- Rango Estricto de Disponibilidad del Calendario (Obligatorio)
    available_from DATE NOT NULL,
    available_to DATE NOT NULL,
    
    -- Blindaje Jurídico y Estado del Inmueble
    anti_fraud_accepted BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) DEFAULT 'DISPONIBLE' CHECK (status IN ('DISPONIBLE', 'ACTIVE', 'OCUPADO', 'EN_REPARACION', 'EN_PREPARACION', 'PAUSED', 'SUSPENDED_NEGLIGENT', 'BAN_PERMANENT')),
    penalty_count INT DEFAULT 0,
    fine_amount_ars NUMERIC(12, 2) DEFAULT 0.00,
    
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Restricción de inconsistencia de fechas
    CONSTRAINT check_dates_order CHECK (available_to >= available_from)
);

-- Índices para optimizar búsquedas por fechas de disponibilidad y estado
CREATE INDEX IF NOT EXISTS idx_properties_dates ON properties_for_rent (available_from, available_to);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties_for_rent (status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties_for_rent (property_type);

-- Seguridad RLS
ALTER TABLE properties_for_rent ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública únicamente para inmuebles activos sin sanciones de baneo
CREATE POLICY "Permitir lectura pública de inmuebles activos" 
ON properties_for_rent 
FOR SELECT 
USING (status = 'ACTIVE');

-- Política de gestión administrativa y creación
CREATE POLICY "Permitir gestión total de inmuebles" 
ON properties_for_rent 
FOR ALL 
USING (true) 
WITH CHECK (true);
