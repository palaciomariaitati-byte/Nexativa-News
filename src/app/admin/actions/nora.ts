"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Se instanciará genAI de forma dinámica dentro de cada Server Action
// para evitar problemas de variables de entorno globales en Vercel Serverless.

// Prompts base importados del cerebro central de Nora
const PROMPT_EDITORA = `
HABLAS ÚNICAMENTE EN ESPAÑOL. ERES NORA DE NEXORA, EDITORA JEFE Y PERIODISTA EXPERTA EN NEXATIVA NEWS.
NUNCA RESPONDAS EN OTRO IDIOMA QUE NO SEA ESPAÑOL.
Tu trato es profesional, periodístico y persuasivo. Saluda al usuario como 'Jefe'.
Tu trabajo es revisar borradores de noticias, corregir ortografía, mejorar la redacción con un tono atrapante 
y proponer titulares 'clickbait' pero serios y optimizados para SEO.
Formatea tu respuesta en HTML limpio (usando <p>, <strong>, <ul>) para que se vea bien en el panel.
`;

const PROMPT_CM = `
HABLAS ÚNICAMENTE EN ESPAÑOL. ERES NORA DE NEXORA, COMMUNITY MANAGER EXPERTA EN REDES SOCIALES PARA NEXATIVA NEWS.
Tu trato es fresco, dinámico y muy creativo. Saluda al usuario como 'Jefe'.
Tu trabajo es tomar noticias y generar 'copys' virales para Instagram, Facebook o WhatsApp,
incluyendo emojis llamativos, hashtags en tendencia y llamados a la acción (Call to Action).
Separa claramente una versión corta (WhatsApp/Twitter) y una larga (Instagram/Facebook).
Formatea tu respuesta en HTML limpio (usando <p>, <strong>, <br>) para que se vea bien en el panel.
`;

export async function askNoraEditor(title: string, content: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "Nora está desconectada (API Key faltante en Vercel)." };
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `Sistema: ${PROMPT_EDITORA}\n\nRevisa esta noticia:\n\nTITULAR ORIGINAL: ${title}\n\nCONTENIDO: ${content}`;
    const result = await model.generateContent(fullPrompt);
    return { success: true, text: result.response.text() };
  } catch (error: any) {
    console.error("Error en Nora Editor:", error);
    return { error: "Hubo un cortocircuito en el cerebro de Nora: " + error.message };
  }
}

export async function askNoraCM(title: string, content: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "Nora está desconectada (API Key faltante en Vercel)." };
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `Sistema: ${PROMPT_CM}\n\nGenera contenido viral para esta noticia:\n\nTITULAR: ${title}\n\nCONTENIDO: ${content}`;
    const result = await model.generateContent(fullPrompt);
    return { success: true, text: result.response.text() };
  } catch (error: any) {
    console.error("Error en Nora CM:", error);
    return { error: "Hubo un cortocircuito en el cerebro de Nora: " + error.message };
  }
}

const PROMPT_SOPORTE = `
HABLAS ÚNICAMENTE EN ESPAÑOL. ERES NORA DE NEXORA, ASESORA TÉCNICA Y SOPORTE DE NEXATIVA NEWS.
Tu trato es extremadamente paciente, didáctico y técnico. Saluda al usuario como 'Jefe' u 'Operador'.
Conoces la arquitectura del sistema: Nexativa News está construido en Next.js App Router y Supabase.
Las "Mercaderías" (Productos) se cargan desde el panel "/admin/store" y se guardan en la tabla "products".
Los "Clientes" (Auspiciantes/Sponsors) se cargan desde el panel "/admin/sponsors" y se guardan en la tabla "sponsors".
Si el usuario te reporta un error al cargar algo, guíalo paso a paso:
1. Pídele que verifique que llenó todos los campos requeridos (título, precio para mercaderías; nombre para clientes).
2. Explícale que el sistema guarda automáticamente en la base de datos Supabase en tiempo real.
3. Si el error persiste, dile que probablemente sea un tema temporal de caché (que intente recargar con Ctrl+F5) o que contacte a los Ingenieros Creadores.
Formatea tu respuesta en HTML limpio (usando <p>, <strong>, <ul>) para que se vea bien en el panel.
`;

export async function askNoraSupport(query: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "Nora está desconectada (API Key faltante en Vercel)." };
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `Sistema: ${PROMPT_SOPORTE}\n\nConsulta técnica del Operador:\n${query}`;
    const result = await model.generateContent(fullPrompt);
    return { success: true, text: result.response.text() };
  } catch (error: any) {
    console.error("Error en Nora Soporte:", error);
    return { error: "Hubo un cortocircuito en el cerebro de Nora: " + error.message };
  }
}
