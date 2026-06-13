-- ==============================================================================
-- NEXATIVA NEWS - PARCHE FINAL PARA LA TABLA SPONSORS (SOCIOS PRO)
-- ==============================================================================
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run".
-- ==============================================================================

-- Agregar la columna is_pro a la tabla sponsors para permitir los Socios Nivel Oro
ALTER TABLE public.sponsors 
  ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;

-- Refrescar la memoria caché de Supabase
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- ¡LISTO!
-- ==============================================================================
