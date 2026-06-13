-- ==============================================================================
-- NEXATIVA NEWS - PARCHE FINAL ACUMULATIVO (TIENDA, REALTIME, NOTICIAS)
-- ==============================================================================
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run".
-- ==============================================================================

-- 1. Agregar la columna is_pro a la tabla sponsors para permitir los Socios Nivel Oro
ALTER TABLE public.sponsors 
  ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;

-- 2. Agregar enlace externo a la tabla articles para redireccionar a la noticia original
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS external_url text;

-- 3. Solucionar el error de "updated_at" en la tabla products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default now();

-- 4. Habilitar la transmisión en Tiempo Real (Realtime) para que el video y la tienda
--    se actualicen sin necesidad de que el usuario recargue la página en el celular.
--    (Si ya están agregadas, lanzará un warning menor que no afecta en nada).
BEGIN;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'video_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_queue;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
COMMIT;

-- Refrescar la memoria caché de Supabase
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- ¡LISTO!
-- ==============================================================================
