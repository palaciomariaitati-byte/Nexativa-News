-- Esto elimina las politicas restrictivas y permite que el panel de admin inserte datos,
-- ya que la autenticacion esta manejada desde Next.js con una cookie.

-- 1. Eliminar politicas anteriores (si existen)
DROP POLICY IF EXISTS "Admins can insert cultural posts" ON public.cultural_posts;
DROP POLICY IF EXISTS "Admins can update cultural posts" ON public.cultural_posts;
DROP POLICY IF EXISTS "Admins can delete cultural posts" ON public.cultural_posts;

-- 2. Crear nuevas politicas permitiendo la modificacion
CREATE POLICY "Allow anon insert cultural posts"
ON public.cultural_posts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anon update cultural posts"
ON public.cultural_posts FOR UPDATE
USING (true);

CREATE POLICY "Allow anon delete cultural posts"
ON public.cultural_posts FOR DELETE
USING (true);
