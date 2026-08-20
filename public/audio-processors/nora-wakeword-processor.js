/**
 * ========================================================================
 * 🎙️ NORA WAKE WORD PROCESSOR (AUDIOWORKLET THREAD - LOW POWER 24/7)
 * Ubicación: /public/audio-processors/nora-wakeword-processor.js
 * ========================================================================
 */

class NoraWakeWordProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.audioBuffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.isListening = true;
    this.energyThreshold = 0.018;
    this.silenceCount = 0;
    this.voiceActive = false;

    this.port.onmessage = (event) => {
      const data = event.data;
      if (data.type === "SET_ENABLED") {
        this.isListening = Boolean(data.enabled);
      } else if (data.type === "SET_SENSITIVITY") {
        if (typeof data.threshold === "number") {
          this.energyThreshold = data.threshold;
        }
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (!this.isListening) return true;

    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0];
    if (!channelData) return true;

    // Calcular RMS (Energía cuadrática media de la señal vocal)
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i];
      sum += sample * sample;

      if (this.bufferIndex < this.bufferSize) {
        this.audioBuffer[this.bufferIndex++] = sample;
      }
    }

    const rms = Math.sqrt(sum / channelData.length);

    if (rms > this.energyThreshold) {
      this.silenceCount = 0;
      if (!this.voiceActive) {
        this.voiceActive = true;
        this.port.postMessage({
          type: "VOICE_ACTIVITY_START",
          energy: rms,
          timestamp: currentTime
        });
      }
    } else {
      this.silenceCount++;
      if (this.voiceActive && this.silenceCount > 35) { // ~350ms de silencio
        this.voiceActive = false;
        this.port.postMessage({
          type: "VOICE_ACTIVITY_END",
          timestamp: currentTime
        });
      }
    }

    // Si el búfer está lleno, despachar para análisis fonético si hay actividad
    if (this.bufferIndex >= this.bufferSize) {
      if (this.voiceActive) {
        // Enviar snapshot de audio al hilo principal para confirmación de palabra clave
        const audioSlice = this.audioBuffer.slice(0);
        this.port.postMessage({
          type: "AUDIO_FRAME",
          buffer: audioSlice,
          energy: rms
        });
      }
      this.bufferIndex = 0;
    }

    return true;
  }
}

registerProcessor("nora-wakeword-processor", NoraWakeWordProcessor);
