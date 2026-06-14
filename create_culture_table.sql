-- create_culture_table.sql
-- Ejecutar esto en el SQL Editor de Supabase

-- Crear la tabla cultural_posts
CREATE TABLE IF NOT EXISTS public.cultural_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    image_url TEXT,
    project_url TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Políticas de Seguridad (RLS)
ALTER TABLE public.cultural_posts ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer los posts publicados
CREATE POLICY "Public profiles are viewable by everyone."
ON public.cultural_posts FOR SELECT
USING ( status = 'published' );

-- Los administradores (usuarios autenticados) pueden insertar/actualizar/borrar
CREATE POLICY "Admins can insert cultural posts"
ON public.cultural_posts FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Admins can update cultural posts"
ON public.cultural_posts FOR UPDATE
USING ( auth.role() = 'authenticated' );

CREATE POLICY "Admins can delete cultural posts"
ON public.cultural_posts FOR DELETE
USING ( auth.role() = 'authenticated' );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_cultural_posts_updated ON public.cultural_posts;
CREATE TRIGGER on_cultural_posts_updated
    BEFORE UPDATE ON public.cultural_posts
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
