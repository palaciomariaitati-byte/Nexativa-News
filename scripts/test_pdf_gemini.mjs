import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = { ...loadEnv('.env.local'), ...loadEnv('.env.production'), ...process.env };

async function testPdfWithGemini() {
  const key = env.GEMINI_API_KEY_FALLBACK_2 || env.GEMINI_API_KEY_TERTIARY;
  const genAI = new GoogleGenerativeAI(key);

  const testPdfPath = "public/BROCHURE_COMERCIAL_NEXATIVA_NEWS_2026.pdf";
  if (!fs.existsSync(testPdfPath)) {
    console.log("PDF not found:", testPdfPath);
    return;
  }

  const pdfBuffer = fs.readFileSync(testPdfPath);
  const pdfB64 = pdfBuffer.toString("base64");
  console.log(`Loaded PDF (${pdfBuffer.length} bytes, base64 length: ${pdfB64.length})`);

  const models = ["gemini-flash-latest", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-2.5-pro"];

  for (const m of models) {
    try {
      console.log(`\nTesting PDF streaming with ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const stream = await model.generateContentStream({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: pdfB64,
                  mimeType: "application/pdf"
                }
              },
              {
                text: "Resume este documento PDF en 2 oraciones."
              }
            ]
          }
        ]
      });

      let fullText = "";
      for await (const chunk of stream.stream) {
        fullText += chunk.text();
      }
      console.log(`✓ ${m} PDF streaming SUCCESS:\n`, fullText);
      break;
    } catch (e) {
      console.log(`✗ ${m} PDF streaming FAILED:`, e.message);
    }
  }
}

testPdfWithGemini();
