"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Sparkles, Volume2, VolumeX, Mic, Hand, Radio } from "lucide-react";

interface NoraRealtimeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceUri?: string;
  activeMode?: string;
  onMessageLogged?: (userText: string, assistantText: string) => void;
}

export default function NoraRealtimeCallModal({
  isOpen,
  onClose,
  selectedVoiceUri,
  activeMode = "general",
  onMessageLogged
}: NoraRealtimeCallModalProps) {
  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking">("connecting");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [assistantText, setAssistantText] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentVoice, setCurrentVoice] = useState<string>(selectedVoiceUri || "");
  
  // Modos de interacción y accesibilidad
  const [interactionMode, setInteractionMode] = useState<"hands_free" | "push_to_talk">("hands_free");
  const [isPushTalking, setIsPushTalking] = useState<boolean>(false);
  const [accessibleAnnouncement, setAccessibleAnnouncement] = useState<string>("Iniciando llamada con Nora...");

  // Refs de estado y control de turnos
  const isNoraSpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const activeModeRef = useRef<string>(activeMode);
  const currentSentenceQueueRef = useRef<string[]>([]);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refs de captura de audio y STT
  const recognitionRef = useRef<any>(null);
  const speechAccumulatorRef = useRef<string>("");
  const speechSilenceTimerRef = useRef<any>(null);
  const isSpeechRecognitionSupportedRef = useRef<boolean>(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // 🔔 Tono auditivo suave para personas no videntes
  const playAccessibleChime = useCallback((type: "start" | "end" | "connected") => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;

      if (type === "start") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "end") {
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(390, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "connected") {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch {}
  }, []);

  // 1. Cargar voces en español / rioplatense
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        const spanish = vList.filter((v) => v.lang.startsWith("es") || v.lang.includes("es-"));
        const finalVoices = spanish.length > 0 ? spanish : vList;

        const storedVoice = localStorage.getItem("noraitu_selected_voice") || selectedVoiceUri;
        if (storedVoice) {
          const match = finalVoices.find((v) => v.voiceURI === storedVoice);
          if (match) {
            setCurrentVoice(match.voiceURI);
            return;
          }
        }

        const preferred =
          finalVoices.find(
            (v) =>
              (v.lang.includes("AR") || v.lang.includes("419") || v.lang.includes("MX") || v.name.toLowerCase().includes("argentina")) &&
              !v.lang.includes("ES")
          ) ||
          finalVoices.find(
            (v) =>
              v.name.toLowerCase().includes("sabina") ||
              v.name.toLowerCase().includes("dalia") ||
              v.name.toLowerCase().includes("google español") ||
              v.name.toLowerCase().includes("natural")
          ) ||
          finalVoices.find((v) => !v.lang.includes("ES")) ||
          finalVoices[0];

        if (preferred) {
          setCurrentVoice(preferred.voiceURI);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceUri]);

  // 2. Temporizador de llamada
  useEffect(() => {
    let timer: any = null;
    if (isOpen) {
      setCallDuration(0);
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen]);

  // 3. Detener habla de Nora de forma absoluta
  const stopNoraSpeech = useCallback(() => {
    isNoraSpeakingRef.current = false;
    currentSentenceQueueRef.current = [];
    activeUtteranceRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 4. Reanudar escucha limpia tras terminar Nora
  const resumeListening = useCallback(() => {
    if (isNoraSpeakingRef.current || isProcessingRef.current) return;
    setCallState("listening");
    setAccessibleAnnouncement("Nora te escucha.");
    speechAccumulatorRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }
  }, []);

  // 5. Reproducción secuencial por oraciones (Elimina cortes de Chromium / Web Speech)
  const playNextSentence = useCallback(() => {
    if (currentSentenceQueueRef.current.length === 0) {
      isNoraSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      setTimeout(() => {
        resumeListening();
        playAccessibleChime("start");
      }, 350);
      return;
    }

    const nextSentence = currentSentenceQueueRef.current.shift()!;
    if (!nextSentence.trim()) {
      playNextSentence();
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window) || isMuted) {
      isNoraSpeakingRef.current = false;
      resumeListening();
      return;
    }

    try {
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(nextSentence.trim());
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let voiceToUse = currentVoice ? voices.find((v) => v.voiceURI === currentVoice) : undefined;
      if (!voiceToUse) {
        voiceToUse =
          voices.find((v) => (v.lang.includes("AR") || v.lang.includes("419")) && !v.lang.includes("ES")) ||
          voices.find((v) => v.lang.startsWith("es"));
      }

      if (voiceToUse) {
        utterance.voice = voiceToUse;
        utterance.lang = voiceToUse.lang || "es-AR";
      } else {
        utterance.lang = "es-AR";
      }

      utterance.onstart = () => {
        isNoraSpeakingRef.current = true;
        setCallState("speaking");
      };

      utterance.onend = () => {
        activeUtteranceRef.current = null;
        playNextSentence();
      };

      utterance.onerror = () => {
        activeUtteranceRef.current = null;
        playNextSentence();
      };

      // Proteger la referencia en memoria para evitar el bug de Garbage Collection de Chrome
      activeUtteranceRef.current = utterance;
      (window as any).__noraActiveUtterance = utterance;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[TTS Sentence Error]:", e);
      playNextSentence();
    }
  }, [currentVoice, isMuted, playAccessibleChime, resumeListening]);

  // 6. Dividir respuesta completa en oraciones limpias y encolar
  const speakNoraResponse = useCallback(
    (fullText: string) => {
      if (isMuted || !fullText.trim()) {
        isNoraSpeakingRef.current = false;
        resumeListening();
        return;
      }

      // Detener escucha del micrófono mientras Nora habla
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      stopNoraSpeech();
      isNoraSpeakingRef.current = true;
      setCallState("speaking");
      setAccessibleAnnouncement("Nora está respondiendo.");

      const cleanText = fullText
        .replace(/[*#_~`>]/g, "")
        .replace(/\|+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Segmentación inteligente por oraciones completas
      const rawSentences = cleanText.match(/[^.!?;\n]+[.!?;\n]*/g) || [cleanText];
      const validSentences = rawSentences
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      currentSentenceQueueRef.current = validSentences;
      playNextSentence();
    },
    [isMuted, playNextSentence, resumeListening, stopNoraSpeech]
  );

  // 7. Enviar consulta completa y única al servidor (Cero duplicados)
  const dispatchUserTurn = useCallback(
    async (finalText: string) => {
      const cleanInput = finalText.trim();
      if (!cleanInput || cleanInput.length < 2 || isProcessingRef.current) {
        return;
      }

      // Pausar reconocimiento
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      stopNoraSpeech();
      isProcessingRef.current = true;
      setCallState("thinking");
      setAccessibleAnnouncement("Nora está pensando su respuesta...");
      playAccessibleChime("end");

      setUserTranscript(`"${cleanInput}"`);
      historyRef.current.push({ role: "user", content: cleanInput });

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch("/api/noraitu-realtime-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: cleanInput,
            history: historyRef.current.slice(-8),
            mode: activeModeRef.current
          }),
          signal: controller.signal
        });

        if (!res.ok || !res.body) {
          isProcessingRef.current = false;
          resumeListening();
          return;
        }

        const bodyReader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = "";

        while (true) {
          const { done, value } = await bodyReader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullAnswer += chunk;
          setAssistantText(fullAnswer);
        }

        const trimmedAnswer = fullAnswer.trim();
        if (trimmedAnswer) {
          historyRef.current.push({ role: "assistant", content: trimmedAnswer });
          if (historyRef.current.length > 14) {
            historyRef.current = historyRef.current.slice(-14);
          }
          if (onMessageLogged) {
            onMessageLogged(cleanInput, trimmedAnswer);
          }
          speakNoraResponse(trimmedAnswer);
        } else {
          resumeListening();
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[Realtime Voice Error]:", err);
        }
        resumeListening();
      } finally {
        isProcessingRef.current = false;
      }
    },
    [onMessageLogged, playAccessibleChime, resumeListening, speakNoraResponse, stopNoraSpeech]
  );

  // 8. Inicialización del Motor de Reconocimiento de Voz Unificado (Zero Concurrencia)
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      isSpeechRecognitionSupportedRef.current = true;
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "es-AR";

        recognition.onresult = (event: any) => {
          if (isNoraSpeakingRef.current || isProcessingRef.current) return;

          let interim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || "";
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interim += transcript;
            }
          }

          const currentWords = (finalTranscript || interim).trim();
          if (currentWords) {
            speechAccumulatorRef.current = (speechAccumulatorRef.current + " " + currentWords).trim();
            setUserTranscript(`"${speechAccumulatorRef.current}"`);

            // Si está en modo manos libres, esperar pausa natural de 1250ms antes de disparar el turno
            if (interactionMode === "hands_free") {
              if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
              speechSilenceTimerRef.current = setTimeout(() => {
                const completeSentence = speechAccumulatorRef.current.trim();
                speechAccumulatorRef.current = "";
                if (completeSentence && !isNoraSpeakingRef.current && !isProcessingRef.current) {
                  dispatchUserTurn(completeSentence);
                }
              }, 1250);
            }
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error !== "no-speech") {
            console.warn("[SpeechRecognition Note]:", e.error);
          }
        };

        recognition.onend = () => {
          // Auto-reinicio suave solo si no está hablando Nora ni pensando
          if (!isNoraSpeakingRef.current && !isProcessingRef.current && isOpen) {
            setTimeout(() => {
              try {
                if (!isNoraSpeakingRef.current && !isProcessingRef.current) {
                  recognition.start();
                }
              } catch {}
            }, 300);
          }
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {}
      } catch (recErr) {
        console.warn("[SpeechRecognition Init Warn]:", recErr);
      }
    }

    return () => {
      if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [dispatchUserTurn, interactionMode, isOpen]);

  // 9. Medidor Visual de Audio y Filtros DSP Web Audio
  useEffect(() => {
    if (!isOpen) {
      stopNoraSpeech();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    let isMounted = true;

    async function startVisualAudioMeter() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);

        // Filtro pasa-banda vocal para aislar ruidos ambientales
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 85;

        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 3400;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        setCallState("listening");
        playAccessibleChime("connected");
        setAccessibleAnnouncement("Conectado con Nora. Lista para escucharte.");

        const monitorMeter = () => {
          if (!isMounted) return;

          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const currentAvg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round(currentAvg * 2.2)));

          animFrameRef.current = requestAnimationFrame(monitorMeter);
        };

        monitorMeter();
      } catch (err) {
        console.warn("[Meter Init Note]:", err);
      }
    }

    startVisualAudioMeter();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isOpen, playAccessibleChime, stopNoraSpeech]);

  // 10. Control Push-to-Talk (Pulsar para hablar)
  const handlePushTalkStart = () => {
    setIsPushTalking(true);
    speechAccumulatorRef.current = "";
    if (callState === "speaking") {
      stopNoraSpeech();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch {}
    }
  };

  const handlePushTalkEnd = () => {
    setIsPushTalking(false);
    setTimeout(() => {
      const textToSend = speechAccumulatorRef.current.trim();
      speechAccumulatorRef.current = "";
      if (textToSend) {
        dispatchUserTurn(textToSend);
      }
    }, 200);
  };

  // ⌨️ Accesibilidad por Teclado (Espacio para hablar, Esc para cerrar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (interactionMode === "push_to_talk" && !isPushTalking) {
          handlePushTalkStart();
        } else if (callState === "speaking") {
          stopNoraSpeech();
        }
      } else if (e.code === "Escape") {
        onClose();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && interactionMode === "push_to_talk" && isPushTalking) {
        e.preventDefault();
        handlePushTalkEnd();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, callState, interactionMode, isPushTalking, onClose, stopNoraSpeech]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Llamada de voz con Nora"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in select-none"
    >
      <div role="status" aria-live="polite" className="sr-only">
        {accessibleAnnouncement}
      </div>

      <div className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-[#070b14] to-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-between min-h-[590px]">
        
        {/* Cabecera Tipo Llamada Telefónica Accesible */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-400/40 shadow-md shadow-cyan-500/20">
              <Sparkles size={18} className="text-cyan-300 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                Nora Voz Continua
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 uppercase">
                  {interactionMode === "hands_free" ? "Manos Libres" : "Pulsar para hablar"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {formatDuration(callDuration)} • {activeMode.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Finalizar y cerrar llamada"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar llamada (Tecla Esc)"
          >
            ✕
          </button>
        </div>

        {/* Selector de Modo de Interacción */}
        <div className="w-full flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => setInteractionMode("hands_free")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              interactionMode === "hands_free"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio size={12} />
            <span>Flujo Continuo</span>
          </button>
          <button
            onClick={() => setInteractionMode("push_to_talk")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              interactionMode === "push_to_talk"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Hand size={12} />
            <span>Pulsar para Hablar</span>
          </button>
        </div>

        {/* Aura Dinámica Fluida y Serena */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-4 text-center">
          
          <div className="relative flex items-center justify-center w-44 h-44">
            <div
              className="absolute rounded-full bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-emerald-500/20 transition-transform duration-200 ease-out"
              style={{
                width: `${130 + (callState === "speaking" ? 35 : audioLevel * 0.6)}px`,
                height: `${130 + (callState === "speaking" ? 35 : audioLevel * 0.6)}px`,
                opacity: callState === "thinking" ? 0.3 : 0.8
              }}
            />

            <div
              className="absolute rounded-full bg-gradient-to-tr from-cyan-600/30 via-indigo-600/30 to-purple-600/30 transition-transform duration-250 ease-out"
              style={{
                width: `${110 + (callState === "speaking" ? 25 : audioLevel * 0.4)}px`,
                height: `${110 + (callState === "speaking" ? 25 : audioLevel * 0.4)}px`
              }}
            />

            {/* Núcleo Central del Aura */}
            <div
              className={`relative flex items-center justify-center w-28 h-28 rounded-full shadow-2xl transition-all duration-500 ${
                callState === "speaking"
                  ? "bg-gradient-to-tr from-cyan-400 via-teal-300 to-emerald-400 shadow-cyan-400/40 scale-105"
                  : callState === "thinking"
                  ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 shadow-purple-500/40 scale-95"
                  : isPushTalking || audioLevel > 18
                  ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-400/40 scale-105"
                  : "bg-gradient-to-tr from-cyan-900/80 via-slate-800 to-teal-950 shadow-cyan-900/30 border border-cyan-500/30"
              }`}
            >
              <div className="absolute inset-1 rounded-full bg-slate-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-center">
                <span className="text-3xl">
                  {callState === "speaking"
                    ? "🗣️"
                    : callState === "thinking"
                    ? "⚡"
                    : isPushTalking || audioLevel > 18
                    ? "🎙️"
                    : "✨"}
                </span>
              </div>
            </div>
          </div>

          {/* Subtítulos Conversacionales Claros */}
          <div className="w-full mt-4 px-3 min-h-[85px] flex flex-col items-center justify-center">
            {callState === "thinking" ? (
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                ⚡ Nora está procesando tu idea...
              </p>
            ) : assistantText ? (
              <div className="max-w-sm bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
                <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                  "{assistantText}"
                </p>
              </div>
            ) : userTranscript ? (
              <p className="text-xs text-cyan-300 font-medium italic line-clamp-2 max-w-xs">
                {userTranscript}
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-medium">
                  {interactionMode === "hands_free"
                    ? "Te escucho atentamente y sin cortes"
                    : "Mantené presionado el botón o Espacio para hablar"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {interactionMode === "hands_free"
                    ? "Hablá con libertad. Nora escucha tu idea completa antes de responder."
                    : "Pulsá cuando quieras formular tu consulta."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modo Pulsar para Hablar */}
        {interactionMode === "push_to_talk" && (
          <div className="w-full flex justify-center py-2">
            <button
              onMouseDown={handlePushTalkStart}
              onMouseUp={handlePushTalkEnd}
              onTouchStart={handlePushTalkStart}
              onTouchEnd={handlePushTalkEnd}
              className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isPushTalking
                  ? "bg-emerald-500 text-slate-950 scale-98 shadow-emerald-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
            >
              <Mic size={18} className={isPushTalking ? "animate-pulse" : ""} />
              <span>{isPushTalking ? "Nora te está escuchando..." : "Mantener presionado para hablar"}</span>
            </button>
          </div>
        )}

        {/* Barra Inferior: Controles y Colgar */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800/60">
          <button
            onClick={() => {
              if (isMuted) {
                setIsMuted(false);
              } else {
                stopNoraSpeech();
                setIsMuted(true);
              }
            }}
            aria-label={isMuted ? "Reanudar voz de Nora" : "Silenciar voz de Nora"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            }`}
            title={isMuted ? "Reanudar voz" : "Silenciar voz"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <div
              className={`w-2 h-2 rounded-full ${
                callState === "speaking"
                  ? "bg-cyan-400 animate-pulse"
                  : callState === "thinking"
                  ? "bg-purple-400 animate-pulse"
                  : isPushTalking
                  ? "bg-emerald-400 animate-ping"
                  : "bg-slate-500"
              }`}
            />
            <span>
              {callState === "speaking"
                ? "Hablando"
                : callState === "thinking"
                ? "Pensando"
                : isPushTalking
                ? "Escuchando"
                : "Lista"}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Finalizar llamada"
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Finalizar llamada"
          >
            <PhoneOff size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
