"use client";

import React, { useState, useEffect, useRef } from "react";
import { NoraRealtimeOrchestrator, manejarStreamingNora } from "@/lib/nora/realtime/speechPipeline";

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
  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking" | "interrupted">("connecting");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [assistantResponse, setAssistantResponse] = useState<string>("");
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<string>(selectedVoiceUri || "");

  const orchestratorRef = useRef<NoraRealtimeOrchestrator | null>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // 1. Cargar voces del sistema
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        const spanish = vList.filter((v) => v.lang.startsWith("es") || v.lang.includes("es-"));
        const finalVoices = spanish.length > 0 ? spanish : vList;
        setAvailableVoices(finalVoices);
        if (!currentVoice && finalVoices.length > 0) {
          const preferred = finalVoices.find((v) =>
            v.name.toLowerCase().includes("sabina") ||
            v.name.toLowerCase().includes("dalia") ||
            v.name.toLowerCase().includes("natural") ||
            v.name.toLowerCase().includes("google español")
          );
          setCurrentVoice(preferred ? preferred.voiceURI : finalVoices[0].voiceURI);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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

  // 3. Inicializar y desmontar el orquestador de llamada en tiempo real
  useEffect(() => {
    if (!isOpen) {
      if (orchestratorRef.current) {
        orchestratorRef.current.stop();
        orchestratorRef.current = null;
      }
      return;
    }

    const orchestrator = new NoraRealtimeOrchestrator({
      voiceUri: currentVoice || selectedVoiceUri,
      lang: "es-AR",
      onVolumeChange: (vol) => {
        setMicVolume(vol);
      },
      onTranscript: async (text, isFinal) => {
        setUserTranscript(text);

        if (isFinal && text.trim().length > 1 && !isProcessingRef.current) {
          isProcessingRef.current = true;
          setCallState("thinking");

          const userText = text.trim();
          historyRef.current.push({ role: "user", content: userText });

          setAssistantResponse("");
          const responseText = await manejarStreamingNora(
            userText,
            orchestrator,
            historyRef.current.slice(-6),
            activeMode
          );

          if (responseText.trim()) {
            historyRef.current.push({ role: "assistant", content: responseText.trim() });
            setAssistantResponse(responseText.trim());
            if (onMessageLogged) {
              onMessageLogged(userText, responseText.trim());
            }
          }

          isProcessingRef.current = false;
        }
      },
      onAssistantSpeechStart: () => {
        setCallState("speaking");
      },
      onAssistantSpeechEnd: () => {
        setCallState("listening");
      },
      onUserInterruption: () => {
        setCallState("interrupted");
        setTimeout(() => setCallState("listening"), 400);
      }
    });

    orchestratorRef.current = orchestrator;
    orchestrator.start().then(() => {
      setCallState("listening");
    });

    return () => {
      orchestrator.stop();
      orchestratorRef.current = null;
    };
  }, [isOpen, currentVoice, activeMode]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleMute = () => {
    if (orchestratorRef.current) {
      if (isMuted) {
        orchestratorRef.current.start();
        setIsMuted(false);
      } else {
        orchestratorRef.current.stop();
        setIsMuted(true);
      }
    }
  };

  const handleInterruptNow = () => {
    if (orchestratorRef.current) {
      orchestratorRef.current.interruptAssistant();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/10 p-6 flex flex-col items-center justify-between min-h-[580px]">
        
        {/* Cabecera de la llamada */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40">
              <span className="text-xl">✨</span>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                NoraItu Realtime
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  Full Duplex 0ms
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {formatDuration(callDuration)} • {activeMode.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Orbe Central y Ondas Reactivas */}
        <div className="my-auto flex flex-col items-center justify-center relative w-full">
          {/* Ondas expansivas de fondo según volumen de voz */}
          <div
            className="absolute rounded-full border border-cyan-400/20 transition-all duration-100 pointer-events-none"
            style={{
              width: `${160 + micVolume * 1.8}px`,
              height: `${160 + micVolume * 1.8}px`,
              opacity: callState === "listening" ? 0.3 + micVolume / 150 : 0.1
            }}
          />
          <div
            className="absolute rounded-full border border-teal-400/15 transition-all duration-150 pointer-events-none"
            style={{
              width: `${200 + micVolume * 2.4}px`,
              height: `${200 + micVolume * 2.4}px`,
              opacity: callState === "listening" ? 0.2 + micVolume / 200 : 0.05
            }}
          />

          {/* Orbe Pulsante Central */}
          <div
            onClick={callState === "speaking" ? handleInterruptNow : undefined}
            className={`relative flex items-center justify-center w-36 h-36 rounded-full cursor-pointer transition-all duration-500 shadow-2xl ${
              callState === "speaking"
                ? "bg-gradient-to-tr from-cyan-600 via-teal-500 to-indigo-600 shadow-cyan-500/50 scale-105 animate-pulse"
                : callState === "thinking"
                ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 shadow-purple-500/40 animate-spin scale-95"
                : callState === "interrupted"
                ? "bg-gradient-to-tr from-amber-600 via-orange-500 to-red-500 shadow-amber-500/50 scale-90"
                : "bg-gradient-to-tr from-cyan-900 via-slate-800 to-cyan-800 shadow-cyan-900/30 hover:scale-105"
            }`}
          >
            <div className="absolute inset-1 rounded-full bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2">
              <span className="text-3xl mb-1">
                {callState === "speaking"
                  ? "🗣️"
                  : callState === "thinking"
                  ? "🧠"
                  : callState === "interrupted"
                  ? "✋"
                  : isMuted
                  ? "🔇"
                  : "🎙️"}
              </span>
              <span className="text-[11px] font-semibold text-cyan-200 tracking-wider uppercase">
                {callState === "speaking"
                  ? "Hablando"
                  : callState === "thinking"
                  ? "Pensando"
                  : callState === "interrupted"
                  ? "Corte 0ms"
                  : isMuted
                  ? "Silenciado"
                  : "Escuchando"}
              </span>
            </div>
          </div>

          {/* Subtítulos y Transcripción en Vivo */}
          <div className="w-full mt-6 px-4 text-center min-h-[64px] flex flex-col items-center justify-center">
            {userTranscript ? (
              <p className="text-xs text-cyan-300/90 font-medium italic animate-fade-in line-clamp-2 max-w-sm">
                "{userTranscript}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-light">
                Hablá con libertad. Podés interrumpir a Nora en cualquier momento.
              </p>
            )}
          </div>
        </div>

        {/* Selector de Voz y Controles Inferiores */}
        <div className="w-full flex flex-col items-center gap-4">
          {availableVoices.length > 0 && (
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span>🔊</span> Voz:
              </span>
              <select
                value={currentVoice}
                onChange={(e) => {
                  setCurrentVoice(e.target.value);
                  orchestratorRef.current?.updateVoice(e.target.value);
                }}
                className="bg-transparent text-cyan-300 font-medium outline-none text-right cursor-pointer max-w-[240px] truncate"
              >
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-white">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Barra de botones de llamada */}
          <div className="flex items-center justify-center gap-6 w-full pt-2">
            {/* Silenciar micrófono */}
            <button
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
              }`}
              title={isMuted ? "Reanudar micrófono" : "Silenciar micrófono"}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>

            {/* Colgar llamada */}
            <button
              onClick={onClose}
              className="px-6 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-600/30 flex items-center gap-2 transition-transform active:scale-95"
            >
              <span>📞</span>
              <span>Finalizar</span>
            </button>

            {/* Interrumpir manualmente */}
            <button
              onClick={handleInterruptNow}
              disabled={callState !== "speaking"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                callState === "speaking"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer"
                  : "bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed"
              }`}
              title="Interrumpir a Nora (Barge-in)"
            >
              ✋
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
