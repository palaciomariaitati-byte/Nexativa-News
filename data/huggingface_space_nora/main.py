import os
import time
import requests
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="NORA & VALEN AI Cloud Worker", version="2.0")

DEFAULT_NORA_SYSTEM_PROMPT = """
========================================================================
🤖 PERFIL DE PERSONALIDAD DE NORA AI: ATENCIÓN Y HOSPITALIDAD DE EXCELENCIA
========================================================================

[FILOSOFÍA DE ATENCIÓN Y TONO DE VOZ]
Eres NORA, la Asistente Principal y Asesora de Nexativa News.
Tu estilo de comunicación es CÁLIDO, NEUTRO, ELEGANTE Y SUMAMENTE SERVICIAL, exactamente como la atención impecable de un recepcionista de hotel de primera categoría.

REGLAS OBLIGATORIAS DE PERSONALIDAD:
1. HOSPITALIDAD Y CERCANÍA: Saluda con calidez, respeto y elegancia. Haz que el usuario se sienta bienvenido e importante desde el primer instante.
2. LENGUAJE CÁLIDO PERO NEUTRO: Utiliza un español claro, comprensible y profesional. Emplea fórmulas de cortesía elegantes ("Con mucho gusto", "Bienvenido", "Es un placer ayudarte", "Por supuesto", "Estoy a tu entera disposición"). Evita modismos callejeros o jergas informales.
3. CONFIANZA Y CLARIDAD: Responde de forma transparente, concisa y segura (máximo 2 a 3 oraciones). Inspira credibilidad inmediata tanto en lectores locales como en comerciantes e inversores.
4. ORIENTACIÓN AL SERVICIO: Escucha activamente las necesidades del cliente, asesora sobre productos o noticias y guía con gentileza hacia el contacto directo por WhatsApp si es necesario.
5. CALMA Y EDUCACIÓN: Ante cualquier reclamo o duda, mantén una actitud imperturbable de cortesía y profesionalismo.
"""

class PromptRequest(BaseModel):
    prompt: str
    system_prompt: str = DEFAULT_NORA_SYSTEM_PROMPT
    use_reasoning: bool = False
    reasoning_model: str = "deepseek-r1:1.5b"

@app.get("/")
def health_check():
    return {"status": "ONLINE", "worker": "noranexora-nora-ia-worker.hf.space", "engine": "Ollama Swarm (llama3.2:1b + deepseek-r1:1.5b) + Gemini Fallback"}

@app.post("/generate")
def generate_response(req: PromptRequest):
    start_time = time.time()
    
    # 1. Inferencia Ultra-Rápida con Enjambre Ollama local en HF Space
    try:
        default_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.2:1b")
        reasoning_model = os.getenv("OLLAMA_REASONING_MODEL", req.reasoning_model or "deepseek-r1:1.5b")
        ollama_model = reasoning_model if req.use_reasoning else default_model

        ollama_res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": ollama_model,
                "prompt": f"{req.system_prompt}\n\nUsuario: {req.prompt}",
                "stream": False,
                "options": {
                    "num_predict": 300,
                    "temperature": 0.2 if req.use_reasoning else 0.3
                },
                "keep_alive": -1
            },
            timeout=5.0 if req.use_reasoning else 4.0
        )
        
        if ollama_res.status_code == 200:
            data = ollama_res.json()
            return {
                "text": data.get("response", ""),
                "source": "HUGGINGFACE_OLLAMA_LOCAL",
                "model": ollama_model,
                "latency_sec": round(time.time() - start_time, 3)
            }
    except Exception as e:
        print(f"⚠️ Circuit Breaker Activado en HF Space: {e}")

    # 2. Fallback a Google Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel(gemini_model_name)
            res = model.generate_content(f"{req.system_prompt}\n\n{req.prompt}")
            return {
                "text": res.text,
                "source": "GEMINI_FALLBACK",
                "model": gemini_model_name,
                "latency_sec": round(time.time() - start_time, 3)
            }
        except Exception as gemini_err:
            print(f"Error en Gemini Fallback: {gemini_err}")

    raise HTTPException(status_code=500, detail="Error en todos los motores de IA del Worker.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
