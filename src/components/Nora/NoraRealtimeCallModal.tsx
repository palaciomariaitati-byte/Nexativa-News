"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Sparkles, Volume2, VolumeX, Mic, Hand, Radio, AlertTriangle, Play, Send } from "lucide-react";
import { useNoraOfflineGPS } from "@/hooks/useNoraOfflineGPS";
import { dispatchSOS } from "@/lib/nora/protocols/sosDispatcher";
import { useNoraLazarilloHaptics } from "@/hooks/useNoraLazarilloHaptics";
import { executeLocalInference } from "@/lib/nora/webgpu/localEngine";

interface NoraRealtimeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceUri?: string;
  activeMode?: string;
  onMessageLogged?: (userText: string, assistantText: string) => void;
  initialHistory?: { role: string; content: string }[];
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function NoraRealtimeCallModal({
  isOpen,
  onClose,
  selectedVoiceUri,
  activeMode = "general",
  onMessageLogged,
  initialHistory = []
}: NoraRealtimeCallModalProps) {
  const { isOnline, coords } = useNoraOfflineGPS();
  const { emitSinglePulse, startDangerAlertLoop, clearHapticAlerts } = useNoraLazarilloHaptics();

  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking">("connecting");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [assistantText, setAssistantText] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTriggeringSOS, setIsTriggeringSOS] = useState<boolean>(false);
  const [typedMessage, setTypedMessage] = useState<string>("");

  // Modos de interacción y accesibilidad (Push-to-Talk por defecto para máxima estabilidad)
  const [interactionMode, setInteractionMode] = useState<"hands_free" | "push_to_talk">("push_to_talk");
  const interactionModeRef = useRef<"hands_free" | "push_to_talk">(interactionMode);
  const [isPushTalking, setIsPushTalking] = useState<boolean>(false);
  const [accessibleAnnouncement, setAccessibleAnnouncement] = useState<string>("Llamada con Nora. Toca Iniciar Conexión.");
  const [micError, setMicError] = useState<string | null>(null);

  // Control de estado y memoria de conversación
  const isNoraSpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const historyRef = useRef<{ role: string; content: string }[]>(initialHistory || []);

  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      historyRef.current = [...initialHistory];
    }
  }, [initialHistory]);
  const activeModeRef = useRef<string>(activeMode);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const liveTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);

  // Audio Pipeline Refs (Web Audio API Nativa)
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

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

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

  // 2. Temporizador de llamada
  useEffect(() => {
    let timer: any = null;
    if (isOpen && isEngineReady) {
      setCallDuration(0);
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isEngineReady]);

  // 3. Detener audio de Nora de forma absoluta y limpia
  const stopNoraSpeech = useCallback(() => {
    isNoraSpeakingRef.current = false;
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
      } catch {}
      currentAudioSourceRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearHapticAlerts();
  }, [clearHapticAlerts]);

  // Cierre limpio de llamada y liberación total de hardware
  const handleCleanExit = useCallback(() => {
    stopNoraSpeech();
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsEngineReady(false);
    onClose();
  }, [onClose, stopNoraSpeech]);

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

  // 5. Reproducción de Audio Real mediante Web Audio API (decodeAudioData)
  const playRealNoraAudio = useCallback(
    async (audioBase64: string, fullText: string) => {
      if (isMuted || !audioBase64) {
        resumeListening();
        return;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // 🛡️ EXCLUSIÓN MUTUA DE HARDWARE: Apagar micrófono antes de reproducir
      if (micGainNodeRef.current) {
        try {
          micGainNodeRef.current.gain.setValueAtTime(0, ctx.currentTime);
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
      setAssistantText(fullText);
      setAccessibleAnnouncement("Nora está respondiendo.");

      try {
        const arrayBuf = base64ToArrayBuffer(audioBase64);
        const audioBuffer = await ctx.decodeAudioData(arrayBuf);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        currentAudioSourceRef.current = source;

        // Al finalizar el audio de verdad
        source.onended = () => {
          isNoraSpeakingRef.current = false;
          currentAudioSourceRef.current = null;
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            resumeListening();
            playAccessibleChime("start");
          }, 300);
        };

        source.connect(ctx.destination);
        source.start(0);
      } catch (err) {
        console.error("[Web Audio Playback Error]:", err);
        resumeListening();
      }
    },
    [isMuted, playAccessibleChime, resumeListening, stopNoraSpeech]
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
          setTimeout(() => {
            window.location.href = result.smsUri!;
          }, 1500);
        }
      } catch (err: any) {
        console.warn("[SOS Trigger Warning]:", err);
        window.location.href = "tel:911";
      } finally {
        setIsTriggeringSOS(false);
      }
    },
    [coords, isOnline, startDangerAlertLoop]
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

          const spokenClientText = liveTranscriptRef.current.trim();
          liveTranscriptRef.current = "";

          let text = "";
          let resAudio: string | null = null;
          let transcribedUserText = spokenClientText;

          try {
            const res = await fetch("/api/noraitu-realtime-proxy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: spokenClientText,
                audioBase64: base64,
                mimeType,
                history: historyRef.current.slice(-24),
                mode: activeModeRef.current
              }),
              signal: controller.signal
            });

            if (res.ok) {
              const data = await res.json();
              text = data.text || "";
              resAudio = data.audioBase64 || null;
              transcribedUserText = data.transcribedUserText || spokenClientText;
            } else {
              throw new Error("HTTP_FAILED");
            }
          } catch (fetchErr: any) {
            console.warn("[Voice Modal] Red no disponible o error HTTP. Conmutando a Inferencia Local Offline...", fetchErr?.message);
            const userPrompt = spokenClientText || "Consulta docente por voz";
            const localRes = await executeLocalInference(
              userPrompt,
              historyRef.current,
              activeModeRef.current
            );
            text = localRes.text;
            transcribedUserText = userPrompt;
          }

          if (transcribedUserText && !transcribedUserText.includes("Escuchando")) {
            setUserTranscript(`"${transcribedUserText}"`);
            historyRef.current.push({ role: "user", content: transcribedUserText });

            if (/\b(emergencia|auxilio|socorro|me caí|me perdi|me perdí|ayuda urgente)\b/i.test(transcribedUserText)) {
              handleExecuteSOS(transcribedUserText);
              return;
            }
          }

          if (text) {
            historyRef.current.push({ role: "assistant", content: text });
            if (historyRef.current.length > 30) {
              historyRef.current = historyRef.current.slice(-30);
            }
            if (onMessageLogged) {
              onMessageLogged(transcribedUserText || "🎙️ [Voz]", text);
            }
            if (resAudio) {
              playRealNoraAudio(resAudio, text);
            } else {
              setAssistantText(text);
              setCallState("speaking");
              if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const cleanVoiceText = text.replace(/[*#_~`>|$\\]/g, "").slice(0, 350);
                const utter = new SpeechSynthesisUtterance(cleanVoiceText);
                utter.lang = "es-AR";
                utter.rate = 1.05;
                utter.onend = () => resumeListening();
                utter.onerror = () => resumeListening();
                window.speechSynthesis.speak(utter);
              } else {
                setTimeout(() => resumeListening(), 4000);
              }
            }
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
    [handleExecuteSOS, onMessageLogged, playAccessibleChime, playRealNoraAudio, resumeListening, stopNoraSpeech]
  );

  // 8. Inicialización Asíncrona Controlada por User Gesture (Tap Físico)
  const startUnifiedAudioEngine = useCallback(async () => {
    if (isEngineReady) return;
    setIsInitializing(true);
    setMicError(null);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = audioContextRef.current || new AudioCtx({ latencyHint: "interactive" });
      audioContextRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      // Stream de Micrófono con Fallback Progresivo Seguro
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (e1) {
        console.warn("[Mic Init with constraints failed, trying basic audio:true]:", e1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e2) {
          console.error("[Mic Access Denied / Not Available]:", e2);
          throw new Error("MIC_DENIED");
        }
      }

      if (!stream) throw new Error("MIC_DENIED");
      micStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);

      // GainNode de Control Permanente
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
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          return;
        }
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

          if (speechDuration > 300 && blob.size > 600) {
            sendVoiceAudioTurn(blob, mimeType);
          } else {
            setCallState("listening");
          }
        };

        recorder.start(80);
        mediaRecorderRef.current = recorder;
      };

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SILENCE_TIMEOUT_MS = 2200;
      const MAX_SPEECH_DURATION_MS = 60000;

      setIsEngineReady(true);
      setCallState("listening");
      setMicError(null);
      playAccessibleChime("connected");
      emitSinglePulse("CONFIRM_VOZ");
      setAccessibleAnnouncement("Conectado con Nora. Lista para escucharte.");

      // Inicializar SpeechRecognition nativo en paralelo si el navegador lo soporta
      if (typeof window !== "undefined") {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const rec = new SpeechRec();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "es-AR";
            rec.onresult = (e: any) => {
              let cur = "";
              for (let i = e.resultIndex; i < e.results.length; ++i) {
                cur += e.results[i][0].transcript;
              }
              if (cur.trim()) {
                liveTranscriptRef.current = cur.trim();
                setUserTranscript(`"${cur.trim()}"`);
              }
            };
            rec.onerror = () => {};
            try { rec.start(); } catch {}
            recognitionRef.current = rec;
          } catch {}
        }
      }

      let baselineCount = 0;
      let baselineSum = 0;

      const monitorAudioLoop = () => {
        if (!micStreamRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round(avg * 2.3)));

        if (baselineCount < 25) {
          baselineSum += avg;
          baselineCount++;
          noiseFloorRef.current = Math.max(10, Math.round(baselineSum / baselineCount));
        }

        if (isNoraSpeakingRef.current || isProcessingRef.current) {
          animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
          return;
        }

        if (interactionModeRef.current === "push_to_talk") {
          animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
          return;
        }

        const dynamicThreshold = Math.max(15, noiseFloorRef.current + 8);
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
              isSpeakingRef.current = false;
              silenceStartRef.current = null;
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
              }
            }
          }
        }

        if (isSpeakingRef.current && now - speechStartTimeRef.current > MAX_SPEECH_DURATION_MS) {
          isSpeakingRef.current = false;
          silenceStartRef.current = null;
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }

        animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
      };

      monitorAudioLoop();
    } catch (err: any) {
      console.warn("[Audio Engine Init Error]:", err);
      const msg = err?.name === "NotAllowedError" || err?.message === "MIC_DENIED"
        ? "Por favor permite el acceso al micrófono en tu navegador y vuelve a presionar el botón."
        : "No se pudo conectar el micrófono. Por favor verifica los permisos.";
      setMicError(msg);
      setIsEngineReady(false);
    } finally {
      setIsInitializing(false);
    }
  }, [emitSinglePulse, interactionMode, isEngineReady, playAccessibleChime, sendVoiceAudioTurn]);

  // Cleanup de seguridad al desmontar
  useEffect(() => {
    return () => {
      stopNoraSpeech();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stopNoraSpeech]);

  // 9. Controles Push-to-Talk con Desbloqueo Explícito
  const handlePushTalkStart = async () => {
    if (!isEngineReady) {
      await startUnifiedAudioEngine();
      return;
    }

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

  // 💬 Envío de texto dentro del Modo Voz sin perder el audio
  const handleSendTypedMessage = async () => {
    if (!typedMessage.trim() || callState === "thinking") return;
    const textToSend = typedMessage.trim();
    setTypedMessage("");

    if (callState === "speaking") stopNoraSpeech();
    setCallState("thinking");
    setUserTranscript(textToSend);
    setAccessibleAnnouncement(`Enviando: ${textToSend}`);

    if (onMessageLogged) {
      onMessageLogged(textToSend, "");
    }

    try {
      const res = await fetch("/api/noraitu-realtime-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyRef.current.slice(-6),
          mode: activeModeRef.current
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setAssistantText(data.text);
          historyRef.current.push({ role: "user", content: textToSend });
          historyRef.current.push({ role: "assistant", content: data.text });
          if (onMessageLogged) onMessageLogged(textToSend, data.text);

          if (data.audioBase64) {
            await playRealNoraAudio(data.audioBase64, data.text);
          } else {
            setAccessibleAnnouncement(data.text);
            resumeListening();
          }
        } else {
          resumeListening();
        }
      } else {
        resumeListening();
      }
    } catch (e) {
      console.warn("[Typed Voice Turn Error]:", e);
      resumeListening();
    }
  };

  // 🔄 Recuperación de AudioContext al volver a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && audioContextRef.current) {
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ⌨️ Accesibilidad por Teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        if (interactionMode === "push_to_talk" && !isPushTalking) {
          handlePushTalkStart();
        } else if (callState === "speaking") {
          stopNoraSpeech();
        }
      } else if (e.code === "Escape") {
        handleCleanExit();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && interactionMode === "push_to_talk" && isPushTalking && (e.target as HTMLElement)?.tagName !== "INPUT") {
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
  }, [isOpen, callState, interactionMode, isPushTalking, handleCleanExit, stopNoraSpeech]);

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

      <div className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-[#070b14] to-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col items-center justify-between min-h-[590px]">
        
        {/* Cabecera del Modal */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                Nora Realtime Voice
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">HD</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {isOnline ? "En Línea (Soberano)" : "Modo Offline"} • {formatDuration(callDuration)}
              </p>
            </div>
          </div>

          <button
            onClick={handleCleanExit}
            aria-label="Cerrar llamada"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Pantalla Previa de Conexión Segura si no se ha hecho tap */}
        {!isEngineReady ? (
          <div className="my-auto flex flex-col items-center justify-center w-full py-8 text-center space-y-5">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-500 flex items-center justify-center shadow-xl shadow-cyan-500/30 animate-pulse">
              <Sparkles size={40} className="text-slate-950" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="text-white font-bold text-base">Llamada de Voz con Nora</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toca el botón para activar el audio de alta fidelidad y hablar en tiempo real.
              </p>
              {micError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs text-center animate-fadeIn">
                  ⚠️ {micError}
                </div>
              )}
            </div>
            <button
              onClick={startUnifiedAudioEngine}
              disabled={isInitializing}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:opacity-90 active:scale-95 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play size={18} className="fill-slate-950" />
              <span>{isInitializing ? "Conectando micrófono..." : "Iniciar Llamada Segura"}</span>
            </button>
          </div>
        ) : (
          <>
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

            {/* Orb Central Reactivo */}
            <div className="flex-1 w-full flex flex-col items-center justify-center py-3">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-36 h-36 rounded-full transition-all duration-100 flex items-center justify-center ${
                    callState === "speaking"
                      ? "bg-gradient-to-tr from-cyan-400 via-emerald-400 to-teal-300 animate-pulse shadow-2xl shadow-cyan-500/50 scale-105"
                      : callState === "thinking"
                      ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 animate-spin shadow-2xl shadow-purple-500/50"
                      : isSpeakingRef.current || isPushTalking
                      ? "bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/40 scale-102"
                      : "bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-800 opacity-90"
                  }`}
                  style={{
                    transform: `scale(${1 + (audioLevel / 100) * 0.22})`
                  }}
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
              <div className="w-full mt-3 px-3 min-h-[65px] flex flex-col items-center justify-center">
                {callState === "thinking" ? (
                  <p className="text-xs text-purple-300 font-medium animate-pulse">
                    ⚡ Nora está pensando...
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
                  <div className="space-y-1 text-center">
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

              {/* Entrada de Texto Híbrida en Modo Voz */}
              <div className="w-full flex items-center gap-2 mt-2 px-1">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && typedMessage.trim()) {
                      handleSendTypedMessage();
                    }
                  }}
                  placeholder="Escribe aquí si prefieres tipear..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500 transition-colors"
                />
                <button
                  onClick={handleSendTypedMessage}
                  disabled={!typedMessage.trim() || callState === "thinking"}
                  className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 disabled:opacity-30 text-slate-950 font-bold transition-all cursor-pointer shrink-0 shadow-md shadow-cyan-500/20"
                  title="Enviar texto a Nora"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>

            {/* Modo Pulsar para Hablar */}
            {interactionMode === "push_to_talk" && (
              <div className="w-full flex justify-center py-1">
                <button
                  onMouseDown={handlePushTalkStart}
                  onMouseUp={handlePushTalkEnd}
                  onTouchStart={handlePushTalkStart}
                  onTouchEnd={handlePushTalkEnd}
                  className={`w-full py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    isPushTalking
                      ? "bg-emerald-500 text-slate-950 scale-98 shadow-emerald-500/30"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}
                >
                  <Mic size={16} className={isPushTalking ? "animate-pulse" : ""} />
                  <span>{isPushTalking ? "Nora te está escuchando..." : "Mantener presionado para hablar"}</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Barra Inferior */}
        <div className="w-full flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
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
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40 border border-rose-400/40 cursor-pointer transition-all animate-pulse"
            title="Activar Protocolo SOS Lazarillo"
          >
            <AlertTriangle size={14} />
            <span>{isTriggeringSOS ? "Enviando..." : "SOS AUXILIO"}</span>
          </button>

          <button
            onClick={handleCleanExit}
            aria-label="Finalizar llamada"
            className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Finalizar llamada"
          >
            <PhoneOff size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
