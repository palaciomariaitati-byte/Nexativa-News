"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY no encontrada. Las funciones de Nora no estarán disponibles.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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
  if (!genAI) return { error: "Nora está desconectada (API Key faltante)." };
  
  try {
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
  if (!genAI) return { error: "Nora está desconectada (API Key faltante)." };
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `Sistema: ${PROMPT_CM}\n\nGenera contenido viral para esta noticia:\n\nTITULAR: ${title}\n\nCONTENIDO: ${content}`;
    const result = await model.generateContent(fullPrompt);
    return { success: true, text: result.response.text() };
  } catch (error: any) {
    console.error("Error en Nora CM:", error);
    return { error: "Hubo un cortocircuito en el cerebro de Nora: " + error.message };
  }
}
