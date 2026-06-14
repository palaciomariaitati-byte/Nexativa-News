-- ==============================================================================
-- NEXATIVA NEWS - PARCHE PARA AUSPICIANTES (SLOGAN y RED X)
-- ==============================================================================
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run".
-- ==============================================================================

-- 1. Agregar la columna "slogan" a la tabla sponsors
ALTER TABLE public.sponsors 
  ADD COLUMN IF NOT EXISTS slogan text;

-- 2. Agregar la columna "x_url" (Twitter) a la tabla sponsors
ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS x_url text;

-- Refrescar la memoria caché de Supabase
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- ¡LISTO!
-- ==============================================================================
