/**
 * Router Dinámico de Contexto Educativo, Cátedra Superior y Accesibilidad Cognitiva (TEA/Asperger)
 * Permite adaptar dinámicamente el estilo y metodología de NoraItu a Costo $0 y Latencia <2ms.
 */

export function resolveAdaptiveEducationalContext(arg1: any, arg2?: any): string {
  const userMessage = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : "");
  const contextData = typeof arg1 === "object" ? arg1 : (typeof arg2 === "object" ? arg2 : {});

  const lower = (userMessage || "").toLowerCase();
  const explicitMode = contextData?.mode?.toLowerCase() || "";

  // 1. MODO INCLUSIÓN Y ACCESIBILIDAD COGNITIVA (TEA / Asperger / Neurodivergencias / Explicación Literal)
  const isInclusion = explicitMode === "inclusion" || 
    ["autismo", "asperger", "tea", "neurodivergente", "literal", "sin metaforas", "sin metáforas", "paso a paso literal", "pasos secuenciales", "sin ambigüedades", "sin ambiguedades", "sobrecarga sensorial", "lenguaje literal", "anticipacion", "apoyo visual", "concreto"].some(w => lower.includes(w));

  if (isInclusion) {
    return `
========================================================================
🧩 MODO INCLUSIÓN Y ACCESIBILIDAD COGNITIVA ACTIVO (DISEÑO DUA / TEA / ASPERGER)
========================================================================
- Utiliza comunicación 100% literal, clara, directa y estructurada.
- PROHIBIDO TERMINANTEMENTE usar metáforas complejas, modismos ambiguos, ironías, sarcasmos o dobles sentidos.
- Desglosa las explicaciones en secuencias lógicas numeradas (Paso 1, Paso 2, Paso 3).
- Mantén oraciones breves, lenguaje predecible y división de ideas claras para evitar sobrecarga cognitiva.
- Anticipa el objetivo de la respuesta en la primera línea.
========================================================================
`;
  }

  // 2. MODO PEDAGÓGICO Y DISEÑO CURRICULAR (Docentes de Primaria, Secundaria y Terciario)
  const isPedagogy = explicitMode === "docente" || 
    ["planificacion", "secuencia didactica", "unidad didactica", "curriculo", "diseno curricular", "rubrica de evaluacion", "plan de clase", "objetivos de aprendizaje", "criterios de evaluacion", "situacion de aprendizaje", "dua"].some(w => lower.includes(w));

  if (isPedagogy) {
    return `
========================================================================
🎓 MODO PEDAGÓGICO Y DISEÑO CURRICULAR OFICIAL ACTIVO
========================================================================
- Estructura las respuestas con rigor metodológico docente oficial:
  1. 🎯 **Fundamentación y Objetivos de Aprendizaje** (claros, medibles y acordes al nivel).
  2. 📚 **Contenidos Conceptuales, Procedimentales y Actitudinales**.
  3. 📋 **Secuencia Didáctica**:
     * **Inicio**: Recuperación de saberes previos y disparador motivacional.
     * **Desarrollo**: Actividades centrales y andamiaje pedagógico.
     * **Cierre**: Puesta en común, metacognición y síntesis.
  4. 📊 **Grilla de Planificación en Tabla Markdown**:
     Genera SIEMPRE una tabla estructurada (Columnas: | Fase/Momento | Actividad y Consigna | Recursos y Tiempo | Criterio de Evaluación |) lista para copiar y pegar en Word o Google Docs.
  5. 📝 **Rúbrica de Evaluación con Escala de Logro** (Inicial, En Proceso, Logrado, Destacado).
========================================================================
`;
  }

  // 3. MODO CÁTEDRA Y RIGOR ACADÉMICO SUPERIOR (Universidad / Jurídico / Científico / Ingeniería)
  const isUniversity = explicitMode === "catedra" || 
    ["jurisprudencia", "doctrina", "codigo civil", "codigo penal", "calculo integral", "derivadas", "termodinamica", "ecuaciones diferenciales", "tesis", "marco teorico", "paper", "epistemologia", "metodologia de la investigacion", "fallo", "derecho constitucional"].some(w => lower.includes(w));

  if (isUniversity) {
    return `
========================================================================
🏛️ MODO CÁTEDRA Y RIGOR ACADÉMICO SUPERIOR ACTIVO (NIVEL UNIVERSITARIO)
========================================================================
- Responde con profundidad analítica, vocabulario técnico de nivel universitario y exactitud conceptual.
- Desglosa demostraciones matemáticas, fórmulas o esquemas de cálculo paso a paso.
- En ciencias jurídicas y sociales: cita normativas vigentes, marcos doctrinales o posturas teóricas comparadas.
- Aplica razonamiento lógico y conclusiones con rigor metodológico.
========================================================================
`;
  }

  return "";
}
