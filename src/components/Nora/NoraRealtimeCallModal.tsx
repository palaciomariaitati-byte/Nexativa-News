"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Send, Volume2, Sparkles, VolumeX, Mic } from "lucide-react";

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
  const [callState, setCallState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [assistantText, setAssistantText] = useState<string>("");
  const [manualText, setManualText] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<string>(selectedVoiceUri || "");
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeModeRef = useRef<string>(activeMode);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // 1. Cargar voces y seleccionar acento latinoamericano
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.resume();
      } catch {}

      const loadVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        const spanish = vList.filter((v) => v.lang.startsWith("es") || v.lang.includes("es-"));
        const finalVoices = spanish.length > 0 ? spanish : vList;
        setAvailableVoices(finalVoices);

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

  // Detener voz de Nora
  const stopAssistantSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    currentUtteranceRef.current = null;
    setCallState("idle");
  }, []);

  // Sintetizador de voz limpio
  const speakText = useCallback(
    (text: string) => {
      if (isMuted || !text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) {
        setCallState("idle");
        return;
      }

      const cleanText = text
        .replace(/[*#_~`>]/g, "")
        .replace(/\|+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) {
        setCallState("idle");
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.02;
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
          setCallState("speaking");
        };

        utterance.onend = () => {
          currentUtteranceRef.current = null;
          setCallState("idle");
        };

        utterance.onerror = () => {
          currentUtteranceRef.current = null;
          setCallState("idle");
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[Voice Speak Error]:", err);
        setCallState("idle");
      }
    },
    [currentVoice, isMuted]
  );

  // Enviar a la IA (Proxy Groq 120ms)
  const executeQuery = useCallback(
    async (payload: { message?: string; audioBase64?: string; mimeType?: string }) => {
      if (isProcessingRef.current) return;

      stopAssistantSpeech();
      isProcessingRef.current = true;
      setCallState("thinking");
      if (payload.message) setUserTranscript(`"${payload.message}"`);
      else setUserTranscript("Procesando tu voz...");
      setAssistantText("");

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch("/api/noraitu-realtime-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: payload.message,
            audioBase64: payload.audioBase64,
            mimeType: payload.mimeType,
            history: historyRef.current.slice(-6),
            mode: activeModeRef.current
          }),
          signal: controller.signal
        });

        const transcribedHeader = res.headers.get("x-transcribed-user-text");
        if (transcribedHeader) {
          const decoded = decodeURIComponent(transcribedHeader);
          setUserTranscript(`"${decoded}"`);
          historyRef.current.push({ role: "user", content: decoded });
        } else if (payload.message) {
          historyRef.current.push({ role: "user", content: payload.message });
        }

        if (!res.ok || !res.body) {
          const errMsg = "Disculpame, tuve un micro corte de enlace. ¿Podrías repetirme?";
          setAssistantText(errMsg);
          speakText(errMsg);
          isProcessingRef.current = false;
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setAssistantText(full);
        }

        if (full.trim()) {
          historyRef.current.push({ role: "assistant", content: full.trim() });
          if (historyRef.current.length > 12) {
            historyRef.current = historyRef.current.slice(-12);
          }
          if (onMessageLogged) {
            onMessageLogged(userTranscript || "🎙️ [Voz]", full.trim());
          }
          speakText(full.trim());
        } else {
          setCallState("idle");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[Realtime Proxy Error]:", err);
          const fallback = "Comprendo tu consulta. Continuemos profundizando.";
          setAssistantText(fallback);
          speakText(fallback);
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [onMessageLogged, speakText, stopAssistantSpeech, userTranscript]
  );

  // Iniciar grabación de audio nativo limpio (CERO pitidos)
  const startRecording = useCallback(async () => {
    stopAssistantSpeech();
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 500) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            executeQuery({ audioBase64: base64, mimeType });
          };
          reader.readAsDataURL(audioBlob);
        } else {
          setCallState("idle");
          setUserTranscript("Audio muy breve. Tocá el botón para hablar.");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setCallState("listening");
      setUserTranscript("🔴 Escuchándote... Hablá y tocá el botón al terminar.");
    } catch (err) {
      console.error("[Mic Access Error]:", err);
      alert("Por favor permite el acceso al micrófono para hablar con Nora.");
      setCallState("idle");
    }
  }, [executeQuery, stopAssistantSpeech]);

  // Detener grabación y enviar
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && callState === "listening") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [callState]);

  // Enviar texto manual
  const handleManualSubmit = () => {
    if (manualText.trim()) {
      const txt = manualText.trim();
      setManualText("");
      executeQuery({ message: txt });
    }
  };

  // Click en el orbe
  const handleOrbClick = () => {
    if (callState === "listening") {
      stopRecording();
    } else if (callState === "speaking") {
      stopAssistantSpeech();
    } else if (callState === "idle") {
      startRecording();
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    if (!isOpen) {
      stopAssistantSpeech();
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch {}
        mediaRecorderRef.current = null;
      }
    }
  }, [isOpen, stopAssistantSpeech]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/10 p-5 flex flex-col items-center justify-between min-h-[560px]">
        
        {/* Cabecera */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40">
              <Sparkles size={16} className="text-cyan-300" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                NoraItu Llamada en Vivo
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  Llamada Directa
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
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

        {/* Orbe Central y Respuesta en Pantalla */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-4 text-center">
          
          {/* Botón / Orbe Central */}
          <div
            onClick={handleOrbClick}
            className={`relative flex items-center justify-center w-36 h-36 rounded-full cursor-pointer transition-all duration-300 shadow-2xl ${
              callState === "listening"
                ? "bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 shadow-rose-500/50 scale-110 animate-pulse"
                : callState === "thinking"
                ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 shadow-purple-500/50 scale-100 animate-pulse"
                : callState === "speaking"
                ? "bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 shadow-cyan-500/50 scale-105 animate-pulse"
                : "bg-gradient-to-tr from-cyan-900 via-slate-800 to-teal-900 shadow-cyan-900/40 hover:scale-105 border border-cyan-500/30"
            }`}
          >
            <div className="absolute inset-1.5 rounded-full bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
              <span className="text-3xl mb-1">
                {callState === "listening"
                  ? "🔴"
                  : callState === "thinking"
                  ? "⚡"
                  : callState === "speaking"
                  ? "🗣️"
                  : "🎤"}
              </span>
              <span className="text-[11px] font-bold text-white tracking-wider uppercase">
                {callState === "listening"
                  ? "Tocá al terminar"
                  : callState === "thinking"
                  ? "Pensando..."
                  : callState === "speaking"
                  ? "Nora Hablando"
                  : "Tocá para Hablar"}
              </span>
            </div>
          </div>

          {/* Subtítulos de Nora y Respuesta en Vivo en Pantalla */}
          <div className="w-full mt-4 px-3 min-h-[64px] flex flex-col items-center justify-center">
            {callState === "listening" ? (
              <p className="text-xs text-rose-300 font-semibold animate-pulse">
                Escuchándote... Hablale a Nora y volvé a tocar el botón al terminar.
              </p>
            ) : callState === "thinking" ? (
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                ⚡ Nora está procesando tu respuesta...
              </p>
            ) : assistantText ? (
              <div className="max-w-xs bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 shadow-lg animate-fade-in">
                <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                  "{assistantText}"
                </p>
              </div>
            ) : userTranscript ? (
              <p className="text-xs text-cyan-300/90 italic line-clamp-2 max-w-xs">
                {userTranscript}
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-light">
                Tocá el botón central, hablá y Nora te responderá con voz.
              </p>
            )}
          </div>
        </div>

        {/* Input Manual y Selector de Voz */}
        <div className="w-full flex flex-col items-center gap-3">
          
          {/* Campo de texto alternativo */}
          <div className="w-full flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-1">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualText.trim()) {
                  handleManualSubmit();
                }
              }}
              placeholder="O escribí tu pregunta acá..."
              className="flex-1 px-3 py-2 text-xs text-white bg-transparent placeholder-slate-500 focus:outline-hidden"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualText.trim()}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Send size={12} />
              <span>Enviar</span>
            </button>
          </div>

          {/* Selector de Voz */}
          {availableVoices.length > 0 && (
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Volume2 size={12} className="text-cyan-400" /> Voz:
              </span>
              <select
                value={currentVoice}
                onChange={(e) => {
                  setCurrentVoice(e.target.value);
                  localStorage.setItem("noraitu_selected_voice", e.target.value);
                }}
                className="bg-transparent text-cyan-300 font-medium outline-none text-right cursor-pointer max-w-[200px] truncate"
              >
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-white">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botones de Control de Llamada */}
          <div className="flex items-center justify-center gap-6 w-full pt-1">
            {/* Silenciar Voz de Nora */}
            <button
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                } else {
                  stopAssistantSpeech();
                  setIsMuted(true);
                }
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 text-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
              title={isMuted ? "Reanudar voz" : "Silenciar voz de Nora"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Colgar llamada */}
            <button
              onClick={onClose}
              className="px-6 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <PhoneOff size={14} />
              <span>Colgar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
