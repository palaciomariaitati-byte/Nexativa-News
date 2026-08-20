/**
 * ========================================================================
 * 🎙️ NORA WAKE WORD PROCESSOR (AUDIOWORKLET THREAD - LOW POWER 24/7)
 * Ubicación: /public/worklets/nora-wake-word-processor.js
 * ========================================================================
 */

class NoraWakeWordProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 1024;
    this.hopSize = 512;
    this.audioBuffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.energyThreshold = 0.015;
    this.state = 'SILENCE';
    this.stateTimeout = 0;
    this.lastSample = 0;
    this.lastOutput = 0;
    this.isEnabled = true;

    this.port.onmessage = (event) => {
      if (event.data?.type === 'SET_ENABLED') {
        this.isEnabled = Boolean(event.data.enabled);
        if (!this.isEnabled) this.resetDetection();
      }
    };
  }

  // Filtro pasa-banda vocal básico
  filterVocalRange(sample) {
    const alpha = 0.4;
    const output = alpha * this.lastOutput + (1 - alpha) * (sample - this.lastSample);
    this.lastSample = sample;
    this.lastOutput = output;
    return output;
  }

  process(inputs, outputs, parameters) {
    if (!this.isEnabled) return true;

    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this.audioBuffer[this.bufferIndex] = this.filterVocalRange(channelData[i]);
      this.bufferIndex++;

      if (this.bufferIndex >= this.bufferSize) {
        this.analyzeFrame();
        this.audioBuffer.copyWithin(0, this.hopSize, this.bufferSize);
        this.bufferIndex = this.bufferSize - this.hopSize;
      }
    }
    return true;
  }

  analyzeFrame() {
    let sum = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      sum += this.audioBuffer[i] * this.audioBuffer[i];
    }
    const rms = Math.sqrt(sum / this.bufferSize);
    this.stateTimeout++;

    // Timeout de seguridad: si pasa más de ~600ms en un estado intermedio, reiniciar
    if (this.stateTimeout > 40) {
      this.resetDetection();
    }

    switch (this.state) {
      case 'SILENCE':
        if (rms > this.energyThreshold) {
          this.state = 'SYLLABLE_1'; // Detectó primer golpe (NO)
          this.stateTimeout = 0;
        }
        break;

      case 'SYLLABLE_1':
        if (rms < this.energyThreshold * 0.65) {
          this.state = 'GAP'; // Detectó caída de energía entre sílabas
          this.stateTimeout = 0;
        }
        break;

      case 'GAP':
        if (rms > this.energyThreshold * 1.1) {
          this.state = 'SYLLABLE_2'; // Detectó segundo golpe (RA)
          this.stateTimeout = 0;
        } else if (this.stateTimeout > 16) {
          this.resetDetection();
        }
        break;

      case 'SYLLABLE_2':
        // Si la segunda sílaba dura entre 4 y 20 frames (~40ms a 220ms), confirmar activación
        if (this.stateTimeout >= 4 && this.stateTimeout <= 20) {
          this.triggerWakeWord();
          this.resetDetection();
        }
        break;
    }
  }

  triggerWakeWord() {
    this.port.postMessage({ event: 'WAKE_WORD_DETECTED', timestamp: Date.now() });
  }

  resetDetection() {
    this.state = 'SILENCE';
    this.stateTimeout = 0;
  }
}

registerProcessor('nora-wake-word-processor', NoraWakeWordProcessor);
