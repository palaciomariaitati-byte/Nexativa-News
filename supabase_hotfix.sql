-- ==============================================================================
-- NEXATIVA NEWS - PARCHE PARA TABLA DE PRODUCTOS Y CONFIGURACIÓN (STORE)
-- ==============================================================================
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run".
-- ==============================================================================

-- 1. Crear tabla de configuraciones si no existe (Para el nombre de la tienda, etc)
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para settings y permitir acceso a todos (Next.js maneja la seguridad)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_settings" ON public.settings;
CREATE POLICY "allow_all_settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 2. Asegurarnos de que la columna "stock" y "buy_url" existan en "products"
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buy_url text;

-- 3. Refrescar la memoria caché de Supabase obligatoriamente
-- Esto soluciona los errores donde el panel dice que la columna "no existe" en el caché
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- ¡LISTO! Vuelve a intentar cargar tu producto y guardar tu tienda.
-- ==============================================================================
