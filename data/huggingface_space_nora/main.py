import os
import time
import requests
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="NORA & VALEN AI Cloud Worker", version="2.0")

class PromptRequest(BaseModel):
    prompt: str
    system_prompt: str = "Eres NORA, la IA ejecutiva y periodista de Nexativa News."

@app.get("/")
def health_check():
    return {"status": "ONLINE", "worker": "noranexora-nora-ia-worker.hf.space", "engine": "Ollama llama3.2:1b + Gemini Fallback"}

@app.post("/generate")
def generate_response(req: PromptRequest):
    start_time = time.time()
    
    # 1. Inferencia Ultra-Rápida con Ollama local en HF Space
    try:
        ollama_res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:1b",
                "prompt": f"{req.system_prompt}\n\nUsuario: {req.prompt}",
                "stream": False,
                "options": {
                    "num_predict": 250,
                    "temperature": 0.3
                },
                "keep_alive": -1
            },
            timeout=4.0
        )
        
        if ollama_res.status_code == 200:
            data = ollama_res.json()
            return {
                "text": data.get("response", ""),
                "source": "HUGGINGFACE_OLLAMA_LOCAL",
                "latency_sec": round(time.time() - start_time, 3)
            }
    except Exception as e:
        print(f"⚠️ Circuit Breaker Activado en HF Space: {e}")

    # 2. Fallback a Google Gemini 1.5 Flash
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content(f"{req.system_prompt}\n\n{req.prompt}")
            return {
                "text": res.text,
                "source": "GEMINI_1.5_FLASH_FALLBACK",
                "latency_sec": round(time.time() - start_time, 3)
            }
        except Exception as gemini_err:
            print(f"Error en Gemini Fallback: {gemini_err}")

    raise HTTPException(status_code=500, detail="Error en todos los motores de IA del Worker.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
