"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Sparkles, Volume2, VolumeX, Mic, MicOff, Hand, Radio } from "lucide-react";

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
  
  // Accesibilidad y Modos de Interacción
  const [interactionMode, setInteractionMode] = useState<"hands_free" | "push_to_talk">("hands_free");
  const [isPushTalking, setIsPushTalking] = useState<boolean>(false);
  const [accessibleAnnouncement, setAccessibleAnnouncement] = useState<string>("Iniciando conexión con Nora...");

  // Refs de audio y procesamiento
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Estados de control de turno VAD y Blindaje Acústico
  const isSpeakingRef = useRef<boolean>(false); // Usuario hablando
  const silenceStartRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isNoraSpeakingRef = useRef<boolean>(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeModeRef = useRef<string>(activeMode);
  const noiseFloorRef = useRef<number>(14); // Piso de ruido ambiental dinámico

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // 🔔 Tono auditivo suave para personas no videntes (Web Audio API)
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
        // Tono ascendente suave
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "end") {
        // Tono descendente sutil
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(390, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "connected") {
        // Doble campana cálida
        osc.frequency.setValueAtTime(523.25, now); // Do
        osc.frequency.setValueAtTime(659.25, now + 0.1); // Mi
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {}
  }, []);

  // 1. Cargar voces latinas y rioplatenses de alta naturalidad
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
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("google español")
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

  // Detener habla de Nora de forma segura
  const stopNoraSpeech = useCallback(() => {
    isNoraSpeakingRef.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 🗣️ Sintetizador de voz continuo de Nora con dicción cálida y anti-cortes
  const speakNoraResponse = useCallback(
    (text: string) => {
      if (isMuted || !text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) {
        isNoraSpeakingRef.current = false;
        setCallState("listening");
        setAccessibleAnnouncement("Nora terminó de hablar. Te escucha.");
        return;
      }

      // Limpieza de caracteres que puedan trabar el motor fonético
      const cleanText = text
        .replace(/[*#_~`>]/g, "")
        .replace(/\|+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) {
        isNoraSpeakingRef.current = false;
        setCallState("listening");
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0; // Velocidad cálida y pausada para personas con TEA / adultos mayores
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        let voiceToUse: SpeechSynthesisVoice | undefined = undefined;

        if (currentVoice) {
          voiceToUse = voices.find((v) => v.voiceURI === currentVoice);
        }

        if (!voiceToUse) {
          voiceToUse =
            voices.find(
              (v) =>
                (v.lang.includes("AR") || v.lang.includes("419") || v.lang.includes("MX")) &&
                !v.lang.includes("ES")
            ) ||
            voices.find(
              (v) =>
                v.name.toLowerCase().includes("sabina") ||
                v.name.toLowerCase().includes("dalia") ||
                v.name.toLowerCase().includes("google español") ||
                v.name.toLowerCase().includes("natural")
            ) ||
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
          setAccessibleAnnouncement("Nora está respondiendo.");
        };

        utterance.onend = () => {
          isNoraSpeakingRef.current = false;
          // Reactivar escucha paciente tras terminar de hablar Nora
          setTimeout(() => {
            if (!isNoraSpeakingRef.current && !isProcessingRef.current) {
              setCallState("listening");
              setAccessibleAnnouncement("Nora te escucha.");
              playAccessibleChime("start");
            }
          }, 350);
        };

        utterance.onerror = () => {
          isNoraSpeakingRef.current = false;
          setCallState("listening");
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[Speak Error]:", err);
        isNoraSpeakingRef.current = false;
        setCallState("listening");
      }
    },
    [currentVoice, isMuted, playAccessibleChime]
  );

  // 🚀 Enviar turno conversacional al backend multicanal
  const sendVoiceTurn = useCallback(
    async (payload: { message?: string; audioBlob?: Blob; mimeType?: string }) => {
      if (isProcessingRef.current) return;

      const hasText = payload.message && payload.message.trim().length > 0;
      const hasAudio = payload.audioBlob && payload.audioBlob.size > 800;

      if (!hasText && !hasAudio) {
        setCallState("listening");
        return;
      }

      stopNoraSpeech();
      isProcessingRef.current = true;
      setCallState("thinking");
      setAccessibleAnnouncement("Nora está reflexionando sobre tu consulta...");
      playAccessibleChime("end");

      let audioB64: string | undefined = undefined;
      if (hasAudio && payload.audioBlob) {
        audioB64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = (reader.result as string) || "";
            resolve(res.includes(",") ? res.split(",")[1] : res);
          };
          reader.readAsDataURL(payload.audioBlob!);
        });
      }

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch("/api/noraitu-realtime-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: payload.message || "",
            audioBase64: audioB64,
            mimeType: payload.mimeType || "audio/webm",
            history: historyRef.current.slice(-10),
            mode: activeModeRef.current
          }),
          signal: controller.signal
        });

        const transcribedHeader = res.headers.get("x-transcribed-user-text");
        const transcribedText = transcribedHeader ? decodeURIComponent(transcribedHeader) : payload.message || "";

        if (transcribedText) {
          setUserTranscript(`"${transcribedText}"`);
          historyRef.current.push({ role: "user", content: transcribedText });
        }

        if (!res.ok || !res.body) {
          isProcessingRef.current = false;
          setCallState("listening");
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

        if (fullAnswer.trim()) {
          historyRef.current.push({ role: "assistant", content: fullAnswer.trim() });
          if (historyRef.current.length > 16) {
            historyRef.current = historyRef.current.slice(-16);
          }
          if (onMessageLogged) {
            onMessageLogged(transcribedText || "🎙️ [Voz]", fullAnswer.trim());
          }
          speakNoraResponse(fullAnswer.trim());
        } else {
          setCallState("listening");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[Realtime Voice Error]:", err);
        }
        setCallState("listening");
      } finally {
        isProcessingRef.current = false;
      }
    },
    [onMessageLogged, playAccessibleChime, speakNoraResponse, stopNoraSpeech]
  );

  // 🎙️ Configuración de Web Speech Recognition Nativo (AEC + Latencia 0)
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "es-AR";

        recognition.onresult = (event: any) => {
          // Si Nora está hablando, no capturar para inmunidad al eco
          if (isNoraSpeakingRef.current || isProcessingRef.current) return;

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

          const activeText = (final || interim).trim();
          if (activeText) {
            setUserTranscript(`"${activeText}"`);
            if (final && final.trim().length > 1) {
              sendVoiceTurn({ message: final.trim() });
            }
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error !== "no-speech") {
            console.warn("[SpeechRecognition Note]:", e.error);
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
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isOpen, sendVoiceTurn]);

  // 🎛️ Pipeline de Aislamiento Acústico en 4 Capas (BiquadFilter + VAD Paciente)
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

    async function startAcousticPipeline() {
      try {
        // Capa 1: Filtros DSP del Hardware (AEC, ANS, AGC)
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

        // Capa 2: Filtro Pasa-Banda Vocal (Corta <85Hz y >3400Hz)
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 85;

        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 3400;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.25;

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(analyser);
        analyserRef.current = analyser;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

        let recorder: MediaRecorder | null = null;

        const createAndStartRecorder = () => {
          audioChunksRef.current = [];
          recorder = new MediaRecorder(stream, { mimeType });

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            if (blob.size > 800) {
              sendVoiceTurn({ audioBlob: blob, mimeType });
            } else {
              setCallState("listening");
            }
          };

          recorder.start(100);
          mediaRecorderRef.current = recorder;
        };

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const PATIENT_SILENCE_DURATION_MS = 1400; // 1.4s de silencio comprensivo para personas con TEA / pausas reflexivas

        setCallState("listening");
        playAccessibleChime("connected");
        setAccessibleAnnouncement("Conectado con Nora. Lista para escucharte.");

        let baselineSamples = 0;
        let baselineSum = 0;

        const monitorAudio = () => {
          if (!isMounted) return;

          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const currentAvg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round(currentAvg * 2.2)));

          // Calibración de ruido base de la habitación
          if (baselineSamples < 30) {
            baselineSum += currentAvg;
            baselineSamples++;
            noiseFloorRef.current = Math.max(12, Math.round(baselineSum / baselineSamples));
          }

          // 🛡️ Capa 4: INMUNIDAD AL ECO - Si Nora está hablando, silenciar detector
          if (isNoraSpeakingRef.current || isProcessingRef.current) {
            animFrameRef.current = requestAnimationFrame(monitorAudio);
            return;
          }

          // Si estamos en modo "Pulsar para hablar", no auto-disparar VAD
          if (interactionMode === "push_to_talk") {
            animFrameRef.current = requestAnimationFrame(monitorAudio);
            return;
          }

          const dynamicThreshold = noiseFloorRef.current + 14;
          const now = Date.now();

          if (currentAvg > dynamicThreshold) {
            silenceStartRef.current = null;
            if (!isSpeakingRef.current) {
              isSpeakingRef.current = true;
              createAndStartRecorder();
              setCallState("listening");
            }
          } else {
            if (isSpeakingRef.current) {
              if (silenceStartRef.current === null) {
                silenceStartRef.current = now;
              } else if (now - silenceStartRef.current > PATIENT_SILENCE_DURATION_MS) {
                isSpeakingRef.current = false;
                silenceStartRef.current = null;
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  mediaRecorderRef.current.stop();
                }
              }
            }
          }

          animFrameRef.current = requestAnimationFrame(monitorAudio);
        };

        monitorAudio();
      } catch (err) {
        console.error("[Microphone Init Error]:", err);
        alert("Por favor permite el acceso al micrófono para conversar con Nora.");
        onClose();
      }
    }

    startAcousticPipeline();

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
  }, [interactionMode, isOpen, onClose, playAccessibleChime, sendVoiceTurn, stopNoraSpeech]);

  // ⌨️ Accesibilidad por Teclado (Espacio para hablar, Esc para cerrar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (callState === "speaking") {
          stopNoraSpeech();
        }
      } else if (e.code === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, callState, onClose, stopNoraSpeech]);

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
      {/* Región ARIA accesible para lectores de pantalla */}
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
                Nora Conversación Noble
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

        {/* Selector Accesible de Modo de Interacción */}
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

        {/* Aura Dinámica Fluida y Serena (Apta TEA y Sensibilidad Sensorial) */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-4 text-center">
          
          <div className="relative flex items-center justify-center w-44 h-44">
            
            {/* Ondas suaves de presencia vocal */}
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
                  : isSpeakingRef.current || isPushTalking || audioLevel > 18
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
                    : isSpeakingRef.current || isPushTalking
                    ? "🎙️"
                    : "✨"}
                </span>
              </div>
            </div>
          </div>

          {/* Subtítulos Conversacionales de Alto Contraste y Accesibilidad */}
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
                    ? "Te escucho con atención y paciencia"
                    : "Mantené presionado el botón o Espacio para hablar"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {interactionMode === "hands_free"
                    ? "Hablá con libertad. El filtro inteligente aísla los ruidos del entorno."
                    : "Pulsá cuando quieras formular tu idea."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modo Pulsar para Hablar: Botón Táctil Central */}
        {interactionMode === "push_to_talk" && (
          <div className="w-full flex justify-center py-2">
            <button
              onMouseDown={() => setIsPushTalking(true)}
              onMouseUp={() => setIsPushTalking(false)}
              onTouchStart={() => setIsPushTalking(true)}
              onTouchEnd={() => setIsPushTalking(false)}
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

        {/* Barra Inferior: Controles de Audio y Cortar */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800/60">
          {/* Mute toggle */}
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

          {/* Indicador de Estado Accesible */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <div
              className={`w-2 h-2 rounded-full ${
                callState === "speaking"
                  ? "bg-cyan-400 animate-pulse"
                  : callState === "thinking"
                  ? "bg-purple-400 animate-pulse"
                  : isSpeakingRef.current || isPushTalking
                  ? "bg-emerald-400 animate-ping"
                  : "bg-slate-500"
              }`}
            />
            <span>
              {callState === "speaking"
                ? "Hablando"
                : callState === "thinking"
                ? "Pensando"
                : isSpeakingRef.current || isPushTalking
                ? "Escuchando"
                : "Lista"}
            </span>
          </div>

          {/* Botón Rojo Colgar Llamada */}
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
