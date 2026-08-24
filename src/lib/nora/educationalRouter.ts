/**
 * ========================================================================
 * 🎓 NORAITU EDUCATIONAL & ACCESSIBILITY BENCHMARK ROUTER
 * Ubicación: /src/lib/nora/educationalRouter.ts
 * Estándares: DUA 3.0 (CAST), Taxonomía de Bloom Revisada, Marco UNESCO TIC y Protocolo TCR
 * ========================================================================
 */

export function resolveAdaptiveEducationalContext(arg1: any, arg2?: any): string {
  const userMessage = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : "");
  const contextData = typeof arg1 === "object" ? arg1 : (typeof arg2 === "object" ? arg2 : {});

  const lower = (userMessage || "").toLowerCase();
  const explicitMode = contextData?.mode?.toLowerCase() || "";

  // 1. MODO INCLUSIÓN Y ACCESIBILIDAD COGNITIVA (TEA / Asperger / Discapacidad Visual / Single-Task TCR)
  const isInclusion = explicitMode === "inclusion" || 
    ["autismo", "asperger", "tea", "neurodivergente", "literal", "sin metaforas", "sin metáforas", "paso a paso literal", "pasos secuenciales", "sin ambigüedades", "sin ambiguedades", "sobrecarga sensorial", "lenguaje literal", "anticipacion", "apoyo visual", "concreto", "ciego", "no vidente", "baja vision", "baja visión"].some(w => lower.includes(w));

  if (isInclusion) {
    return `
========================================================================
🧩 MODO INCLUSIÓN COGNITIVA Y ACCESIBILIDAD UNIVERSAL (ESTÁNDAR DUA 3.0 / TEA / CEGUERA)
========================================================================
1. DIRECTIVA DE ATOMICIDAD (SINGLE-TASK STEPPING PARA ALTO TCR - TASK COMPLETION RATE):
   - Nunca entregues más de 1 o 2 pasos consecutivos en el mismo turno si el usuario está realizando un procedimiento o tarea práctica.
   - Da la instrucción concreta del paso actual y concluye con una pregunta de verificación clara (ej. "¿Completaste este paso para pasar al siguiente?").
2. COMUNICACIÓN LITERAL Y CERO SOBRECARGA:
   - Comunicación 100% literal, clara, directa y estructurada.
   - PROHIBIDO TERMINANTEMENTE usar metáforas complejas, modismos ambiguos, ironías, sarcasmos o dobles sentidos.
   - Anticipa el objetivo de la respuesta en la primera línea.
3. PROTOCOLO ESPACIAL PARA DISCAPACIDAD VISUAL:
   - Usa referencias espaciales relativas directas tipo esfera de reloj ("a tus 2 en punto", "a tu derecha inmediata", "en el centro a 30 cm").
========================================================================
`;
  }

  // 2. MODO PEDAGÓGICO INTERNACIONAL Y DISEÑO CURRICULAR (Marco UNESCO & Taxonomía de Bloom)
  const isPedagogy = explicitMode === "docente" || 
    ["planificacion", "secuencia didactica", "unidad didactica", "curriculo", "diseno curricular", "rubrica de evaluacion", "plan de clase", "objetivos de aprendizaje", "criterios de evaluacion", "situacion de aprendizaje", "dua", "bloom", "unesco"].some(w => lower.includes(w));

  if (isPedagogy) {
    return `
========================================================================
🎓 MODO PEDAGÓGICO DE CLASE MUNDIAL (MARCO UNESCO TIC & TAXONOMÍA DE BLOOM REVISADA)
========================================================================
- Estructura las planificaciones con alineación a estándares curriculares internacionales y Diseño Universal para el Aprendizaje (DUA):
  1. 🎯 **Nivel Cognitivo Bloom**: Identifica explícitamente la dimensión (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear).
  2. 📚 **Objetivos de Aprendizaje Medibles**: Formulados con verbos de desempeño operacionalizables.
  3. 📋 **Secuencia Didáctica de 3 Fases**:
     * **Inicio (Apertura)**: Activación de saberes previos y disparador motivacional.
     * **Desarrollo (Andamiaje)**: Actividades con progresión de dificultad y diversificación de formatos (Pautas DUA).
     * **Cierre (Metacognición)**: Síntesis, autorregulación y evaluación formativa.
  4. 📊 **Grilla Curricular en Tabla Markdown**:
     Genera siempre una tabla estructurada (Columnas: | Fase | Actividad y Consigna | Recursos y Tiempo | Criterio de Evaluación DUA |).
  5. 📝 **Rúbrica Analítica con Escala de Desempeño**: (Inicial, En Proceso, Logrado, Destacado).
========================================================================
`;
  }

  // 3. MODO CÁTEDRA Y RIGOR ACADÉMICO SUPERIOR (Nivel Universitario / Investigación / Jurídico)
  const isUniversity = explicitMode === "catedra" || 
    ["jurisprudencia", "doctrina", "codigo civil", "codigo penal", "calculo integral", "derivadas", "termodinamica", "ecuaciones diferenciales", "tesis", "marco teorico", "paper", "epistemologia", "metodologia de la investigacion", "fallo", "derecho constitucional"].some(w => lower.includes(w));

  if (isUniversity) {
    return `
========================================================================
🏛️ MODO CÁTEDRA Y RIGOR ACADÉMICO SUPERIOR ACTIVO (NIVEL UNIVERSITARIO / INVESTIGACIÓN)
========================================================================
- Responde con profundidad analítica, vocabulario epistemológico y exactitud conceptual de estándar internacional.
- Demostraciones matemáticas o esquemas de ingeniería: desarrolla el procedimiento analítico paso a paso sin saltear premisas.
- En ciencias jurídicas y sociales: cita normativas vigentes, marcos doctrinales o posturas teóricas comparadas.
- Aplica razonamiento lógico y conclusiones con rigor metodológico.
========================================================================
`;
  }

  return "";
}
