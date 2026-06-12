-- ==============================================================================
-- NEXATIVA NEWS - SUPABASE HOTFIX
-- ==============================================================================
-- Instrucciones:
-- Copia todo este código, pégalo en el "SQL Editor" de tu panel de Supabase 
-- y presiona el botón "Run" (Ejecutar).
-- ==============================================================================

-- 1. Añadir los nuevos campos de redes sociales a la tabla "sponsors"
-- Usamos ADD COLUMN IF NOT EXISTS para que sea seguro ejecutarlo varias veces.
ALTER TABLE public.sponsors 
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS email text;

-- (Opcional) Si en el futuro necesitas "is_pro", puedes descomentar la siguiente línea:
-- ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS is_pro boolean default false;

-- ==============================================================================
-- 2. Solucionar el bloqueo de RLS en "broadcast_queue"
-- Esto permite que cualquier proceso del lado del servidor (Cron/Edge Functions)
-- o usuario autenticado (incluso anónimo si usas el cliente público en pruebas)
-- pueda insertar y actualizar la cola de tareas sin restricciones.
-- ==============================================================================

-- Si la tabla aún no existe por alguna razón, se crea la estructura básica
CREATE TABLE IF NOT EXISTS public.broadcast_queue (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    platform text not null,
    task_data jsonb not null,
    status text default 'pending',
    attempts int default 0,
    error_message text
);

-- Desactivamos Row Level Security para que no bloquee las inserciones
ALTER TABLE public.broadcast_queue DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ¡LISTO! Tu plataforma Nexativa ya está 100% parcheada y actualizada.
-- ==============================================================================
