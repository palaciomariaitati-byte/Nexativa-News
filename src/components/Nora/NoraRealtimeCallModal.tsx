"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Sparkles, Volume2, VolumeX } from "lucide-react";

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

  // Refs de audio y procesamiento
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Estados de control de turno VAD
  const isSpeakingRef = useRef<boolean>(false); // Usuario hablando
  const silenceStartRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isNoraSpeakingRef = useRef<boolean>(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeModeRef = useRef<string>(activeMode);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // 1. Cargar voces latinas
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

  // Detener habla de Nora
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

  // Sintetizador de voz de Nora
  const speakNoraResponse = useCallback(
    (text: string) => {
      if (isMuted || !text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) {
        isNoraSpeakingRef.current = false;
        setCallState("listening");
        return;
      }

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
        utterance.rate = 1.05;
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
        };

        utterance.onend = () => {
          isNoraSpeakingRef.current = false;
          // Reactivar escucha inmediatamente al terminar
          setTimeout(() => {
            if (!isNoraSpeakingRef.current && !isProcessingRef.current) {
              setCallState("listening");
            }
          }, 300);
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
    [currentVoice, isMuted]
  );

  // Enviar audio grabado al backend de inferencia conversacional directa
  const sendVoiceTurn = useCallback(
    async (audioBlob: Blob, mimeType: string) => {
      if (isProcessingRef.current || audioBlob.size < 600) {
        setCallState("listening");
        return;
      }

      stopNoraSpeech();
      isProcessingRef.current = true;
      setCallState("thinking");
      setUserTranscript("Nora te está escuchando...");
      setAssistantText("");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const controller = new AbortController();
          abortControllerRef.current = controller;

          const res = await fetch("/api/noraitu-realtime-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType,
              history: historyRef.current.slice(-8),
              mode: activeModeRef.current
            }),
            signal: controller.signal
          });

          const transcribedHeader = res.headers.get("x-transcribed-user-text");
          if (transcribedHeader) {
            const decoded = decodeURIComponent(transcribedHeader);
            setUserTranscript(`"${decoded}"`);
            historyRef.current.push({ role: "user", content: decoded });
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
            if (historyRef.current.length > 14) {
              historyRef.current = historyRef.current.slice(-14);
            }
            if (onMessageLogged) {
              onMessageLogged(userTranscript || "🎙️ [Voz]", fullAnswer.trim());
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
      };

      reader.readAsDataURL(audioBlob);
    },
    [onMessageLogged, speakNoraResponse, stopNoraSpeech, userTranscript]
  );

  // Inicializar VAD (Detección de voz continua manos libres tipo ChatGPT)
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

    async function startHandsFreePipeline() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
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
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.2;
        source.connect(analyser);
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
              sendVoiceTurn(blob, mimeType);
            } else {
              setCallState("listening");
            }
          };

          recorder.start(100);
          mediaRecorderRef.current = recorder;
        };

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const VOICE_THRESHOLD = 18; // Umbral de energía de voz humana
        const SILENCE_DURATION_MS = 850; // 850ms de pausa para enviar turno automáticamente

        setCallState("listening");

        const monitorAudio = () => {
          if (!isMounted) return;

          analyser.getByteFrequencyData(dataArray);

          // Calcular promedio de energía
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round(avg * 2.2)));

          // Si Nora está hablando, no capturamos voz para no hacer eco
          if (isNoraSpeakingRef.current) {
            // Barge-in: si el usuario habla fuerte mientras Nora habla, cortar a Nora
            if (avg > VOICE_THRESHOLD + 15) {
              stopNoraSpeech();
              createAndStartRecorder();
              isSpeakingRef.current = true;
              silenceStartRef.current = null;
              setCallState("listening");
            }
            animFrameRef.current = requestAnimationFrame(monitorAudio);
            return;
          }

          if (isProcessingRef.current) {
            animFrameRef.current = requestAnimationFrame(monitorAudio);
            return;
          }

          const now = Date.now();

          if (avg > VOICE_THRESHOLD) {
            // El usuario está hablando
            silenceStartRef.current = null;

            if (!isSpeakingRef.current) {
              isSpeakingRef.current = true;
              createAndStartRecorder();
              setCallState("listening");
            }
          } else {
            // Hay silencio
            if (isSpeakingRef.current) {
              if (silenceStartRef.current === null) {
                silenceStartRef.current = now;
              } else if (now - silenceStartRef.current > SILENCE_DURATION_MS) {
                // Pausa completada: fin de turno natural!
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
        alert("Por favor permite el acceso al micrófono para hablar con Nora.");
        onClose();
      }
    }

    startHandsFreePipeline();

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
  }, [isOpen, onClose, sendVoiceTurn, stopNoraSpeech]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-[#070b14] to-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-between min-h-[580px]">
        
        {/* Cabecera Tipo Llamada Telefónica */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-400/40 shadow-md shadow-cyan-500/20">
              <Sparkles size={18} className="text-cyan-300 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                Nora Conversación Pro
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 uppercase">
                  Manos Libres
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {formatDuration(callDuration)} • {activeMode.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar llamada"
          >
            ✕
          </button>
        </div>

        {/* Aura Dinámica Fluida Estilo ChatGPT Voice Mode */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-6 text-center">
          
          <div className="relative flex items-center justify-center w-48 h-48">
            
            {/* Ondas expansivas basadas en nivel de audio */}
            <div
              className="absolute rounded-full bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-emerald-500/20 transition-transform duration-100 ease-out"
              style={{
                width: `${140 + (callState === "speaking" ? 45 : audioLevel * 0.8)}px`,
                height: `${140 + (callState === "speaking" ? 45 : audioLevel * 0.8)}px`,
                opacity: callState === "thinking" ? 0.3 : 0.8
              }}
            />

            <div
              className="absolute rounded-full bg-gradient-to-tr from-cyan-600/30 via-indigo-600/30 to-purple-600/30 transition-transform duration-150 ease-out"
              style={{
                width: `${120 + (callState === "speaking" ? 30 : audioLevel * 0.5)}px`,
                height: `${120 + (callState === "speaking" ? 30 : audioLevel * 0.5)}px`
              }}
            />

            {/* Núcleo Central del Aura */}
            <div
              className={`relative flex items-center justify-center w-28 h-28 rounded-full shadow-2xl transition-all duration-300 ${
                callState === "speaking"
                  ? "bg-gradient-to-tr from-cyan-400 via-teal-300 to-emerald-400 shadow-cyan-400/50 scale-105"
                  : callState === "thinking"
                  ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 shadow-purple-500/50 animate-spin scale-95"
                  : isSpeakingRef.current || audioLevel > 15
                  ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-400/50 scale-110"
                  : "bg-gradient-to-tr from-cyan-800 via-slate-800 to-teal-900 shadow-cyan-900/40 border border-cyan-500/40"
              }`}
            >
              <div className="absolute inset-1 rounded-full bg-slate-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-center">
                <span className="text-3xl">
                  {callState === "speaking"
                    ? "🗣️"
                    : callState === "thinking"
                    ? "⚡"
                    : isSpeakingRef.current
                    ? "🎙️"
                    : "✨"}
                </span>
              </div>
            </div>
          </div>

          {/* Subtítulos Conversacionales en Tiempo Real */}
          <div className="w-full mt-6 px-4 min-h-[80px] flex flex-col items-center justify-center">
            {callState === "thinking" ? (
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                ⚡ Nora está pensando su respuesta...
              </p>
            ) : assistantText ? (
              <div className="max-w-sm bg-slate-900/85 border border-slate-800 rounded-2xl p-3 shadow-lg animate-fade-in">
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
                  Modo manos libres 100% activo
                </p>
                <p className="text-[11px] text-slate-500">
                  Solo hablá con libertad. Nora te escucha y responde sola.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Barra Inferior: Solo Controles de Audio y Cortar */}
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
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            }`}
            title={isMuted ? "Reanudar voz" : "Silenciar voz"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Indicador de Estado */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
            <div
              className={`w-2 h-2 rounded-full ${
                callState === "speaking"
                  ? "bg-cyan-400 animate-pulse"
                  : callState === "thinking"
                  ? "bg-purple-400 animate-spin"
                  : isSpeakingRef.current
                  ? "bg-emerald-400 animate-ping"
                  : "bg-slate-500"
              }`}
            />
            <span>
              {callState === "speaking"
                ? "Hablando"
                : callState === "thinking"
                ? "Pensando"
                : isSpeakingRef.current
                ? "Escuchando"
                : "Listo"}
            </span>
          </div>

          {/* Botón Rojo Colgar Llamada */}
          <button
            onClick={onClose}
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
