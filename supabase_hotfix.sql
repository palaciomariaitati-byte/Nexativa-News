-- ==============================================================================
-- NEXATIVA NEWS - PARCHE FINAL PARA LA TABLA SPONSORS Y ARTICLES
-- ==============================================================================
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run".
-- ==============================================================================

-- Agregar la columna is_pro a la tabla sponsors para permitir los Socios Nivel Oro
ALTER TABLE public.sponsors 
  ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;

-- Agregar enlace externo a la tabla articles para redireccionar a la noticia original
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS external_url text;

-- Refrescar la memoria caché de Supabase
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- ¡LISTO!
-- ==============================================================================
