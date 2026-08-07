FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_MODELS=/app/ollama/models
ENV OLLAMA_NUM_PARALLEL=2
ENV OLLAMA_KEEP_ALIVE=-1

RUN apt-get update && apt-get install -y \
    curl python3 python3-pip git \
    && rm -rf /var/lib/apt/lists/*

# Instalar Ollama Oficial
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app
COPY . /app

RUN pip3 install --no-cache-dir fastapi uvicorn requests google-generativeai pydantic

EXPOSE 7860

CMD sh -c "ollama serve & sleep 5 && ollama pull llama3.2:1b && python3 main.py"
