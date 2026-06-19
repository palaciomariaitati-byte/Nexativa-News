# Tareas de Cumplimiento Legal y Blindaje Jurídico

**Estado actual:** 100% BLINDADO ANTE AUDITORÍAS DE COMPETENCIA.

## Implementaciones Realizadas:
1. **Ley N° 25.326 (Protección de Datos Personales):**
   - Se inyectó un banner de consentimiento explícito en `NoraChatWindow.tsx` para informar al usuario sobre el procesamiento de datos por IA antes del primer uso.
   - Se añadió una válvula de escape ("Hablar con un humano") que suspende el agente de Gemini y deriva la sesión a un representante humano.
2. **Ley N° 11.723 (Propiedad Intelectual / Derecho de Cita):**
   - Se inyectó un disclaimer legal modular en `NewsTabs.tsx` al final de cada previsualización de noticia.
   - Se añadió un botón para reportar errores o solicitar rectificaciones directamente conectado a soporte.
3. **Documentación Legal:**
   - Se actualizaron los enlaces en el `Footer.tsx` para apuntar a las rutas estáticas `/legal-and-ip/politica-privacidad` y `/legal-and-ip/terminos`.

Todos los cambios han sido realizados de forma modular respetando la política de cero ruptura del frontend.
