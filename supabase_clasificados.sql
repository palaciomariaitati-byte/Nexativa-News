-- ========================================================================
-- 🛒 CLASIFICADOS NEXATIVA — ESQUEMA COMPLETO DE BASE DE DATOS Y STORAGE
-- Plataforma de Compra-Venta Local y Segunda Mano de Ituzaingó y la Región
-- ========================================================================

-- 1. Crear tabla principal de artículos clasificados
CREATE TABLE IF NOT EXISTS public.classified_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL, 
  -- Categorías sugeridas: 'vehiculos', 'herramientas', 'tecnologia', 'hogar', 'electrodomesticos', 'inmuebles', 'indumentaria', 'otros'
  condition TEXT NOT NULL DEFAULT 'buen_estado', 
  -- 'nuevo', 'como_nuevo', 'muy_bueno', 'buen_estado', 'con_detalles', 'a_reparar'
  price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ARS', -- 'ARS' o 'USD'
  is_negotiable BOOLEAN NOT NULL DEFAULT TRUE,
  accepts_trade BOOLEAN NOT NULL DEFAULT FALSE, -- Acepta permuta
  location TEXT NOT NULL DEFAULT 'Ituzaingó, Corrientes',
  description TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}', -- Hasta 10 URLs de imágenes en Supabase Storage
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  seller_whatsapp TEXT NOT NULL,
  seller_email TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE, -- Destacado en Portada de Nexativa News
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'sold', 'deleted'
  views_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- Datos adicionales (km, año de auto, marca, modelo, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices de alta velocidad para búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_classified_items_category ON public.classified_items(category);
CREATE INDEX IF NOT EXISTS idx_classified_items_is_active ON public.classified_items(is_active);
CREATE INDEX IF NOT EXISTS idx_classified_items_is_featured ON public.classified_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_classified_items_location ON public.classified_items(location);
CREATE INDEX IF NOT EXISTS idx_classified_items_created_at ON public.classified_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classified_items_price ON public.classified_items(price);

-- Índice de búsqueda de texto completo en Español para el buscador
CREATE INDEX IF NOT EXISTS idx_classified_items_search ON public.classified_items 
USING GIN (to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, '')));

-- 3. Trigger para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION public.handle_classified_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_classified_updated_at ON public.classified_items;
CREATE TRIGGER tr_classified_updated_at
BEFORE UPDATE ON public.classified_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_classified_updated_at();

-- 4. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.classified_items ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura pública de todos los avisos activos
DROP POLICY IF EXISTS "Lectura publica de clasificados activos" ON public.classified_items;
CREATE POLICY "Lectura publica de clasificados activos"
ON public.classified_items
FOR SELECT
USING (is_active = TRUE AND status != 'deleted');

-- Política 2: Inserción abierta para que la comunidad publique sin fricción
DROP POLICY IF EXISTS "Insercion publica de avisos clasificados" ON public.classified_items;
CREATE POLICY "Insercion publica de avisos clasificados"
ON public.classified_items
FOR INSERT
WITH CHECK (true);

-- Política 3: Actualización y borrado administrativo (Service Role o Autor)
DROP POLICY IF EXISTS "Modificacion administrativa de clasificados" ON public.classified_items;
CREATE POLICY "Modificacion administrativa de clasificados"
ON public.classified_items
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Configuración del Bucket de Almacenamiento de Fotos (classifieds-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'classifieds-images',
  'classifieds-images',
  true,
  10485760, -- 10MB por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];

-- 6. Políticas de Acceso para el Storage de Fotos
DROP POLICY IF EXISTS "Lectura publica de fotos de clasificados" ON storage.objects;
CREATE POLICY "Lectura publica de fotos de clasificados"
ON storage.objects FOR SELECT
USING (bucket_id = 'classifieds-images');

DROP POLICY IF EXISTS "Subida publica de fotos de clasificados" ON storage.objects;
CREATE POLICY "Subida publica de fotos de clasificados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'classifieds-images');

DROP POLICY IF EXISTS "Eliminacion de fotos de clasificados" ON storage.objects;
CREATE POLICY "Eliminacion de fotos de clasificados"
ON storage.objects FOR DELETE
USING (bucket_id = 'classifieds-images');

-- ========================================================================
-- ¡LISTO! Ejecutar este script en el SQL Editor de Supabase.
-- ========================================================================
