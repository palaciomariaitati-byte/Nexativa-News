import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testKeys() {
  console.log("=== DIAGNOSTIC TESTING OF API KEYS ===");
  console.log("GROQ_API_KEY present:", !!process.env.GROQ_API_KEY, process.env.GROQ_API_KEY ? `(${process.env.GROQ_API_KEY.slice(0, 8)}...)` : "NONE");
  console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY ? `(${process.env.GEMINI_API_KEY.slice(0, 8)}...)` : "NONE");
  console.log("GEMINI_API_KEY_FALLBACK present:", !!process.env.GEMINI_API_KEY_FALLBACK);
  console.log("GEMINI_API_KEY_FALLBACK_2 present:", !!process.env.GEMINI_API_KEY_FALLBACK_2);
  console.log("GEMINI_API_KEY_TERTIARY present:", !!process.env.GEMINI_API_KEY_TERTIARY);

  // Test Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Hola responde en 5 palabras" }]
        })
      });
      const data = await res.json();
      console.log("Groq test response:", res.status, data.choices?.[0]?.message?.content || data.error);
    } catch (e: any) {
      console.error("Groq test error:", e.message);
    }
  }

  // Test Gemini Keys
  const geminiKeys = [
    { name: "PRIMARY", key: process.env.GEMINI_API_KEY },
    { name: "FALLBACK", key: process.env.GEMINI_API_KEY_FALLBACK },
    { name: "FALLBACK_2", key: process.env.GEMINI_API_KEY_FALLBACK_2 },
    { name: "TERTIARY", key: process.env.GEMINI_API_KEY_TERTIARY },
  ];

  for (const item of geminiKeys) {
    if (!item.key) {
      console.log(`Gemini ${item.name}: MISSING`);
      continue;
    }
    try {
      const genAI = new GoogleGenerativeAI(item.key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hola responde en 5 palabras");
      console.log(`Gemini ${item.name} (gemini-1.5-flash): SUCCESS -> ${result.response.text().trim()}`);
    } catch (err: any) {
      console.error(`Gemini ${item.name} ERROR:`, err.message);
    }

    try {
      const genAI = new GoogleGenerativeAI(item.key);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent("Hola responde en 5 palabras");
      console.log(`Gemini ${item.name} (gemini-2.0-flash): SUCCESS -> ${result.response.text().trim()}`);
    } catch (err: any) {
      console.error(`Gemini ${item.name} (2.0-flash) ERROR:`, err.message);
    }
  }
}

testKeys();
