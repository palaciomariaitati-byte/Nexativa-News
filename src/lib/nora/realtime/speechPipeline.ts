/**
 * ========================================================================
 * 🎙️ NORAITU REALTIME SPEECH PIPELINE (COSTO $0 - ZERO LATENCY)
 * Ubicación: /src/lib/nora/realtime/speechPipeline.ts
 * 
 * Pipeline cliente con:
 *  - Web Speech API continua con reconexión automática
 *  - Barge-in / Interrupción instantánea a 0ms (AudioContext + speechSynthesis.cancel)
 *  - Chunking oracional en español con Intl.Segmenter
 *  - Cola recursiva de reproducción de voz neuronal fluida
 *  - Analizador de energía / volumen de micrófono para visualizador de ondas
 * ========================================================================
 */

export interface RealtimeVoiceConfig {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAssistantSpeechStart: () => void;
  onAssistantSpeechEnd: () => void;
  onUserInterruption: () => void;
  onVolumeChange?: (volume: number) => void;
  voiceUri?: string;
  lang?: string;
}

export class NoraRealtimeOrchestrator {
  private recognition: any = null;
  public isSpeaking = false;
  public isListening = false;
  private ttsQueue: string[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private abortController: AbortController | null = null;
  private config: RealtimeVoiceConfig;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private volumeInterval: any = null;

  constructor(config: RealtimeVoiceConfig) {
    this.config = config;
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.lang || "es-AR";

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // 🛑 BARGE-IN INMEDIATO: Si el usuario emite sonido o palabras mientras Nora habla, cortar de inmediato a 0ms
      if ((interim.trim().length > 1 || final.trim().length > 0) && this.isSpeaking) {
        this.interruptAssistant();
      }

      if (final.trim()) {
        this.config.onTranscript(final.trim(), true);
      } else if (interim.trim()) {
        this.config.onTranscript(interim.trim(), false);
      }
    };

    this.recognition.onerror = (err: any) => {
      if (err.error !== "no-speech" && err.error !== "aborted") {
        console.warn("[Realtime Speech Warning]:", err.error);
      }
    };

    this.recognition.onend = () => {
      // Auto-reinicio para mantener el canal siempre vivo durante la llamada
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch {}
      }
    };
  }

  /**
   * Inicia la captura de audio y análisis de volumen
   */
  public async start() {
    this.isListening = true;
    try {
      this.recognition?.start();
    } catch {}

    // Iniciar analizador de volumen para ondas reactivas en la UI
    try {
      if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.volumeInterval = setInterval(() => {
          if (this.analyser && this.config.onVolumeChange) {
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            this.config.onVolumeChange(normalized);
          }
        }, 80);
      }
    } catch (e) {
      console.warn("[Realtime Mic Volume Warning]:", e);
    }
  }

  /**
   * Detiene la captura y limpia recursos
   */
  public stop() {
    this.isListening = false;
    this.interruptAssistant();
    try {
      this.recognition?.stop();
    } catch {}

    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  /**
   * 🛑 INTERRUPCIÓN INSTANTÁNEA (BARGE-IN) A 0 MS
   */
  public interruptAssistant() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.ttsQueue = [];
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.config.onUserInterruption();
  }

  /**
   * 🗣️ CHUNKING EMOCIONAL Y ENCOLADO DE ORACIONES
   */
  public enqueueTextChunk(textChunk: string) {
    const cleanText = textChunk
      .replace(/[*#_~`>]/g, "") // Limpiar caracteres Markdown
      .replace(/\|+/g, " ")
      .trim();

    if (!cleanText) return;
    this.ttsQueue.push(cleanText);
    if (!this.isSpeaking) {
      this.playNextChunk();
    }
  }

  private playNextChunk() {
    if (this.ttsQueue.length === 0) {
      this.isSpeaking = false;
      this.config.onAssistantSpeechEnd();
      return;
    }

    this.isSpeaking = true;
    this.config.onAssistantSpeechStart();
    const nextText = this.ttsQueue.shift()!;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.playNextChunk();
      return;
    }

    this.currentUtterance = new SpeechSynthesisUtterance(nextText);
    this.currentUtterance.lang = this.config.lang || "es-AR";

    // Asignación inteligente de voz neuronal local
    if (this.config.voiceUri) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find((v) => v.voiceURI === this.config.voiceUri);
      if (selectedVoice) this.currentUtterance.voice = selectedVoice;
    }

    // Configuración fina de prosodia en hardware del cliente
    this.currentUtterance.rate = 1.05; // Aceleración sutil para dinamismo conversacional
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      this.playNextChunk(); // Ejecución recursiva del siguiente chunk encolado
    };

    this.currentUtterance.onerror = (e) => {
      console.warn("[TTS Chunk Error]:", e);
      this.currentUtterance = null;
      this.playNextChunk();
    };

    window.speechSynthesis.speak(this.currentUtterance);
  }

  public setAbortController(controller: AbortController) {
    this.abortController = controller;
  }

  public updateVoice(voiceUri: string) {
    this.config.voiceUri = voiceUri;
  }
}

/**
 * ⚡ STREAMING & CHUNKING CON Intl.Segmenter
 */
export async function manejarStreamingNora(
  userInput: string,
  orchestrator: NoraRealtimeOrchestrator,
  history: { role: string; content: string }[] = [],
  mode: string = "general"
): Promise<string> {
  const controller = new AbortController();
  orchestrator.setAbortController(controller);

  let fullAssistantText = "";

  try {
    const response = await fetch("/api/noraitu-realtime-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userInput,
        history,
        mode
      }),
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      orchestrator.enqueueTextChunk("Disculpame, tuve un micro corte en el enlace. ¿Podrías repetirme eso?");
      return "";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let textoAcumulado = "";
    // Segmentador nativo en español para detectar cortes de cláusulas naturales
    const segmenter = new (Intl as any).Segmenter("es", { granularity: "sentence" });

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunkTexto = decoder.decode(value, { stream: true });
      textoAcumulado += chunkTexto;
      fullAssistantText += chunkTexto;

      // Evaluamos las oraciones formadas hasta el momento
      const segments = Array.from(segmenter.segment(textoAcumulado)) as any[];

      // Si hay más de una oración, encolamos todas las terminadas y dejamos la última incompleta en el buffer
      if (segments.length > 1) {
        for (let i = 0; i < segments.length - 1; i++) {
          const fraseLista = segments[i].segment || segments[i].text;
          orchestrator.enqueueTextChunk(fraseLista);
          textoAcumulado = textoAcumulado.slice(fraseLista.length);
        }
      }
    }

    // Encolar el remanente al terminar el stream
    if (textoAcumulado.trim()) {
      orchestrator.enqueueTextChunk(textoAcumulado);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("[Realtime] Stream abortado por interrupción del usuario.");
    } else {
      console.error("[Realtime Router Error]:", error);
      orchestrator.enqueueTextChunk("A ver, continuemos con lo que me decías.");
    }
  }

  return fullAssistantText;
}
