"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Sparkles, Volume2, VolumeX, Mic, Hand, Radio, AlertTriangle } from "lucide-react";
import { useNoraOfflineGPS } from "@/hooks/useNoraOfflineGPS";
import { dispatchSOS } from "@/lib/nora/protocols/sosDispatcher";
import { useNoraLazarilloHaptics } from "@/hooks/useNoraLazarilloHaptics";

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
  const { isOnline, coords } = useNoraOfflineGPS();
  const { emitSinglePulse, startDangerAlertLoop, clearHapticAlerts } = useNoraLazarilloHaptics();

  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking">("connecting");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [assistantText, setAssistantText] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentVoice, setCurrentVoice] = useState<string>(selectedVoiceUri || "");
  const [isTriggeringSOS, setIsTriggeringSOS] = useState<boolean>(false);

  // Modos de interacción y accesibilidad
  const [interactionMode, setInteractionMode] = useState<"hands_free" | "push_to_talk">("hands_free");
  const [isPushTalking, setIsPushTalking] = useState<boolean>(false);
  const [accessibleAnnouncement, setAccessibleAnnouncement] = useState<string>("Iniciando llamada con Nora...");

  // Control de estado y memoria de conversación
  const isNoraSpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const activeModeRef = useRef<string>(activeMode);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Audio Pipeline Refs (Stream Único y Robusto)
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // VAD Calibrado Antirruido
  const isSpeakingRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number | null>(null);
  const noiseFloorRef = useRef<number>(14);
  const speechStartTimeRef = useRef<number>(0);
  const cooldownTimerRef = useRef<any>(null);

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
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "end") {
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(390, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "connected") {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
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

  // 3. Detener habla de Nora de forma absoluta y limpia
  const stopNoraSpeech = useCallback(() => {
    isNoraSpeakingRef.current = false;
    activeUtteranceRef.current = null;
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
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
    clearHapticAlerts();
  }, [clearHapticAlerts]);

  // 4. Reanudar escucha limpia tras delay de seguridad (Mute-on-Speak & Cooldown de 300ms)
  const resumeListening = useCallback(() => {
    isNoraSpeakingRef.current = false;
    isSpeakingRef.current = false;
    silenceStartRef.current = null;
    setCallState("listening");
    setAccessibleAnnouncement("Nora te escucha.");

    // Reactivar micrófono de forma limpia mediante GainNode y tracks
    if (micGainNodeRef.current && audioContextRef.current) {
      try {
        micGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
      } catch {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
    }
  }, []);

  // 5. Muteo Absoluto durante la Síntesis de Voz (Mute-on-Speak) y Delay de Seguridad
  const speakNoraResponse = useCallback(
    (fullText: string) => {
      if (isMuted || !fullText.trim()) {
        isNoraSpeakingRef.current = false;
        resumeListening();
        return;
      }

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        isNoraSpeakingRef.current = false;
        resumeListening();
        return;
      }

      // 🛡️ ACCIÓN 1: Muteo Absoluto de entrada (GainNode = 0 y track.enabled = false)
      if (micGainNodeRef.current && audioContextRef.current) {
        try {
          micGainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        } catch {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
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

      if (!cleanText) {
        resumeListening();
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      let voiceToUse = currentVoice ? voices.find((v) => v.voiceURI === currentVoice) : undefined;
      if (!voiceToUse) {
        voiceToUse =
          voices.find((v) => (v.lang.includes("AR") || v.lang.includes("419")) && !v.lang.includes("ES")) ||
          voices.find((v) => v.lang.startsWith("es"));
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

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

        // 🛡️ ACCIÓN 2: Reactivación Limpia con Delay de Seguridad de 300ms
        utterance.onend = () => {
          isNoraSpeakingRef.current = false;
          activeUtteranceRef.current = null;
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            resumeListening();
            playAccessibleChime("start");
          }, 300);
        };

        utterance.onerror = () => {
          isNoraSpeakingRef.current = false;
          activeUtteranceRef.current = null;
          resumeListening();
        };

        activeUtteranceRef.current = utterance;
        (window as any).__noraActiveUtterance = utterance;

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("[TTS Speech Error]:", e);
        resumeListening();
      }
    },
    [currentVoice, isMuted, playAccessibleChime, resumeListening, stopNoraSpeech]
  );

  // 6. Protocolo SOS Lazarillo Híbrido
  const handleExecuteSOS = useCallback(
    async (customNote?: string) => {
      setIsTriggeringSOS(true);
      startDangerAlertLoop();
      setAccessibleAnnouncement("Activando protocolo de auxilio y geolocalización SOS...");
      try {
        const result = await dispatchSOS({
          lat: coords?.lat,
          lng: coords?.lng,
          isOnline,
          customNote
        });

        if (result.method === "SMS" && result.smsUri) {
          speakNoraResponse(
            "Activando protocolo de emergencia por mensaje de texto con tus coordenadas satelitales a tu contacto de auxilio."
          );
          setTimeout(() => {
            window.location.href = result.smsUri!;
          }, 1500);
        } else {
          speakNoraResponse(
            "Alerta SOS transmitida con éxito con tu ubicación satelital a tu contacto de auxilio en Ituzaingó."
          );
        }
      } catch (err: any) {
        console.warn("[SOS Trigger Warning]:", err);
        window.location.href = "tel:911";
      } finally {
        setIsTriggeringSOS(false);
      }
    },
    [coords, isOnline, speakNoraResponse, startDangerAlertLoop]
  );

  // 7. Enviar audio con Telemetría
  const sendVoiceAudioTurn = useCallback(
    async (audioBlob: Blob, mimeType: string) => {
      if (isProcessingRef.current || audioBlob.size < 1200) {
        setCallState("listening");
        return;
      }

      const turnStartTime = Date.now();
      stopNoraSpeech();
      isProcessingRef.current = true;
      setCallState("thinking");
      setAccessibleAnnouncement("Nora está procesando...");
      playAccessibleChime("end");
      setUserTranscript("Escuchando tu consulta...");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = ((reader.result as string) || "").split(",")[1];
        if (!base64) {
          isProcessingRef.current = false;
          resumeListening();
          return;
        }

        try {
          const controller = new AbortController();
          abortControllerRef.current = controller;

          const res = await fetch("/api/noraitu-realtime-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType,
              history: historyRef.current.slice(-6),
              mode: activeModeRef.current
            }),
            signal: controller.signal
          });

          const sttMs = res.headers.get("x-stt-ms");
          const totalBackendMs = res.headers.get("x-total-ms");
          const transcribedHeader = res.headers.get("x-transcribed-user-text");
          const userText = transcribedHeader ? decodeURIComponent(transcribedHeader) : "";

          console.log(
            `⏱️ [Voice Telemetry] STT: ${sttMs || "?"}ms | Backend Total: ${totalBackendMs || "?"}ms | Cliente Total: ${Date.now() - turnStartTime}ms`
          );

          if (userText && !userText.startsWith("⚠️") && !userText.includes("Escuchando")) {
            setUserTranscript(`"${userText}"`);
            historyRef.current.push({ role: "user", content: userText });

            if (/\b(emergencia|auxilio|socorro|me caí|me perdi|me perdí|ayuda urgente)\b/i.test(userText)) {
              handleExecuteSOS(userText);
              return;
            }
          }

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
            if (historyRef.current.length > 12) {
              historyRef.current = historyRef.current.slice(-12);
            }
            if (onMessageLogged) {
              onMessageLogged(userText || "🎙️ [Voz]", trimmedAnswer);
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
      };

      reader.readAsDataURL(audioBlob);
    },
    [handleExecuteSOS, onMessageLogged, playAccessibleChime, resumeListening, speakNoraResponse, stopNoraSpeech]
  );

  // 8. Pipeline de Captura Acústica con Stream Permanente sin Titileo (Control por GainNode)
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

    async function startUnifiedAudioEngine() {
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

        // 🛡️ ACCIÓN 3: GainNode de Control Permanente (Muteo sin cerrar stream)
        const micGain = audioCtx.createGain();
        micGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        micGainNodeRef.current = micGain;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.2;

        source.connect(micGain);
        micGain.connect(analyser);
        analyserRef.current = analyser;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

        let recorder: MediaRecorder | null = null;

        const createAndStartRecorder = () => {
          audioChunksRef.current = [];
          speechStartTimeRef.current = Date.now();
          recorder = new MediaRecorder(stream, { mimeType });

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            const speechDuration = Date.now() - speechStartTimeRef.current;
            const blob = new Blob(audioChunksRef.current, { type: mimeType });

            // Solo enviar si la persona habló al menos 400ms y el audio tiene peso real
            if (speechDuration > 400 && blob.size > 1200) {
              sendVoiceAudioTurn(blob, mimeType);
            } else {
              setCallState("listening");
            }
          };

          recorder.start(80);
          mediaRecorderRef.current = recorder;
        };

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const SILENCE_TIMEOUT_MS = 600; // Silencio natural para cierre de turno

        setCallState("listening");
        playAccessibleChime("connected");
        emitSinglePulse("CONFIRM_VOZ");
        setAccessibleAnnouncement("Conectado con Nora. Lista para escucharte.");

        let baselineCount = 0;
        let baselineSum = 0;

        const monitorAudioLoop = () => {
          if (!isMounted) return;

          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round(avg * 2.3)));

          // Calibración adaptativa del piso de ruido
          if (baselineCount < 25) {
            baselineSum += avg;
            baselineCount++;
            noiseFloorRef.current = Math.max(10, Math.round(baselineSum / baselineCount));
          }

          // Si Nora está hablando o procesando, IGNORAR para evitar bucles de eco
          if (isNoraSpeakingRef.current || isProcessingRef.current) {
            animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
            return;
          }

          if (interactionMode === "push_to_talk") {
            animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
            return;
          }

          const dynamicThreshold = noiseFloorRef.current + 12;
          const now = Date.now();

          if (avg > dynamicThreshold) {
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
              } else if (now - silenceStartRef.current > SILENCE_TIMEOUT_MS) {
                // Silencio confirmado: cerrar turno de voz
                isSpeakingRef.current = false;
                silenceStartRef.current = null;
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  mediaRecorderRef.current.stop();
                }
              }
            }
          }

          animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
        };

        monitorAudioLoop();
      } catch (err) {
        console.error("[Audio Engine Init Error]:", err);
        alert("Por favor permite el acceso al micrófono para hablar con Nora.");
        onClose();
      }
    }

    startUnifiedAudioEngine();

    return () => {
      isMounted = false;
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [emitSinglePulse, interactionMode, isOpen, onClose, playAccessibleChime, sendVoiceAudioTurn, stopNoraSpeech]);

  // 9. Controles Push-to-Talk
  const handlePushTalkStart = () => {
    if (callState === "speaking") stopNoraSpeech();
    setIsPushTalking(true);
    emitSinglePulse("CONFIRM_VOZ");

    if (micStreamRef.current) {
      if (micGainNodeRef.current && audioContextRef.current) {
        micGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
      }
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(micStreamRef.current, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 1000) {
          sendVoiceAudioTurn(blob, mimeType);
        } else {
          setCallState("listening");
        }
      };

      recorder.start(80);
      mediaRecorderRef.current = recorder;
    }
  };

  const handlePushTalkEnd = () => {
    setIsPushTalking(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // ⌨️ Accesibilidad por Teclado
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
        
        {/* Cabecera Tipo Llamada */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-400/40 shadow-md shadow-cyan-500/20">
              <Sparkles size={18} className="text-cyan-300 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                Nora Voz Fluida
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 uppercase">
                  {interactionMode === "hands_free" ? "Manos Libres" : "Pulsar"}
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

        {/* Selector de Modo */}
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

        {/* Aura Dinámica Fluida */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-4 text-center">
          <div className="relative flex items-center justify-center w-44 h-44">
            <div
              className="absolute rounded-full bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-emerald-500/20 transition-transform duration-150 ease-out"
              style={{
                width: `${130 + (callState === "speaking" ? 35 : audioLevel * 0.6)}px`,
                height: `${130 + (callState === "speaking" ? 35 : audioLevel * 0.6)}px`,
                opacity: callState === "thinking" ? 0.3 : 0.8
              }}
            />

            <div
              className="absolute rounded-full bg-gradient-to-tr from-cyan-600/30 via-indigo-600/30 to-purple-600/30 transition-transform duration-180 ease-out"
              style={{
                width: `${110 + (callState === "speaking" ? 25 : audioLevel * 0.4)}px`,
                height: `${110 + (callState === "speaking" ? 25 : audioLevel * 0.4)}px`
              }}
            />

            {/* Núcleo Central */}
            <div
              className={`relative flex items-center justify-center w-28 h-28 rounded-full shadow-2xl transition-all duration-400 ${
                callState === "speaking"
                  ? "bg-gradient-to-tr from-cyan-400 via-teal-300 to-emerald-400 shadow-cyan-400/40 scale-105"
                  : callState === "thinking"
                  ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 shadow-purple-500/40 scale-95"
                  : isSpeakingRef.current || isPushTalking || audioLevel > 16
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

          {/* Subtítulos */}
          <div className="w-full mt-4 px-3 min-h-[85px] flex flex-col items-center justify-center">
            {callState === "thinking" ? (
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                ⚡ Nora está procesando...
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
                    ? "Hablá con libertad. Nora te escucha y te responde."
                    : "Pulsá cuando quieras hablar."}
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

        {/* Barra Inferior */}
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

          {/* Botón SOS Lazarillo Inmediato */}
          <button
            onClick={() => handleExecuteSOS("Solicitud manual de auxilio")}
            disabled={isTriggeringSOS}
            aria-label="Botón de emergencia SOS Lazarillo"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40 border border-rose-400/40 cursor-pointer transition-all animate-pulse"
            title="Activar Protocolo SOS Lazarillo"
          >
            <AlertTriangle size={14} />
            <span>{isTriggeringSOS ? "Enviando SOS..." : "SOS AUXILIO"}</span>
          </button>

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
