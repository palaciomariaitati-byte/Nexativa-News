"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Send, Volume2, Sparkles } from "lucide-react";

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
  const [callState, setCallState] = useState<"idle" | "recording" | "thinking" | "speaking">("idle");
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

  // 1. Cargar voces del navegador y desbloquear audio
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

  // Sintetizar voz de Nora en oraciones fluidas
  const speakSentence = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || isMuted) return;

    const cleanText = text
      .replace(/[*#_~`>]/g, "")
      .replace(/\|+/g, " ")
      .trim();

    if (!cleanText) return;

    try {
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "es-AR";

      if (currentVoice) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find((v) => v.voiceURI === currentVoice);
        if (selected) utterance.voice = selected;
      }

      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setCallState("speaking");
      };

      utterance.onend = () => {
        setCallState("idle");
      };

      utterance.onerror = () => {
        setCallState("idle");
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[TTS Speak Warn]:", e);
      setCallState("idle");
    }
  }, [currentVoice, isMuted]);

  // Enviar audio grabado al backend de Nora (con transcripción Whisper LPU en ~150ms)
  const processRecordedAudio = useCallback(async (audioBlob: Blob, mimeType: string) => {
    if (isProcessingRef.current || audioBlob.size < 400) {
      setCallState("idle");
      return;
    }

    isProcessingRef.current = true;
    setCallState("thinking");
    setUserTranscript("Transcribiendo tu voz con Whisper LPU...");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch("/api/noraitu-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Escucha este audio del usuario en la llamada en vivo y respóndele conversacionalmente con oraciones directas, cálidas y concisas sin markdown.",
            history: historyRef.current.slice(-6),
            contextData: { mode: activeMode, is_realtime_call: true },
            stream: true,
            audioFile: {
              name: `call_voice.${mimeType.includes("mp4") ? "mp4" : "webm"}`,
              type: mimeType,
              base64: base64Data
            }
          }),
          signal: controller.signal
        });

        if (!res.ok || !res.body) {
          setUserTranscript("No se pudo procesar el audio.");
          speakSentence("Disculpame, no pude escucharte bien. ¿Podrías repetir?");
          isProcessingRef.current = false;
          return;
        }

        const bodyReader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedFull = "";
        let sentenceBuffer = "";
        let userSaidExtracted = "";

        while (true) {
          const { done, value } = await bodyReader.read();
          if (done) break;

          const rawChunk = decoder.decode(value, { stream: true });
          accumulatedFull += rawChunk;
          sentenceBuffer += rawChunk;

          // Detección de oraciones para hablar en tiempo real
          const match = sentenceBuffer.match(/(.*?[.?!;\n])\s*(.*)/s);
          if (match && match[1]) {
            const readySentence = match[1].replace(/data:\s*\[DONE\]/g, "").replace(/data:\s*/g, "");
            if (readySentence.trim()) {
              speakSentence(readySentence);
            }
            sentenceBuffer = match[2] || "";
          }
        }

        if (sentenceBuffer.trim()) {
          const leftover = sentenceBuffer.replace(/data:\s*\[DONE\]/g, "").replace(/data:\s*/g, "");
          if (leftover.trim()) {
            speakSentence(leftover);
          }
        }

        // Limpiar respuesta para la UI
        const cleanResponse = accumulatedFull
          .replace(/data:\s*\[DONE\]/g, "")
          .replace(/data:\s*\{.*?\"text\":\s*\"(.*?)\".*?\}/g, "$1")
          .trim();

        setAssistantText(cleanResponse || "Te escucho.");
        setUserTranscript("Voz recibida");

        if (cleanResponse) {
          historyRef.current.push({ role: "user", content: "🎙️ [Mensaje de voz]" });
          historyRef.current.push({ role: "assistant", content: cleanResponse });
          if (onMessageLogged) {
            onMessageLogged("🎙️ [Mensaje de voz]", cleanResponse);
          }
        }

      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[Realtime Call Audio Error]:", err);
          speakSentence("A ver, continuemos con lo que hablábamos.");
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    reader.readAsDataURL(audioBlob);
  }, [activeMode, onMessageLogged, speakSentence]);

  // Iniciar grabación de voz nativa del micrófono (MediaRecorder)
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
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        processRecordedAudio(audioBlob, mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setCallState("recording");
      setUserTranscript("Escuchándote... Hablá con libertad.");
    } catch (err) {
      console.error("[Microphone Access Error]:", err);
      alert("Por favor permite el acceso al micrófono para hablar con Nora.");
      setCallState("idle");
    }
  }, [processRecordedAudio, stopAssistantSpeech]);

  // Detener grabación y enviar a Nora
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && callState === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [callState]);

  // Procesar texto escrito manualmente en la llamada
  const handleManualSubmit = useCallback(async () => {
    const text = manualText.trim();
    if (!text || isProcessingRef.current) return;

    stopAssistantSpeech();
    setManualText("");
    setUserTranscript(`"${text}"`);
    setCallState("thinking");
    isProcessingRef.current = true;

    try {
      const res = await fetch("/api/noraitu-realtime-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyRef.current.slice(-6),
          mode: activeMode
        })
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
        }

        if (full.trim()) {
          setAssistantText(full.trim());
          speakSentence(full.trim());
          historyRef.current.push({ role: "user", content: text });
          historyRef.current.push({ role: "assistant", content: full.trim() });
          if (onMessageLogged) onMessageLogged(text, full.trim());
        }
      }
    } catch (e) {
      console.error("[Manual Submit Warn]:", e);
    } finally {
      isProcessingRef.current = false;
    }
  }, [activeMode, manualText, onMessageLogged, speakSentence, stopAssistantSpeech]);

  // Cleanup al cerrar
  useEffect(() => {
    if (!isOpen) {
      stopAssistantSpeech();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
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
      <div className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/10 p-5 flex flex-col items-center justify-between min-h-[550px]">
        
        {/* Cabecera de la llamada */}
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
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Whisper LPU
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

        {/* Orbe Central Interactivo */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-4 text-center">
          
          {/* Botón / Orbe Pulsante de Voz */}
          <div
            onClick={() => {
              if (callState === "recording") {
                stopRecording();
              } else if (callState === "speaking") {
                stopAssistantSpeech();
              } else {
                startRecording();
              }
            }}
            className={`relative flex items-center justify-center w-36 h-36 rounded-full cursor-pointer transition-all duration-300 shadow-2xl ${
              callState === "recording"
                ? "bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 shadow-rose-500/50 scale-110 animate-pulse"
                : callState === "thinking"
                ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 shadow-purple-500/50 scale-100 animate-spin"
                : callState === "speaking"
                ? "bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 shadow-cyan-500/50 scale-105 animate-pulse"
                : "bg-gradient-to-tr from-cyan-900 via-slate-800 to-teal-900 shadow-cyan-900/40 hover:scale-105 border border-cyan-500/30"
            }`}
          >
            <div className="absolute inset-1.5 rounded-full bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
              <span className="text-3xl mb-1">
                {callState === "recording"
                  ? "🎙️"
                  : callState === "thinking"
                  ? "⚡"
                  : callState === "speaking"
                  ? "🗣️"
                  : "🎤"}
              </span>
              <span className="text-[11px] font-bold text-white tracking-wider uppercase">
                {callState === "recording"
                  ? "Tocá al terminar"
                  : callState === "thinking"
                  ? "Pensando..."
                  : callState === "speaking"
                  ? "Nora Hablando"
                  : "Tocá para Hablar"}
              </span>
            </div>
          </div>

          {/* Subtítulos / Estado */}
          <div className="w-full mt-5 px-3 min-h-[50px] flex flex-col items-center justify-center">
            {callState === "recording" ? (
              <p className="text-xs text-rose-300 font-semibold animate-pulse">
                🔴 Grabando... Hablale a Nora y tocá el botón cuando termines.
              </p>
            ) : callState === "thinking" ? (
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                🧠 Nora está procesando tu consulta...
              </p>
            ) : callState === "speaking" ? (
              <p className="text-xs text-emerald-300 font-medium line-clamp-2 max-w-xs">
                "{assistantText || "Respondiendo..."}"
              </p>
            ) : userTranscript ? (
              <p className="text-xs text-cyan-300/90 italic line-clamp-2 max-w-xs">
                {userTranscript}
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-light">
                Tocá el orbe central para hablarle a Nora directamente.
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
                onChange={(e) => setCurrentVoice(e.target.value)}
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
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
              title={isMuted ? "Reanudar voz" : "Silenciar voz de Nora"}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
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
