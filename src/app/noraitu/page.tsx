"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Menu, 
  X, 
  Copy, 
  Check, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Zap, 
  Code, 
  FileText, 
  TrendingUp, 
  ShieldCheck,
  Paperclip,
  Camera,
  Image as ImageIcon,
  FileSpreadsheet,
  XCircle,
  FileCheck2,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Download,
  Smartphone,
  Share2,
  QrCode,
  GraduationCap,
  BookOpen,
  Puzzle,
  MessageCircle,
  ExternalLink,
  Printer,
  Laptop,
  RefreshCw,
  Sliders,
  Eye,
  Video,
  FlipHorizontal,
  Radio
} from "lucide-react";
import { exportNoraCleanWord, exportNoraCleanPdf } from "@/lib/exportUtils";

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  base64?: string;
  previewUrl?: string;
  textContent?: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  file?: {
    name: string;
    type: string;
    previewUrl?: string;
  };
  created_at?: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function NoraItuApp() {
  const [userId, setUserId] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Estados de Grabación de Audio Directa (MediaRecorder)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const secondsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Estados de Notificaciones Push
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Estados de Voz Femenina Neutra (TTS)
  const [autoVoice, setAutoVoice] = useState(false);
  const [playingMsgIndex, setPlayingMsgIndex] = useState<number | null>(null);

  // Estados de Instalación PWA Nativa
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Estados de Compartir / Viralización WhatsApp y QR
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Estados de Sincronización Multi-Dispositivo (PC / Celular / Tablet)
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncInputId, setSyncInputId] = useState("");
  const [syncSuccessMsg, setSyncSuccessMsg] = useState("");

  // Voces Disponibles y Selección de Voz Neuronal
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>("");
  const [voicePitch, setVoicePitch] = useState<number>(0.92);
  const [voiceRate, setVoiceRate] = useState<number>(0.94);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Estados de Nora Titán Live Vision (Cámara y Audio en Vivo Full-Duplex)
  const [showLiveVisionModal, setShowLiveVisionModal] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [liveFacingMode, setLiveFacingMode] = useState<"user" | "environment">("environment");
  const [liveSubtitles, setLiveSubtitles] = useState<string>("Iniciando visión en vivo...");
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const [liveCustomPrompt, setLiveCustomPrompt] = useState<string>("");
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveMediaStreamRef = useRef<MediaStream | null>(null);
  const liveIntervalRef = useRef<any>(null);
  
  // Estado de Modo Adaptativo (General, Inclusión TEA, Docente, Cátedra)
  const [activeMode, setActiveMode] = useState<string>("general");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 1. Inicializar UUID de usuario, Sincronización Multi-dispositivo, Voz y PWA Prompt
  useEffect(() => {
    let storedUserId = "";

    // Detección de sincronización instantánea por parámetro URL (?sync_user=...)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const syncUser = urlParams.get("sync_user");
      if (syncUser && syncUser.trim()) {
        storedUserId = syncUser.trim();
        localStorage.setItem("noraitu_user_id", storedUserId);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        storedUserId = localStorage.getItem("noraitu_user_id") || "";
      }
    }

    if (!storedUserId) {
      storedUserId = "user_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
      localStorage.setItem("noraitu_user_id", storedUserId);
    }

    setUserId(storedUserId);
    fetchSessions(storedUserId);

    // Precargar voces del sistema operativo
    const loadSystemVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const vList = window.speechSynthesis.getVoices();
        const spanishVoices = vList.filter(v => v.lang.startsWith("es") || v.lang.includes("es-"));
        const finalVoices = spanishVoices.length > 0 ? spanishVoices : vList;
        setAvailableVoices(finalVoices);

        const savedVoiceUri = localStorage.getItem("noraitu_voice_uri");
        if (savedVoiceUri) {
          setSelectedVoiceUri(savedVoiceUri);
        } else {
          const defaultNeural = finalVoices.find(v => 
            v.name.toLowerCase().includes("sabina") || 
            v.name.toLowerCase().includes("dalia") || 
            v.name.toLowerCase().includes("natural") ||
            v.name.toLowerCase().includes("google español")
          );
          if (defaultNeural) setSelectedVoiceUri(defaultNeural.voiceURI);
        }
      }
    };

    loadSystemVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadSystemVoices;
    }

    // Recuperar preferencias de voz
    const savedVoice = localStorage.getItem("noraitu_auto_voice");
    if (savedVoice === "true") setAutoVoice(true);

    const savedPitch = localStorage.getItem("noraitu_voice_pitch");
    if (savedPitch) setVoicePitch(parseFloat(savedPitch));

    const savedRate = localStorage.getItem("noraitu_voice_rate");
    if (savedRate) setVoiceRate(parseFloat(savedRate));

    // Verificar permisos de notificaciones
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    // Detectar iOS y modo Standalone
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent.toLowerCase() : "";
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    const isStandalone = typeof window !== "undefined" && (
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true
    );

    // Registrar Service Worker de NoraItu para instalación nativa PWA en Chrome/Android
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/noraitu-sw.js", { scope: "/noraitu" })
        .then((reg) => console.log("NoraItu Service Worker activo:", reg.scope))
        .catch((err) => console.warn("NoraItu SW aviso:", err));
    }

    // Capturar evento de instalación nativa PWA (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      const dismissed = sessionStorage.getItem("noraitu_install_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Mostrar banner de instalación directo en móviles si no está instalada aún
    const dismissed = typeof window !== "undefined" ? sessionStorage.getItem("noraitu_install_dismissed") : null;
    let installTimer: any = null;
    if (!isStandalone && !dismissed) {
      installTimer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 1200);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (installTimer) clearTimeout(installTimer);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 2. Cargar sesiones del usuario
  const fetchSessions = async (uid: string) => {
    try {
      const res = await fetch(`/api/noraitu-sessions?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error cargando sesiones:", err);
    }
  };

  // 3. Cargar mensajes al cambiar de sesión
  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
    setIsLoading(true);
    stopSpeaking();
    try {
      const res = await fetch(`/api/noraitu-sessions?session_id=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Crear nuevo chat
  const handleNewChat = () => {
    stopSpeaking();
    setCurrentSessionId(null);
    setMessages([]);
    setInputMessage("");
    setAttachedFile(null);
    setSidebarOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // 5. Eliminar sesión
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Deseas eliminar esta conversación?")) return;

    try {
      const res = await fetch(`/api/noraitu-sessions?session_id=${encodeURIComponent(sessionId)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Error eliminando sesión:", err);
    }
  };

  // 6. Auto-scroll al fondo
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 7. Instalación Nativa PWA
  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredInstallPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      alert("Para instalar NoraItu, abre el menú de tu navegador y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("noraitu_install_dismissed", "true");
  };

  // 8. Sintetizador de Voz Femenina Neutra de NoraItu (TTS)
  const speakText = (text: string, msgIndex: number) => {
    if (!("speechSynthesis" in window)) return;

    // Si ya está sonando este mensaje, detenerlo
    if (playingMsgIndex === msgIndex) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    // Limpiar Markdown, emojis y corregir fonética para habla humana y natural
    const cleanText = text
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/```[\s\S]*?```/g, " Bloque de código. ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[(.*?)\]\([^\s)]+\)/g, "$1")
      .replace(/[-*]\s+/g, "")
      // Fonética y unidades en español natural
      .replace(/(\d+)\s*°\s*C/gi, "$1 grados centígrados")
      .replace(/(\d+)\s*°/g, "$1 grados")
      .replace(/km\/h/gi, " kilómetros por hora")
      .replace(/%/g, " por ciento")
      .replace(/mm\b/gi, " milímetros")
      .replace(/\$\s*(\d+)/g, "$1 pesos")
      .replace(/\bCUIT\b/gi, " cuit ")
      .replace(/\bIVA\b/gi, " iva ")
      .replace(/\bRAE\b/gi, " rae ")
      .replace(/\bTEA\b/gi, " tea ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "es-MX"; // Español neutro latinoamericano
    utterance.rate = voiceRate; // Velocidad calibrada por el usuario (def: 0.94)
    utterance.pitch = voicePitch; // Tono maduro, femenino y cálido (def: 0.92, NO niña robot)

    // Buscar y priorizar la voz seleccionada por el usuario o la mejor voz neuronal
    const voices = window.speechSynthesis.getVoices();
    let voiceToUse: SpeechSynthesisVoice | undefined = undefined;

    if (selectedVoiceUri) {
      voiceToUse = voices.find(v => v.voiceURI === selectedVoiceUri);
    }

    if (!voiceToUse) {
      const neuralKeywords = [
        "sabina", "dalia", "paulina", "natural", "google español", "elena", "monica", "hilda", "zira", "mexico", "argentina"
      ];
      voiceToUse = voices.find(v => 
        (v.lang.startsWith("es") || v.lang.includes("es-")) && 
        neuralKeywords.some(k => v.name.toLowerCase().includes(k))
      ) || voices.find(v => 
        (v.lang.startsWith("es") || v.lang.includes("es-")) && 
        (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("mujer"))
      ) || voices.find(v => v.lang.startsWith("es"));
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onend = () => setPlayingMsgIndex(null);
    utterance.onerror = () => setPlayingMsgIndex(null);

    setPlayingMsgIndex(msgIndex);
    window.speechSynthesis.speak(utterance);
  };

  const handleTestVoice = () => {
    stopSpeaking();
    if (!("speechSynthesis" in window)) return;
    const testText = "Hola, soy NoraItu, tu asistente de inteligencia artificial desarrollada por MyJ Nexora Visual. He calibrado mi dicción para brindarte un trato cercano, humano y profesional.";
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = "es-MX";
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;

    const voices = window.speechSynthesis.getVoices();
    let voiceToUse = selectedVoiceUri ? voices.find(v => v.voiceURI === selectedVoiceUri) : null;
    if (!voiceToUse) {
      voiceToUse = voices.find(v => (v.lang.startsWith("es") || v.lang.includes("es-")) && (v.name.toLowerCase().includes("sabina") || v.name.toLowerCase().includes("dalia") || v.name.toLowerCase().includes("natural"))) || voices.find(v => v.lang.startsWith("es"));
    }
    if (voiceToUse) utterance.voice = voiceToUse;

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingMsgIndex(null);
  };

  // 9. Motor de Visión y Audio en Vivo de Nora Titán (Cámara en Tiempo Real)
  const startLiveVision = async (facingMode: "user" | "environment" = liveFacingMode) => {
    stopSpeaking();
    setIsLiveStreaming(true);
    setLiveSubtitles("Activando cámara y visor neuronal de Nora Titán...");

    try {
      if (liveMediaStreamRef.current) {
        liveMediaStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      liveMediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }

      setLiveSubtitles("👁️ Nora Titán está observando en vivo. Apunta a lo que deseas analizar...");

      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
      // Primer análisis tras 1.5s de enfocar la cámara
      setTimeout(() => {
        captureAndAnalyzeFrame("Describe qué estás observando en esta toma en vivo y qué detalles útiles o educativos detectas.");
      }, 1500);

    } catch (err: any) {
      console.error("Error iniciando cámara en vivo:", err);
      setLiveSubtitles("⚠️ No se pudo acceder a la cámara. Por favor permite el acceso en tu navegador.");
    }
  };

  const handleLiveVoiceAsk = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("El reconocimiento de voz no está soportado en este navegador.");
      return;
    }

    try {
      stopSpeaking();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "es-AR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setLiveSubtitles("🎙️ Te escucho... Pregúntame sobre lo que estás mostrando.");

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setLiveCustomPrompt(transcript);
          captureAndAnalyzeFrame(transcript);
        }
      };

      recognition.onerror = () => {
        setLiveSubtitles("👁️ Nora sigue observando. Puedes pulsar 'Analizar' o escribir.");
      };

      recognition.start();
    } catch (err) {
      console.warn("Error en live voice:", err);
    }
  };

  const stopLiveVision = () => {
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    if (liveMediaStreamRef.current) {
      liveMediaStreamRef.current.getTracks().forEach(t => t.stop());
      liveMediaStreamRef.current = null;
    }
    setIsLiveStreaming(false);
    setIsAnalyzingFrame(false);
    setShowLiveVisionModal(false);
    stopSpeaking();
  };

  const toggleLiveCamera = () => {
    const nextMode = liveFacingMode === "environment" ? "user" : "environment";
    setLiveFacingMode(nextMode);
    startLiveVision(nextMode);
  };

  const captureAndAnalyzeFrame = async (customPrompt?: string) => {
    if (!liveVideoRef.current || isAnalyzingFrame) return;

    // Si Nora está hablando y es un escaneo automático, no cortarla
    if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking && !customPrompt) {
      return;
    }

    try {
      setIsAnalyzingFrame(true);
      const video = liveVideoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setIsAnalyzingFrame(false);
        return;
      }

      const canvas = liveCanvasRef.current || document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth, 800);
      canvas.height = Math.min(video.videoHeight, 600);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsAnalyzingFrame(false);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.6);

      const res = await fetch("/api/noraitu-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Image,
          userPrompt: customPrompt || liveCustomPrompt || "Describe qué estás observando en esta toma en vivo.",
          mode: activeMode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setLiveSubtitles(data.text);
          speakText(data.text, -99);
        }
      }
    } catch (err) {
      console.warn("Error analizando frame en vivo:", err);
    } finally {
      setIsAnalyzingFrame(false);
    }
  };

  const toggleAutoVoice = () => {
    const newVal = !autoVoice;
    setAutoVoice(newVal);
    localStorage.setItem("noraitu_auto_voice", String(newVal));
    if (!newVal) stopSpeaking();
  };

  // 9. Solicitar Permisos de Notificaciones Push
  const handleRequestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones web.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        new Notification("NoraItu AI", {
          body: "¡Notificaciones activadas! Te avisaremos cuando NoraItu termine de responder.",
          icon: "/icons/main-icon.png"
        });
      } else {
        setNotificationsEnabled(false);
      }
    } catch (err) {
      console.error("Error pidiendo notificaciones:", err);
    }
  };

  // 10. Iniciar Grabación de Audio por Micrófono (MediaRecorder Nativo)
  const startRecordingAudio = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Tu dispositivo o navegador no tiene acceso al micrófono.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/aac")) {
        mimeType = "audio/aac";
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerIntervalRef.current);
        const finalSecs = secondsRef.current;
        secondsRef.current = 0;
        setRecordingSeconds(0);
        setIsRecordingAudio(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size < 500) {
          alert("El audio fue demasiado breve. Por favor mantén presionado y habla con claridad.");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];

          handleSendAudioMessage({
            name: `Nota de Voz (${finalSecs}s).${mimeType.includes("mp4") ? "mp4" : "webm"}`,
            type: mimeType,
            size: audioBlob.size,
            base64: base64Data
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      secondsRef.current = 0;

      timerIntervalRef.current = setInterval(() => {
        secondsRef.current += 1;
        setRecordingSeconds(secondsRef.current);
      }, 1000);

    } catch (err: any) {
      console.error("Error accediendo al micrófono:", err);
      alert("No se pudo acceder al micrófono. Por favor permite el acceso en los ajustes de tu navegador.");
      setIsRecordingAudio(false);
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerIntervalRef.current);
        setRecordingSeconds(0);
        setIsRecordingAudio(false);
      };
      mediaRecorderRef.current.stop();
    }
  };

  // 11. Enviar Mensaje de Audio Directo con Streaming
  const handleSendAudioMessage = async (audioFile: AttachedFile) => {
    stopSpeaking();
    const tempUserMsg: Message = {
      role: "user",
      content: `🎙️ [Nota de voz enviada]`,
      file: {
        name: audioFile.name,
        type: audioFile.type
      },
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const msgId = "msg_audio_" + Date.now();
      const res = await fetch("/api/noraitu-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-message-id": msgId
        },
        body: JSON.stringify({
          message: "Escucha este audio del usuario y respóndele detalladamente.",
          session_id: currentSessionId,
          user_id: userId,
          message_id: msgId,
          contextData: { mode: activeMode },
          stream: true,
          file: {
            name: audioFile.name,
            mimeType: audioFile.type,
            base64: audioFile.base64
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `⚠️ ${errData.error || "No se pudo procesar el audio."}`,
          created_at: new Date().toISOString()
        }]);
        setIsLoading(false);
        return;
      }

      // Preparar burbuja de respuesta para streaming
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      }]);
      setIsLoading(false);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let sseBuffer = "";
      let updatedSessionId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataContent = trimmed.slice(6).trim();
              if (dataContent === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataContent);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) => {
                    const newArr = [...prev];
                    if (newArr.length > 0) {
                      newArr[newArr.length - 1] = {
                        ...newArr[newArr.length - 1],
                        content: accumulatedText
                      };
                    }
                    return newArr;
                  });
                }
                if (parsed.session_id) {
                  updatedSessionId = parsed.session_id;
                }
              } catch (e) {}
            }
          }
        }
      }

      if (updatedSessionId && updatedSessionId !== currentSessionId) {
        setCurrentSessionId(updatedSessionId);
        fetchSessions(userId);
      }

      // Reproducir voz al terminar el stream si autoVoice está activo
      if (autoVoice && accumulatedText) {
        speakText(accumulatedText, messages.length + 1);
      }

      // Notificación si la ventana está oculta
      if (document.hidden && Notification.permission === "granted" && accumulatedText) {
        new Notification("NoraItu AI", {
          body: accumulatedText.slice(0, 100) + "...",
          icon: "/icons/main-icon.png"
        });
      }

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error de conexión al enviar el audio.",
          created_at: new Date().toISOString()
        }
      ]);
      setIsLoading(false);
    }
  };

  // 12. Procesar archivos y fotos seleccionados
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("El archivo supera el límite de 15MB.");
      return;
    }

    const reader = new FileReader();

    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        setAttachedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64Data,
          previewUrl: file.type.startsWith("image/") ? result : undefined
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          textContent: reader.result as string
        });
      };
      reader.readAsText(file);
    }

    e.target.value = "";
  };

  // 13. Enviar Mensaje a NoraItu con Streaming en Tiempo Real
  const handleSendMessage = async (customPrompt?: string) => {
    stopSpeaking();
    const textToSend = customPrompt || inputMessage;
    if ((!textToSend.trim() && !attachedFile) || isLoading) return;

    const currentFile = attachedFile;
    const tempUserMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      file: currentFile ? {
        name: currentFile.name,
        type: currentFile.type,
        previewUrl: currentFile.previewUrl
      } : undefined,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage("");
    setAttachedFile(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const msgId = "msg_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
      const res = await fetch("/api/noraitu-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-message-id": msgId
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          session_id: currentSessionId,
          user_id: userId,
          message_id: msgId,
          contextData: { mode: activeMode },
          stream: true,
          file: currentFile ? {
            name: currentFile.name,
            mimeType: currentFile.type,
            base64: currentFile.base64,
            textContent: currentFile.textContent
          } : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `⚠️ ${errData.error || "Ocurrió un error temporal al procesar la respuesta."}`,
          created_at: new Date().toISOString()
        }]);
        setIsLoading(false);
        return;
      }

      // Preparar burbuja para streaming en vivo
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      }]);
      setIsLoading(false);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let sseBuffer = "";
      let updatedSessionId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataContent = trimmed.slice(6).trim();
              if (dataContent === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataContent);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) => {
                    const newArr = [...prev];
                    if (newArr.length > 0) {
                      newArr[newArr.length - 1] = {
                        ...newArr[newArr.length - 1],
                        content: accumulatedText
                      };
                    }
                    return newArr;
                  });
                }
                if (parsed.session_id) {
                  updatedSessionId = parsed.session_id;
                }
              } catch (e) {}
            }
          }
        }
      }

      if (updatedSessionId && updatedSessionId !== currentSessionId) {
        setCurrentSessionId(updatedSessionId);
        fetchSessions(userId);
      }

      // Si la voz automática está activa, hablar
      if (autoVoice && accumulatedText) {
        speakText(accumulatedText, messages.length + 1);
      }

      // Notificación en segundo plano
      if (document.hidden && Notification.permission === "granted" && accumulatedText) {
        new Notification("NoraItu AI", {
          body: accumulatedText.slice(0, 100) + "...",
          icon: "/icons/main-icon.png"
        });
      }

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error de conexión con el servidor de NoraItu. Reintenta en unos instantes.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
    }
  };

  // 14. Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // 15. Manejo de tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 16. Copiar texto al portapapeles
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper de formateo de Markdown y enlaces de compra ecommerce
  const formatMarkdownText = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-300 font-semibold">$1</strong>')
      .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium hover:scale-[1.02] transition-transform">$1 ↗</a>');
  };

  // Renderizador de Markdown con soporte de imágenes IA generadas, links de compra y código
  const renderMessageContent = (content: string, msgIndex: number) => {
    const imageRegex = /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 leading-relaxed text-sm md:text-[15px]">
        {parts.map((part, idx) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const codeLines = part.slice(3, -3).trim().split("\n");
            const lang = codeLines[0].trim();
            const code = (lang ? codeLines.slice(1) : codeLines).join("\n");
            const codeBlockId = `code_${msgIndex}_${idx}`;

            return (
              <div key={idx} className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#070a12] shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
                  <span>{lang || "código"}</span>
                  <button
                    onClick={() => handleCopy(code, codeBlockId)}
                    className="flex items-center gap-1.5 hover:text-sky-400 transition-colors"
                  >
                    {copiedId === codeBlockId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedId === codeBlockId ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-emerald-300/95 leading-snug">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          return (
            <div key={idx} className="space-y-2">
              {part.split("\n\n").map((paragraph, pIdx) => {
                // Detectar si el párrafo contiene una imagen generada por IA
                const imgMatch = [...paragraph.matchAll(imageRegex)];
                if (imgMatch.length > 0) {
                  return (
                    <div key={pIdx} className="my-3 space-y-3">
                      {imgMatch.map((m, mIdx) => {
                        const caption = m[1] || "Imagen Generada por NoraItu";
                        const imgUrl = m[2];
                        return (
                          <div key={mIdx} className="rounded-2xl overflow-hidden border border-sky-500/40 bg-slate-950/90 p-2.5 shadow-2xl space-y-2.5">
                            <div className="relative group rounded-xl overflow-hidden bg-black/50">
                              <img 
                                src={imgUrl} 
                                alt={caption} 
                                className="w-full max-h-96 object-contain rounded-xl mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                                loading="lazy" 
                              />
                            </div>
                            <div className="flex items-center justify-between px-2 py-1 text-xs">
                              <span className="font-medium text-slate-300 truncate max-w-[60%]">{caption}</span>
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download="noraitu_arte_ia.jpg"
                                className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all text-xs"
                              >
                                <Download size={13} />
                                <span>Descargar HD</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                      {paragraph.replace(imageRegex, "").trim() && (
                        <p 
                          className="text-slate-200"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdownText(paragraph.replace(imageRegex, "").trim())
                          }}
                        />
                      )}
                    </div>
                  );
                }

                if (paragraph.trim().startsWith("- ") || paragraph.trim().startsWith("* ")) {
                  const items = paragraph.split("\n");
                  return (
                    <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2 text-slate-200">
                      {items.map((item, iIdx) => (
                        <li key={iIdx}>
                          <span dangerouslySetInnerHTML={{
                            __html: formatMarkdownText(item.replace(/^[-*]\s+/, ""))
                          }} />
                        </li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p 
                    key={pIdx} 
                    className="text-slate-200"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownText(paragraph)
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#090d16] text-slate-100 font-sans overflow-hidden antialiased selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Inputs Ocultos de Archivos y Cámara */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* ================================================================= */}
      {/* 📱 BANNER / MODAL FLOTANTE DE INSTALACIÓN NATIVA PWA              */}
      {/* ================================================================= */}
      {showInstallBanner && (
        <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 z-50 max-w-md bg-slate-900/95 border border-sky-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30">
              <Smartphone size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-0.5">¿Instalar NoraItu en tu dispositivo?</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Úsala a pantalla completa como una app nativa con respuestas inmediatas y acceso directo.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallApp}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Instalar Ahora</span>
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Quizás más tarde
                </button>
              </div>
            </div>
            <button onClick={handleDismissInstall} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Guía para iPhone / iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center">
              <Share2 size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-base text-white">Instalar en iPhone / iPad</h3>
            <div className="text-left text-xs text-slate-300 space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <p>1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (icono de cuadrado con flecha hacia arriba).</p>
              <p>2. Desliza hacia abajo y selecciona <strong>"Agregar al inicio"</strong> (icono +).</p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📲 MODAL DE COMPARTIR, CÓDIGO QR Y VIRALIZACIÓN WHATSAPP         */}
      {/* ================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0c121e] border border-sky-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                <QrCode size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Recomendar NoraItu</h3>
              <p className="text-xs text-slate-400">
                Comparte la IA Soberana por WhatsApp o escanea el QR desde cualquier celular.
              </p>
            </div>

            {/* Código QR Generado en Tiempo Real */}
            <div className="p-4 bg-white rounded-2xl max-w-[210px] mx-auto shadow-inner border border-slate-700">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/noraitu` : "https://nexativanews.com.ar/noraitu")}&bgcolor=ffffff&color=090d16`}
                alt="Código QR de NoraItu"
                className="w-full h-auto rounded-lg mx-auto"
              />
            </div>

            <div className="space-y-2.5">
              {/* Botón Compartir Directo en WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Hola! Te recomiendo probar NoraItu, la IA Soberana desarrollada en Ituzaingó por MyJNexoraVisual. Transcribe audios, crea imágenes, traduce y planifica clases gratis: ${typeof window !== "undefined" ? `${window.location.origin}/noraitu` : "https://nexativanews.com.ar/noraitu"}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <MessageCircle size={18} />
                <span>Enviar por WhatsApp</span>
              </a>

              {/* Botón Copiar Enlace */}
              <button
                onClick={() => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/noraitu` : "https://nexativanews.com.ar/noraitu";
                  navigator.clipboard.writeText(url);
                  setCopiedShareLink(true);
                  setTimeout(() => setCopiedShareLink(false), 2500);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {copiedShareLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copiedShareLink ? "¡Enlace copiado al portapapeles!" : "Copiar Enlace Directo"}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Desarrollada por MyJNexoraVisual • Ituzaingó, Corrientes
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📱 SIDEBAR / HISTORIAL DE CONVERSACIONES                          */}
      {/* ================================================================= */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-80 bg-[#0c121e]/95 backdrop-blur-xl
        border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                NoraItu AI
              </h1>
              <p className="text-[10px] text-sky-400/80 font-mono">By MyJNexoraVisual</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botón Nuevo Chat */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-sky-600/20 hover:shadow-sky-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nuevo Chat</span>
          </button>

          {/* Botón Compartir / QR en Sidebar */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/70 text-emerald-300 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <QrCode size={14} className="text-emerald-400" />
              <span className="font-medium">Compartir / Código QR</span>
            </div>
            <Share2 size={12} className="text-emerald-400" />
          </button>

          {/* Botón Sincronizar con PC en Sidebar */}
          <button
            onClick={() => setShowSyncModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/70 text-indigo-300 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Laptop size={14} className="text-indigo-400" />
              <span className="font-medium">Sincronizar con PC</span>
            </div>
            <RefreshCw size={12} className="text-indigo-400" />
          </button>

          {/* Botón Instalar App en Sidebar */}
          <button
            onClick={handleInstallApp}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-sky-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Smartphone size={14} className="text-sky-400" />
              <span>Instalar App en Celular</span>
            </div>
            <Download size={12} className="text-sky-400" />
          </button>
        </div>

        {/* Botón Notificaciones Push */}
        <div className="px-3 pb-2">
          <button
            onClick={handleRequestNotifications}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-colors ${
              notificationsEnabled 
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300" 
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              {notificationsEnabled ? <BellRing size={14} className="text-emerald-400" /> : <Bell size={14} />}
              <span>{notificationsEnabled ? "Notificaciones Activas" : "Activar Notificaciones"}</span>
            </div>
            {notificationsEnabled && <Check size={12} className="text-emerald-400" />}
          </button>
        </div>

        {/* Lista de Sesiones */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Conversaciones Guardadas
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay chats guardados aún.
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`
                    group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-150
                    ${isActive 
                      ? "bg-sky-950/60 border border-sky-800/60 text-sky-200 font-medium shadow-inner" 
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"}
                  `}
                >
                  <span className="truncate pr-2">{sess.title}</span>
                  <button
                    onClick={(e) => deleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                    title="Eliminar conversación"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Sidebar */}
        <div className="p-3 border-t border-slate-800/70 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>100% Blindada</span>
          </div>
          <span className="text-[10px] font-mono text-slate-600">MyJNexoraVisual</span>
        </div>
      </aside>

      {/* Backdrop en Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ================================================================= */}
      {/* 💬 ÁREA PRINCIPAL DE CHAT                                         */}
      {/* ================================================================= */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-radial from-[#101827] via-[#090d16] to-[#06080e]">
        
        {/* Top Navbar Ultra-Limpia y Adaptable */}
        <header className="h-14 border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between bg-[#090d16]/90 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={19} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50 shrink-0" />
              <span className="font-bold text-sm text-slate-100 tracking-tight">NoraItu</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950/80 text-sky-400 border border-sky-800/40">
                Educación • Inclusión DUA
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Botón Nora Titán Live Vision */}
            <button
              onClick={() => {
                setShowLiveVisionModal(true);
                startLiveVision();
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-rose-500/20 active:scale-95 cursor-pointer shrink-0"
              title="Abrir Nora Titán Live (Cámara y Visión en Vivo)"
            >
              <Eye size={13} className="text-white shrink-0" />
              <span className="font-extrabold tracking-wide">Titán Live</span>
            </button>

            {/* Botón Sincronizar PC (Visible en tablet/desktop) */}
            <button
              onClick={() => setShowSyncModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 transition-colors shrink-0"
              title="Sincronizar tus conversaciones en PC o Celular"
            >
              <Laptop size={13} className="text-indigo-400" />
              <span className="hidden md:inline">Sincronizar</span>
            </button>

            {/* Botón Compartir / QR (Visible en tablet/desktop) */}
            <button
              onClick={() => setShowShareModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-colors shrink-0"
              title="Compartir NoraItu por WhatsApp o Código QR"
            >
              <QrCode size={13} className="text-emerald-400" />
              <span className="hidden md:inline">Compartir</span>
            </button>

            {/* Toggle de Voz Femenina Automática (Solo desktop o tablet grande) */}
            <button
              onClick={toggleAutoVoice}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                autoVoice 
                  ? "bg-sky-950/80 border-sky-700 text-sky-300" 
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title={autoVoice ? "Desactivar voz automática" : "Activar voz femenina automática"}
            >
              {autoVoice ? <Volume2 size={13} className="text-sky-400" /> : <VolumeX size={13} />}
              <span className="hidden lg:inline">{autoVoice ? "Voz: On" : "Voz: Off"}</span>
            </button>

            {/* Botón Calibrar y Afinar Voz de Nora (Dropdown/Modal) */}
            <button
              onClick={() => setShowVoiceModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors shrink-0"
              title="Afinar tono, velocidad y elegir voz de Nora"
            >
              <Sliders size={13} className="text-sky-400" />
              <span className="hidden lg:inline ml-1">Afinar Voz</span>
            </button>

            {/* Botón Nuevo Chat */}
            <button
              onClick={handleNewChat}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors shrink-0 flex items-center gap-1"
              title="Iniciar nuevo chat"
            >
              <Plus size={14} />
              <span className="hidden md:inline">Nuevo Chat</span>
            </button>
          </div>
        </header>

        {/* Contenedor de Mensajes */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {messages.length === 0 ? (
            /* Vista de Bienvenida Optimizada para Móvil y Desktop */
            <div className="max-w-xl mx-auto h-full flex flex-col items-center justify-center text-center px-2 sm:px-4 my-auto space-y-3 sm:space-y-4">
              
              {/* Logo e Identidad */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-2.5">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
                  Nora Titán Universal
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 max-w-sm mt-1">
                  Inteligencia Soberana de MyJNexoraVisual al servicio de la educación nacional.
                </p>
              </div>

              {/* Banner Titán Live Compacto */}
              <button
                onClick={() => {
                  setShowLiveVisionModal(true);
                  startLiveVision();
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-rose-950/70 via-purple-950/70 to-indigo-950/70 hover:from-rose-900/80 hover:to-indigo-900/80 border border-rose-500/40 flex items-center justify-between text-left transition-all shadow-md shadow-rose-950/30 group active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/30">
                    <Eye size={16} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      👁️ Nora Titán Live Vision
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] bg-rose-500 text-white font-mono uppercase">En Vivo</span>
                    </span>
                    <span className="text-[10px] text-rose-200/80 line-clamp-1">Apunta tu cámara a libros, pizarrones o planos</span>
                  </div>
                </div>
                <Radio size={15} className="text-rose-400 animate-pulse shrink-0 ml-1" />
              </button>

              {/* Selector de Modos de Adaptación (Scroll Horizontal Limpio en Móvil) */}
              <div className="w-full flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {[
                  { id: "general", label: "🌟 General" },
                  { id: "inclusion", label: "🧩 Inclusión TEA" },
                  { id: "docente", label: "🎓 Docente" },
                  { id: "catedra", label: "🏛️ Cátedra" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-all shrink-0 ${
                      activeMode === mode.id
                        ? "bg-sky-500 text-white border-sky-400 shadow-sm shadow-sky-500/30"
                        : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Banners Compartir y Sincronizar (1 fila compacta) */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/40 flex items-center gap-2 text-left transition-all group"
                >
                  <QrCode size={15} className="text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-emerald-300 block truncate">Recomendar / QR</span>
                    <span className="text-[9px] text-slate-400 hidden sm:block">Vía WhatsApp</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowSyncModal(true)}
                  className="p-2.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/40 flex items-center gap-2 text-left transition-all group"
                >
                  <Laptop size={15} className="text-indigo-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-indigo-300 block truncate">Sincronizar PC</span>
                    <span className="text-[9px] text-slate-400 hidden sm:block">Continuar en PC</span>
                  </div>
                </button>
              </div>

              {/* Grid de Sugerencias Compacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left pt-1">
                {[
                  { 
                    icon: Puzzle, 
                    title: "Explicación Inclusiva (TEA)", 
                    desc: "Lenguaje literal paso a paso", 
                    prompt: "Explícame de forma 100% literal y en pasos secuenciales qué es la inteligencia artificial y cómo funciona, sin usar metáforas ni ambigüedades." 
                  },
                  { 
                    icon: GraduationCap, 
                    title: "Planificación Docente & Rúbrica", 
                    desc: "Secuencia didáctica oficial y tabla", 
                    prompt: "Arma una planificación de clase para secundaria sobre el cuidado del agua en Corrientes, con objetivos, secuencia didáctica (inicio, desarrollo, cierre), grilla en tabla Markdown y rúbrica." 
                  },
                  { 
                    icon: BookOpen, 
                    title: "Cátedra y Doctrina", 
                    desc: "Marco teórico universitario", 
                    prompt: "Explica la teoría de la responsabilidad civil y el nexo causal con fundamentos doctrinarios del Código Civil y Comercial argentino." 
                  },
                  { 
                    icon: ImageIcon, 
                    title: "Generar Imagen con IA", 
                    desc: "Arte hiperrealista en 8k", 
                    prompt: "Crea una imagen hiperrealista en 8k de un atardecer sobre el Río Paraná en Ituzaingó, Corrientes." 
                  },
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-sky-500/40 text-left transition-all active:scale-[0.98] group flex items-start gap-2.5"
                  >
                    <card.icon size={16} className="text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {card.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Stream de Mensajes */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isSpeakingThis = playingMsgIndex === index;

                return (
                  <div 
                    key={msg.id || index}
                    className={`flex gap-3.5 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 mt-1">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}

                    <div className={`
                      max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 shadow-md
                      ${isUser 
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-xs" 
                        : "bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-xs backdrop-blur-xs"}
                    `}>
                      
                      {/* Vista previa de archivo o audio en mensaje */}
                      {msg.file && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-white/20 bg-black/30 p-2">
                          {msg.file.previewUrl ? (
                            <img 
                              src={msg.file.previewUrl} 
                              alt="Adjunto" 
                              className="max-h-56 rounded-lg object-contain mx-auto" 
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-mono text-sky-200 p-1">
                              {msg.file.type.startsWith("audio/") ? <Volume2 size={16} className="text-sky-400" /> : <FileText size={16} />}
                              <span className="truncate">{msg.file.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {renderMessageContent(msg.content, index)}
                      
                      {!isUser && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-400">NoraItu</span>
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                            {/* Botón Escuchar en Voz Femenina Neuronal */}
                            <button
                              onClick={() => speakText(msg.content, index)}
                              className={`flex items-center gap-1 transition-colors ${
                                isSpeakingThis ? "text-rose-400 font-semibold animate-pulse" : "hover:text-sky-400"
                              }`}
                              title={isSpeakingThis ? "Detener voz" : "Escuchar en voz femenina neutra"}
                            >
                              {isSpeakingThis ? <VolumeX size={13} /> : <Volume2 size={13} />}
                              <span>{isSpeakingThis ? "Detener" : "Escuchar"}</span>
                            </button>

                            {/* Botón Exportar Word (.doc) */}
                            <button
                              onClick={() => exportNoraCleanWord(`Documento_NoraItu_${index + 1}`, msg.content)}
                              className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
                              title="Descargar en formato Word (.doc) justificado y limpio de emojis"
                            >
                              <FileText size={13} className="text-indigo-400" />
                              <span>Word</span>
                            </button>

                            {/* Botón Imprimir / PDF */}
                            <button
                              onClick={() => exportNoraCleanPdf(`Informe_NoraItu_${index + 1}`, msg.content)}
                              className="flex items-center gap-1 hover:text-sky-300 transition-colors"
                              title="Imprimir o guardar en PDF formal justificado"
                            >
                              <Printer size={13} className="text-sky-400" />
                              <span>PDF</span>
                            </button>

                            {/* Botón Copiar */}
                            <button
                              onClick={() => handleCopy(msg.content, `msg_${index}`)}
                              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                              title="Copiar texto al portapapeles"
                            >
                              {copiedId === `msg_${index}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedId === `msg_${index}` ? "Copiado" : "Copiar"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                        <User size={16} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Indicador de Pensando */}
              {isLoading && (
                <div className="flex gap-3.5 items-center justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl px-4 py-3 text-xs text-sky-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-slate-400 ml-1 font-mono text-[11px]">NoraItu analizando...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Dock Fijo al Fondo */}
        <div className="p-3 md:p-4 bg-[#090d16]/90 backdrop-blur-md border-t border-slate-800/80">
          
          {/* Barra de Grabación de Audio Activa */}
          {isRecordingAudio ? (
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 bg-rose-950/80 border border-rose-600/70 rounded-2xl p-3 shadow-2xl animate-pulse">
              <div className="flex items-center gap-3 text-rose-200 text-sm">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-semibold font-mono">
                  Grabando Audio... 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecordingAudio}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                >
                  <X size={16} />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={stopRecordingAudio}
                  className="p-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-rose-600/30"
                >
                  <Send size={14} />
                  <span>Enviar Audio</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Chip de archivo adjunto previo a enviar */}
              {attachedFile && (
                <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-sky-500/40 rounded-xl text-xs text-sky-200">
                  {attachedFile.previewUrl ? (
                    <img src={attachedFile.previewUrl} alt="Thumb" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <FileText size={16} className="text-sky-400" />
                  )}
                  <span className="truncate flex-1">{attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)</span>
                  <button 
                    onClick={() => setAttachedFile(null)} 
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}

              <div className="max-w-3xl mx-auto relative flex items-end gap-1.5 bg-slate-900/90 border border-slate-700/70 focus-within:border-sky-500/80 rounded-2xl p-2 shadow-2xl transition-all">
                
                {/* Botón Adjuntar Archivo */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors"
                  title="Adjuntar PDF, Word, Excel o imagen"
                >
                  <Paperclip size={18} />
                </button>

                {/* Botón Cámara */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors"
                  title="Tomar foto con la cámara"
                >
                  <Camera size={18} />
                </button>

                {/* Botón Micrófono para Grabar Nota de Voz */}
                <button
                  onClick={startRecordingAudio}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                  title="Grabar nota de voz"
                >
                  <Mic size={18} />
                </button>

                {/* Textarea Auto-expandible */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={attachedFile ? "Escribe qué deseas analizar de este archivo..." : "Escribe o graba un audio para NoraItu..."}
                  disabled={isLoading}
                  className="flex-1 max-h-40 bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-[15px] resize-none focus:outline-hidden py-2 px-1 leading-relaxed"
                />

                {/* Botón Enviar */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                  className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    (inputMessage.trim() || attachedFile) && !isLoading
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}

          <div className="text-center mt-2 text-[10px] text-slate-500 flex flex-wrap items-center justify-center gap-1.5">
            <span>NoraItu AI</span>
            <span>•</span>
            <span>Tecnología desarrollada por <strong className="text-sky-400 font-medium">MyJNexoraVisual</strong></span>
            <span>•</span>
            <span>Ituzaingó, Corrientes</span>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* 📲 MODAL: COMPARTIR Y RECOMENDAR POR WHATSAPP & CÓDIGO QR         */}
      {/* ================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              <QrCode size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Compartir NoraItu AI</h3>
            <p className="text-xs text-slate-400 mb-4">
              Invita a otros a usar NoraItu para educación, inclusión DUA, planificación docente y documentos formales.
            </p>

            {/* Código QR Dinámico */}
            <div className="bg-white p-3 rounded-2xl inline-block mb-4 shadow-md">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fnexativanews.com.ar%2Fnoraitu"
                alt="QR NoraItu"
                className="w-44 h-44 mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <a
                href="https://api.whatsapp.com/send?text=%C2%A1Hola!%20Te%20recomiendo%20probar%20NoraItu%2C%20la%20inteligencia%20artificial%20de%20Ituzaing%C3%B3%20para%20educaci%C3%B3n%2C%20planificaci%C3%B3n%20docente%2C%20inclusi%C3%B3n%20DUA%20y%20documentos%20formales%3A%20https%3A%2F%2Fnexativanews.com.ar%2Fnoraitu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30"
              >
                <MessageCircle size={16} />
                <span>Compartir por WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://nexativanews.com.ar/noraitu");
                  setCopiedShareLink(true);
                  setTimeout(() => setCopiedShareLink(false), 2500);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {copiedShareLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedShareLink ? "¡Enlace Copiado al Portapapeles!" : "Copiar Enlace Directo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 💻 MODAL: SINCRONIZACIÓN MULTI-DISPOSITIVO (PC / CELULAR)          */}
      {/* ================================================================= */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-indigo-700/60 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowSyncModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
              <Laptop size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Sincronizar Celular con tu PC</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Escanea este código o abre el enlace en tu computadora para continuar tu trabajo sin perder el historial.
            </p>

            {/* QR de sincronización con tu ID */}
            <div className="bg-white p-3 rounded-2xl inline-block mb-3 shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/noraitu?sync_user=${userId}` : `https://nexativanews.com.ar/noraitu?sync_user=${userId}`)}`}
                alt="QR Sincronización"
                className="w-40 h-40 mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-3">
              {/* Botón copiar enlace de sincronización */}
              <button
                onClick={() => {
                  const syncUrl = typeof window !== "undefined" ? `${window.location.origin}/noraitu?sync_user=${userId}` : `https://nexativanews.com.ar/noraitu?sync_user=${userId}`;
                  navigator.clipboard.writeText(syncUrl);
                  setSyncSuccessMsg("¡Enlace de sincronización copiado! Pégalo o ábrelo en tu PC.");
                  setTimeout(() => setSyncSuccessMsg(""), 3000);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30"
              >
                <Copy size={14} />
                <span>Copiar Enlace de Sincronización para PC</span>
              </button>

              {/* Input manual de código */}
              <div className="pt-2 border-t border-slate-800 text-left">
                <p className="text-[11px] text-slate-400 mb-1.5">O ingresa el ID de tu otro dispositivo para vincularlo aquí:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={syncInputId}
                    onChange={(e) => setSyncInputId(e.target.value)}
                    placeholder="Ej: user_abc123..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (syncInputId.trim()) {
                        localStorage.setItem("noraitu_user_id", syncInputId.trim());
                        setUserId(syncInputId.trim());
                        fetchSessions(syncInputId.trim());
                        setSyncSuccessMsg("¡Dispositivo vinculado exitosamente!");
                        setTimeout(() => {
                          setSyncSuccessMsg("");
                          setShowSyncModal(false);
                        }, 1500);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Vincular
                  </button>
                </div>
              </div>

              {syncSuccessMsg && (
                <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-center gap-1.5 animate-fade-in">
                  <Check size={14} />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📱 BANNER FLOTANTE DE INSTALACIÓN PWA                             */}
      {/* ================================================================= */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-slate-900/95 border border-sky-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Instalar NoraItu en tu celular</h4>
              <p className="text-[10px] text-slate-400 truncate">Acceso rápido sin abrir navegador</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/30 transition-all"
            >
              Instalar
            </button>
            <button
              onClick={handleDismissInstall}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🍎 MODAL INSTRUCCIONES iOS SAFARI                                 */}
      {/* ================================================================= */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20">
              <Sparkles size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Instalar en iPhone / iPad</h3>
            <div className="text-xs text-slate-300 text-left space-y-2.5 mb-5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <p>1. Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en Safari.</p>
              <p>2. Desplázate hacia abajo y selecciona <strong>"Agregar a Inicio"</strong>.</p>
              <p>3. Toca <strong>"Agregar"</strong> arriba a la derecha y ¡listo!</p>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🎛️ MODAL: CALIBRADOR Y AFINADOR DE VOZ DE NORAITU               */}
      {/* ================================================================= */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-sky-700/60 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Sliders size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Calibrador de Voz de Nora</h3>
                <p className="text-xs text-slate-400">Personaliza la voz neuronal, el tono y la velocidad</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Selector de Voz */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Voz del Navegador / Sistema</label>
                <select
                  value={selectedVoiceUri}
                  onChange={(e) => {
                    setSelectedVoiceUri(e.target.value);
                    localStorage.setItem("noraitu_voice_uri", e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Control de Tono */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Tono (Grave y Maduro ↔ Agudo):</span>
                  <span className="font-mono text-sky-400">{voicePitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.10"
                  step="0.02"
                  value={voicePitch}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoicePitch(val);
                    localStorage.setItem("noraitu_voice_pitch", String(val));
                  }}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Más grave y cálido</span>
                  <span>Estándar (0.92)</span>
                  <span>Más agudo</span>
                </div>
              </div>

              {/* Control de Velocidad */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Velocidad de Lectura:</span>
                  <span className="font-mono text-sky-400">{voiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.15"
                  step="0.02"
                  value={voiceRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoiceRate(val);
                    localStorage.setItem("noraitu_voice_rate", String(val));
                  }}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Pausada y clara</span>
                  <span>Normal (0.94x)</span>
                  <span>Rápida</span>
                </div>
              </div>

              {/* Botón Probar Voz */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleTestVoice}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <Volume2 size={15} />
                  <span>▶️ Probar Esta Voz</span>
                </button>
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 👁️ MODAL: NORA TITÁN LIVE VISION (CÁMARA & VOZ FULL-DUPLEX)      */}
      {/* ================================================================= */}
      {showLiveVisionModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-fade-in">
          
          {/* Canvas oculto para capturas de frame */}
          <canvas ref={liveCanvasRef} className="hidden" />

          {/* Top Bar HUD */}
          <div className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shadow-lg shadow-rose-500/50" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Nora Titán Live
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 uppercase">En Vivo</span>
                </h3>
                <p className="text-[10px] text-slate-300 font-mono">Modo: {activeMode.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLiveCamera}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
                title="Cambiar Cámara (Frontal / Trasera)"
              >
                <FlipHorizontal size={18} />
              </button>

              <button
                onClick={stopLiveVision}
                className="p-2.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/40 cursor-pointer"
                title="Cerrar Live Vision"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Visor de Video en Tiempo Real con HUD Cyberpunk */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={liveVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${liveFacingMode === "user" ? "scale-x-[-1]" : ""}`}
            />

            {/* Retícula de enfoque táctico / radar */}
            <div className="absolute inset-8 sm:inset-16 pointer-events-none border border-rose-500/30 rounded-3xl flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-2 border-l-2 border-rose-400 rounded-tl-lg" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-rose-400 rounded-tr-lg" />
              </div>
              <div className="flex justify-center items-center">
                <div className={`w-20 h-20 rounded-full border-2 border-dashed border-rose-400/60 flex items-center justify-center ${isAnalyzingFrame ? "animate-spin border-rose-400" : "animate-pulse"}`}>
                  <Eye size={24} className="text-rose-400" />
                </div>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-2 border-l-2 border-rose-400 rounded-bl-lg" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-rose-400 rounded-br-lg" />
              </div>
            </div>

            {/* Badge de análisis en progreso */}
            {isAnalyzingFrame && (
              <div className="absolute top-6 px-4 py-1.5 rounded-full bg-black/80 border border-rose-500/60 text-rose-300 text-xs font-mono backdrop-blur-md flex items-center gap-2 animate-pulse">
                <Radio size={14} className="animate-spin" />
                <span>Nora está analizando lo que ve...</span>
              </div>
            )}
          </div>

          {/* Subtítulos y Controles Inferiores */}
          <div className="p-4 z-20 bg-gradient-to-t from-black via-black/90 to-transparent space-y-3">
            
            {/* Globo de Subtítulos de Nora */}
            <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-black/80 border border-rose-500/40 text-slate-100 text-xs sm:text-sm backdrop-blur-md shadow-2xl leading-relaxed text-center font-medium">
              <span className="text-rose-400 font-bold mr-1.5">Nora:</span>
              {liveSubtitles}
            </div>

            {/* Barra de Entrada / Pregunta Rápida */}
            <div className="max-w-xl mx-auto flex items-center gap-2">
              <button
                onClick={handleLiveVoiceAsk}
                className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-rose-400 hover:text-white transition-all backdrop-blur-md cursor-pointer shrink-0 shadow-md shadow-rose-500/10"
                title="Hablar por micrófono a Nora"
              >
                <Mic size={18} />
              </button>

              <input
                type="text"
                value={liveCustomPrompt}
                onChange={(e) => setLiveCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && liveCustomPrompt.trim()) {
                    captureAndAnalyzeFrame(liveCustomPrompt);
                    setLiveCustomPrompt("");
                  }
                }}
                placeholder="Pregúntale a Nora sobre lo que estás enfocando..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-rose-500 backdrop-blur-md"
              />

              <button
                onClick={() => {
                  captureAndAnalyzeFrame(liveCustomPrompt || "Explica detalladamente qué estás viendo en la cámara.");
                  if (liveCustomPrompt) setLiveCustomPrompt("");
                }}
                disabled={isAnalyzingFrame}
                className="p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Eye size={18} />
                <span className="hidden sm:inline">Analizar</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
