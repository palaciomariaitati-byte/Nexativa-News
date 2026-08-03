-- Migration Script: Nexativa Empleos, Oficios, NoraScore y Certificados de Excelencia
-- Archivo: supabase_jobs_and_reviews.sql

-- 1. Tabla de Perfiles de Trabajadores y Oficios
CREATE TABLE IF NOT EXISTS job_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    trade_category VARCHAR(100) NOT NULL, -- ej: Plomero, Electricista, Costurera, Gasista, Cuidador, etc.
    bio TEXT,
    city VARCHAR(100) DEFAULT 'Ituzaingó',
    province VARCHAR(100) DEFAULT 'Corrientes',
    whatsapp VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    cv_url TEXT,
    avatar_url TEXT,
    nora_score NUMERIC(3,2) DEFAULT 5.00,
    total_reviews INT DEFAULT 0,
    badge_level VARCHAR(20) DEFAULT 'BRONCE' CHECK (badge_level IN ('BRONCE', 'PLATA', 'ORO', 'ORGULLO_REGIONAL')),
    is_verified BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Ofertas de Trabajo y Solicitudes de Servicio
CREATE TABLE IF NOT EXISTS job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) DEFAULT 'Ituzaingó, Corrientes',
    employer_name VARCHAR(255) NOT NULL,
    employer_whatsapp VARCHAR(50) NOT NULL,
    job_type VARCHAR(50) DEFAULT 'OFICIO_FREELANCE' CHECK (job_type IN ('OFICIO_FREELANCE', 'TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'TEMPORAL')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FILLED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Reseñas y Feedback (NoraScore™)
CREATE TABLE IF NOT EXISTS provider_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES job_profiles(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255) DEFAULT 'Vecino Verificado',
    reviewer_whatsapp VARCHAR(50) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    punctuality_score INT CHECK (punctuality_score BETWEEN 1 AND 5),
    quality_score INT CHECK (quality_score BETWEEN 1 AND 5),
    price_score INT CHECK (price_score BETWEEN 1 AND 5),
    comment TEXT,
    is_verified_interaction BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Certificados Emitidos
CREATE TABLE IF NOT EXISTS provider_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES job_profiles(id) ON DELETE CASCADE,
    certificate_code VARCHAR(100) UNIQUE NOT NULL, -- Ej: NEX-ORO-2026-8492
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    badge_title VARCHAR(100) DEFAULT 'Certificado de Excelencia Comunitaria',
    reviews_count INT DEFAULT 50,
    final_score NUMERIC(3,2) DEFAULT 5.00,
    pdf_url TEXT
);

-- Índices de búsqueda y rendimiento
CREATE INDEX IF NOT EXISTS idx_jobs_category ON job_profiles(trade_category);
CREATE INDEX IF NOT EXISTS idx_jobs_badge ON job_profiles(badge_level);
CREATE INDEX IF NOT EXISTS idx_reviews_profile ON provider_reviews(profile_id);

-- RLS (Row Level Security)
ALTER TABLE job_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura Pública
CREATE POLICY "Lectura pública de perfiles activos" ON job_profiles FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Lectura pública de ofertas activas" ON job_offers FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Lectura pública de reseñas" ON provider_reviews FOR SELECT USING (true);
CREATE POLICY "Lectura pública de certificados" ON provider_certificates FOR SELECT USING (true);

-- Políticas de Escritura
CREATE POLICY "Permitir inserción de perfiles" ON job_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserción de ofertas" ON job_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserción de reseñas" ON provider_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir gestión completa admin" ON job_profiles FOR ALL USING (true);
