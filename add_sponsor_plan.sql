-- Agrega la columna plan_type a la tabla sponsors
-- Valores permitidos conceptualmente: 'oro', 'plata', 'bronce'
-- Por defecto todos los existentes pasan a ser 'bronce'

ALTER TABLE public.sponsors 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'bronce';
