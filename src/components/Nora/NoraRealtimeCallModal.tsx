"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Send, Volume2, Sparkles, VolumeX } from "lucide-react";

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
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
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
  }, [currentVoice]);

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

  // Detener cualquier reproducción de voz
  const stopAssistantSpeech = useCallback(() => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {}
      audioPlayerRef.current = null;
    }
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

  // Sintetizador de voz híbrido de alta fidelidad (TTS + WebSpeech)
  const speakText = useCallback(async (text: string) => {
    if (isMuted || !text.trim()) {
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

    setCallState("speaking");

    // 1. Intentar con TTS Serverless (/api/noraitu-tts)
    try {
      const ttsRes = await fetch("/api/noraitu-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice: "es-la" }),
        signal: AbortSignal.timeout(3000)
      });

      if (ttsRes.ok && ttsRes.headers.get("content-type")?.includes("audio")) {
        const audioBlob = await ttsRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          setCallState("idle");
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setCallState("idle");
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      // Continuar al fallback de SpeechSynthesis
    }

    // 2. Fallback Instantáneo a Web Speech API
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setCallState("idle");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let voiceToUse: SpeechSynthesisVoice | undefined = undefined;

      if (currentVoice) {
        voiceToUse = voices.find((v) => v.voiceURI === currentVoice);
      }

      if (!voiceToUse) {
        voiceToUse = voices.find((v) =>
          (v.lang.startsWith("es") || v.lang.includes("es-")) &&
          (v.name.toLowerCase().includes("sabina") ||
            v.name.toLowerCase().includes("dalia") ||
            v.name.toLowerCase().includes("elena") ||
            v.name.toLowerCase().includes("google español") ||
            v.name.toLowerCase().includes("natural"))
        ) || voices.find((v) => v.lang.startsWith("es"));
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
        setCallState("idle");
      };

      utterance.onerror = () => {
        setCallState("idle");
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[Voice synthesis fallback error]:", err);
      setCallState("idle");
    }
  }, [currentVoice, isMuted]);

  // Procesar audio grabado del usuario
  const processRecordedAudio = useCallback(async (audioBlob: Blob, mimeType: string) => {
    if (isProcessingRef.current || audioBlob.size < 300) {
      setCallState("idle");
      return;
    }

    isProcessingRef.current = true;
    setCallState("thinking");
    setUserTranscript("🎙️ Procesando audio...");
    setAssistantText("");

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
            message: "Escucha este audio del usuario y respóndele de forma directa, cálida y conversacional en 2 o 3 oraciones concisas para hablar por voz.",
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
          setUserTranscript("⚠️ No se pudo procesar el audio.");
          speakText("Disculpame, tuve un micro corte. ¿Podrías repetirme?");
          isProcessingRef.current = false;
          return;
        }

        const bodyReader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";
        let accumulatedClean = "";

        while (true) {
          const { done, value } = await bodyReader.read();
          if (done) break;

          const rawChunk = decoder.decode(value, { stream: true });
          sseBuffer += rawChunk;

          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":") || trimmed === ": keep-alive") continue;

            if (trimmed.startsWith("data:")) {
              const dataContent = trimmed.replace(/^data:\s*/, "").trim();
              if (dataContent === "[DONE]") continue;

              let textToAdd = "";
              try {
                const parsed = JSON.parse(dataContent);
                textToAdd = parsed.text || parsed.reply || parsed.content || (typeof parsed === "string" ? parsed : "");
              } catch {
                textToAdd = dataContent;
              }

              if (textToAdd) {
                accumulatedClean += textToAdd;
                setAssistantText(accumulatedClean);
              }
            } else {
              accumulatedClean += trimmed;
              setAssistantText(accumulatedClean);
            }
          }
        }

        if (sseBuffer.trim()) {
          const leftover = sseBuffer.replace(/^data:\s*/, "").replace(/\[DONE\]/g, "").trim();
          if (leftover) {
            accumulatedClean += leftover;
            setAssistantText(accumulatedClean);
          }
        }

        setUserTranscript("Voz recibida");

        if (accumulatedClean.trim()) {
          historyRef.current.push({ role: "user", content: "🎙️ [Nota de voz]" });
          historyRef.current.push({ role: "assistant", content: accumulatedClean.trim() });
          if (onMessageLogged) {
            onMessageLogged("🎙️ [Nota de voz]", accumulatedClean.trim());
          }
          // Reproducir la voz de Nora de inmediato
          speakText(accumulatedClean.trim());
        } else {
          speakText("Te escuché perfectamente. Sigamos conversando.");
        }

      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[Realtime Call Audio Error]:", err);
          speakText("A ver, continuemos con lo que me decías.");
        } else {
          setCallState("idle");
        }
      } finally {
        isProcessingRef.current = false;
        // Si no está reproduciendo voz tras 1s, regresar a idle
        setTimeout(() => {
          setCallState((st) => (st === "thinking" ? "idle" : st));
        }, 1000);
      }
    };

    reader.readAsDataURL(audioBlob);
  }, [activeMode, onMessageLogged, speakText]);

  // Iniciar grabación de micrófono
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
      setUserTranscript("Grabando tu voz... Tocá el botón rojo al terminar.");
    } catch (err) {
      console.error("[Microphone Access Error]:", err);
      alert("Por favor permite el acceso al micrófono para hablar con Nora.");
      setCallState("idle");
    }
  }, [processRecordedAudio, stopAssistantSpeech]);

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && callState === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [callState]);

  // Enviar texto manual
  const handleManualSubmit = useCallback(async () => {
    const text = manualText.trim();
    if (!text || isProcessingRef.current) return;

    stopAssistantSpeech();
    setManualText("");
    setUserTranscript(`"${text}"`);
    setAssistantText("");
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
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setAssistantText(full);
        }

        if (full.trim()) {
          historyRef.current.push({ role: "user", content: text });
          historyRef.current.push({ role: "assistant", content: full.trim() });
          if (onMessageLogged) onMessageLogged(text, full.trim());
          speakText(full.trim());
        }
      }
    } catch (e) {
      console.error("[Manual Submit Warn]:", e);
    } finally {
      isProcessingRef.current = false;
    }
  }, [activeMode, manualText, onMessageLogged, speakText, stopAssistantSpeech]);

  // Cleanup
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
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Voz Activa
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
                ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 shadow-purple-500/50 scale-100 animate-pulse"
                : callState === "speaking"
                ? "bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 shadow-cyan-500/50 scale-105 animate-pulse"
                : "bg-gradient-to-tr from-cyan-900 via-slate-800 to-teal-900 shadow-cyan-900/40 hover:scale-105 border border-cyan-500/30"
            }`}
          >
            <div className="absolute inset-1.5 rounded-full bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
              <span className="text-3xl mb-1">
                {callState === "recording"
                  ? "🔴"
                  : callState === "thinking"
                  ? "🧠"
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

          {/* Subtítulos de Nora y Respuesta en Vivo en Pantalla */}
          <div className="w-full mt-4 px-3 min-h-[64px] flex flex-col items-center justify-center">
            {callState === "recording" ? (
              <p className="text-xs text-rose-300 font-semibold animate-pulse">
                Escuchando... Hablale a Nora y volvé a tocar el botón al terminar.
              </p>
            ) : callState === "thinking" ? (
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                🧠 Nora está procesando tu respuesta...
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
              placeholder="O escribí acá para que Nora lo lea..."
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
