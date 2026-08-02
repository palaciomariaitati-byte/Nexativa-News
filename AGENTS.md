<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# REGLA INQUEBRANTABLE DE SEGURIDAD Y BLINDAJE DE NORA (SECURITY PROTOCOL)
1. **PROHIBIDO HARDCODEAR CLAVES**: Bajo NINGUNA circunstancia se deben escribir claves de API (Gemini, Supabase Service Role, Vercel, etc.) directamente en archivos de código (.js, .ts, .tsx, .json, .md, .sql, etc.).
2. **USO EXCLUSIVO DE VARIABLES DE ENTORNO**: Todas las claves deben residir únicamente en `.env.local` (desarrollo local) y en las variables de entorno de Vercel / Render (producción).
3. **PROTECCIÓN EN GIT**: Los archivos `.env` y `.env.local` DEBEN estar incluidos obligatoriamente en `.gitignore` y jamás deben ser commiteados al repositorio público o privado de Git.
4. **FALLBACK REDUNDANTE PARA NORA**: El motor de NORA debe contar con soporte multi-key (GEMINI_API_KEY, GEMINI_API_KEY_FALLBACK, GEMINI_API_KEY_FALLBACK_2) para garantizar cero caídas en caso de revocación o agotamiento de cuotas.

