/* src/app/corresponsal-movil/page.tsx */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Square, Camera, CheckCircle, Settings, Radio, MapPin, Loader2, RefreshCw, X, AlertTriangle, Play } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SentReport {
  id: string;
  title: string;
  timestamp: string;
  status: string;
}

export default function CorresponsalMovilPage() {
  const supabase = getSupabaseBrowserClient();

  // Settings states
  const [corresponsalName, setCorresponsalName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Form states
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<string>("");
  const [locationLabel, setLocationLabel] = useState<string>("Detectando ubicación...");

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Status lists
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sentReports, setSentReports] = useState<SentReport[]>([]);
  const [refreshingReports, setRefreshingReports] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioIntervalRef = useRef<any>(null);
  const audioPlayRef = useRef<HTMLAudioElement | null>(null);

  // Load configuration and reports on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("corresponsal_name");
      const savedPin = localStorage.getItem("corresponsal_pin");
      const savedReports = localStorage.getItem("corresponsal_sent_reports");

      if (savedName) setCorresponsalName(savedName);
      if (savedPin) setPinCode(savedPin);

      // Verify PIN to unlock
      if (savedPin === "nexativa" || savedPin === "1234") {
        setIsLocked(false);
      }

      if (savedReports) {
        try {
          setSentReports(JSON.parse(savedReports));
        } catch {
          setSentReports([]);
        }
      }
    }

    // Capture location on load
    detectLocation();
  }, []);

  // Poll sent reports status from Supabase
  useEffect(() => {
    if (sentReports.length > 0 && !isLocked) {
      updateReportsStatus();
    }
  }, [isLocked]);

  const detectLocation = () => {
    setLocationLabel("Detectando GPS...");
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords(`${lat}, ${lng}`);
          setLocationLabel(`GPS Activo (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        },
        (err) => {
          console.error("GPS Error:", err);
          setCoords("-27.5973, -56.6874"); // Ituzaingo fallback
          setLocationLabel("Ituzaingó Centro (Fallo GPS)");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setCoords("-27.5973, -56.6874");
      setLocationLabel("Ituzaingó Centro (Sin GPS)");
    }
  };

  const handleUnlock = () => {
    if (pinCode.toLowerCase() === "nexativa" || pinCode === "1234") {
      localStorage.setItem("corresponsal_name", corresponsalName || "Corresponsal Móvil");
      localStorage.setItem("corresponsal_pin", pinCode);
      setIsLocked(false);
      setShowSettings(false);
    } else {
      alert("Código PIN Incorrecto. Solicita el PIN al administrador de Nexativa.");
    }
  };

  const handleSaveSettings = () => {
    if (!corresponsalName.trim()) {
      alert("Por favor ingresa tu nombre.");
      return;
    }
    localStorage.setItem("corresponsal_name", corresponsalName);
    setShowSettings(false);
    alert("Configuración guardada.");
  };

  const handleLogout = () => {
    localStorage.removeItem("corresponsal_pin");
    setPinCode("");
    setIsLocked(true);
  };

  // Image handling and downsizing
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 900;
          const MAX_HEIGHT = 900;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          }, "image/jpeg", 0.75);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
      setAttachedImagePreview(URL.createObjectURL(file));
    }
  };

  // Voice recording
  const startRecording = async () => {
    setRecordedAudio(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setRecordedAudio(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      audioIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert("Permiso de micrófono denegado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    }
  };

  const togglePlayAudio = () => {
    const audio = audioPlayRef.current;
    if (!audio) return;
    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.currentTime = 0;
      audio.play();
      setIsPlayingAudio(true);
    }
  };

  // Update reports status from DB
  const updateReportsStatus = async () => {
    if (sentReports.length === 0) return;
    setRefreshingReports(true);

    try {
      const ids = sentReports.map((r) => r.id);
      const { data, error } = await supabase
        .from("editorial_staging_queue")
        .select("id, status")
        .in("id", ids);

      if (data && !error) {
        const updated = sentReports.map((report) => {
          const matched = data.find((d) => d.id === report.id);
          return matched ? { ...report, status: matched.status } : report;
        });
        setSentReports(updated);
        localStorage.setItem("corresponsal_sent_reports", JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("Error refreshing statuses:", err);
    } finally {
      setRefreshingReports(false);
    }
  };

  // Submit report to review staging
  const handleSendReport = async () => {
    if (!inputText.trim() && !recordedAudio) {
      alert("Por favor escribe un reporte o graba un audio de voz.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);

    try {
      // 1. Upload photo if present
      let imageUrl = null;
      if (attachedImage) {
        const resizedBlob = await resizeImage(attachedImage);
        const fileName = `corresponsales/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(fileName, resizedBlob, { contentType: "image/jpeg" });

        if (uploadError) throw new Error("Fallo al subir foto: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append("operator_id", "a8b297ea-5d91-402c-91d4-88ca6e2f19f3"); // Default mobile UUID
      formData.append("corresponsal_name", corresponsalName || "Periodista Exteriores");
      formData.append("geolocation_coordinates", coords || "-27.5973, -56.6874");
      formData.append("raw_metadata_title", `Reporte Exteriores: ${corresponsalName || "Móvil"}`);
      formData.append("timestamp_utc", new Date().toISOString());

      if (inputText.trim()) {
        formData.append("draft_text", inputText.trim());
      }

      if (imageUrl) {
        formData.append("attached_media_url", JSON.stringify([imageUrl]));
      }

      if (recordedAudio) {
        formData.append("audio", recordedAudio, "reporte.webm");
      }

      // 3. Post to corresponsal route
      const res = await fetch("/corresponsal", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Fallo en el servidor");
      }

      // 4. Log sent report locally
      const newReport: SentReport = {
        id: resData.id,
        title: inputText.trim() ? inputText.substring(0, 30) + "..." : "[Reporte de voz de exteriores]",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: resData.status || "PENDING_REVIEW",
      };

      const updatedList = [newReport, ...sentReports].slice(0, 8); // Keep last 8 reports
      setSentReports(updatedList);
      localStorage.setItem("corresponsal_sent_reports", JSON.stringify(updatedList));

      // Reset form
      setInputText("");
      setAttachedImage(null);
      setAttachedImagePreview(null);
      setRecordedAudio(null);
      setAudioUrl(null);
      setSuccessMsg("¡Reporte enviado a redacción con éxito!");
      
      // Auto-detect GPS location for next report
      detectLocation();
    } catch (err: any) {
      alert("Error al enviar el reporte: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col font-sans relative">
      
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_40%)] pointer-events-none" />

      {/* Header bar */}
      <header className="bg-[#111625] border-b border-white/10 px-4 py-3.5 flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Radio className="text-red-500 w-5 h-5 animate-pulse" />
          <h1 className="font-bold text-sm tracking-wider uppercase text-gray-200">
            Reportero de Exteriores
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isLocked && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Lock screen dialog */}
      {isLocked ? (
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-[#111625] border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-xl text-center">
            <Radio className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Activar Terminal de Calle</h2>
              <p className="text-xs text-white/50">Ingresa tu identificación y el PIN provisto por la redacción.</p>
            </div>

            <div className="space-y-3 pt-2 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Tu Nombre de Corresponsal</label>
                <input
                  type="text"
                  value={corresponsalName}
                  onChange={(e) => setCorresponsalName(e.target.value)}
                  placeholder="Ej: Javier López Gómez"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">PIN de Acceso</label>
                <input
                  type="password"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Código PIN"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleUnlock}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-red-600/10 active:scale-95 transition-all cursor-pointer"
            >
              Conectarse a Redacción
            </button>
          </div>
        </div>
      ) : (
        <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 max-w-4xl mx-auto w-full">
          
          {/* Left Block: Reporting Tools */}
          <div className="flex-1 space-y-4 flex flex-col justify-between">
            
            {/* Context/Location card */}
            <div className="bg-[#111625] border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs text-white/70">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="text-red-500 w-4 h-4 shrink-0 animate-bounce" />
                <span className="truncate">{locationLabel}</span>
              </div>
              <button 
                onClick={detectLocation}
                className="text-red-400 hover:text-red-300 font-bold ml-2 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> GPS
              </button>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-4 bg-[#111625]/60 border border-white/5 p-4 rounded-2xl flex-grow flex flex-col justify-between">
              
              {/* Text Area */}
              <div className="space-y-1.5 flex-grow flex flex-col">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex justify-between">
                  <span>Reporte de Texto / Borrador</span>
                  <span className="text-white/40">{inputText.length} caracteres</span>
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe lo que está ocurriendo en el lugar de los hechos... (o envía un audio de voz)"
                  className="w-full flex-grow min-h-[140px] bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Media captures options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                
                {/* Audio voice notes button */}
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-600/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <Square className="w-6 h-6 animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-wide">Detener: {recordingSeconds}s</span>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Mic className="w-6 h-6 text-red-500" />
                    <span className="text-[10px] uppercase font-black text-gray-300 tracking-wide">Grabar Audio</span>
                  </button>
                )}

                {/* Instant Mobile Photo Trigger */}
                <label className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer text-center relative disabled:opacity-50">
                  <Camera className="w-6 h-6 text-purple-400" />
                  <span className="text-[10px] uppercase font-black text-gray-300 tracking-wide">Tomar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>

              {/* Previews of attached media */}
              <div className="flex flex-col gap-2">
                
                {/* Image attached preview */}
                {attachedImagePreview && (
                  <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/5 relative">
                    <img src={attachedImagePreview} className="w-12 h-12 object-cover rounded-lg" alt="Adjunto" />
                    <div className="flex-grow min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Foto Adjunta</p>
                      <p className="text-xs text-white truncate">{attachedImage?.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAttachedImage(null);
                        setAttachedImagePreview(null);
                      }}
                      className="text-red-400 p-1.5 hover:text-red-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Voice Note attached preview */}
                {audioUrl && (
                  <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/5 relative">
                    <audio
                      ref={audioPlayRef}
                      src={audioUrl}
                      onEnded={() => setIsPlayingAudio(false)}
                      className="hidden"
                    />
                    <button
                      onClick={togglePlayAudio}
                      className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 border border-red-500/25 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      {isPlayingAudio ? <Square className="w-4 h-4 text-red-400" /> : <Play className="w-4.5 h-4.5 fill-red-500" />}
                    </button>
                    <div className="flex-grow min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Reporte de voz grabado</p>
                      <p className="text-xs text-white">Audio del lugar ({recordingSeconds}s)</p>
                    </div>
                    <button
                      onClick={() => {
                        setRecordedAudio(null);
                        setAudioUrl(null);
                        setIsPlayingAudio(false);
                      }}
                      className="text-red-400 p-1.5 hover:text-red-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* Success message banner */}
            {successMsg && (
              <div className="bg-green-500/15 border border-green-500/25 p-3.5 rounded-xl text-xs text-green-300 font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              onClick={handleSendReport}
              disabled={loading || isRecording}
              className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redactando y subiendo reporte...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Reporte a Redacción 📤
                </>
              )}
            </button>

          </div>

          {/* Right Block: Live status feedback / logs */}
          <div className="w-full md:w-80 space-y-4">
            <div className="bg-[#111625] border border-white/10 p-4 rounded-2xl space-y-3.5 shadow-md">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Mis Reportes Recientes
                </h3>
                <button
                  onClick={updateReportsStatus}
                  disabled={refreshingReports || sentReports.length === 0}
                  className="text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingReports ? "animate-spin" : ""}`} />
                </button>
              </div>

              {sentReports.length === 0 ? (
                <p className="text-xs text-white/40 italic py-6 text-center">
                  Aún no has enviado reportes hoy. ¡Graba un audio o escribe para comenzar!
                </p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {sentReports.map((report) => (
                    <div 
                      key={report.id}
                      className="bg-black/30 border border-white/5 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-sans"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate leading-tight">{report.title}</p>
                        <p className="text-[9px] text-white/40 mt-0.5">{report.timestamp}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase shrink-0 ${
                        report.status === "PENDING_REVIEW"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                          : report.status === "PUBLISHED"
                          ? "bg-green-500/15 text-green-400 border border-green-500/25"
                          : "bg-gray-500/15 text-gray-400 border border-white/10"
                      }`}>
                        {report.status === "PENDING_REVIEW" ? "Pendiente" : report.status === "PUBLISHED" ? "Publicado" : report.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick guide card */}
            <div className="bg-[#111625] border border-white/10 p-4 rounded-2xl text-xs text-white/70 space-y-2 font-sans">
              <h4 className="font-bold text-gray-200">Guía del Corresponsal:</h4>
              <ul className="list-disc pl-4 space-y-1 text-white/60">
                <li>Graba audios del lugar para que Nora los transcriba y redacte automáticamente.</li>
                <li>Toma fotos de exteriores para enriquecer la noticia.</li>
                <li>Recuerda activar el GPS de tu celular al reportar.</li>
              </ul>
            </div>
          </div>

          {/* Config Settings Modal Overlay */}
          {showSettings && (
            <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
              <div className="bg-[#111625] border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-xl text-left font-sans">
                <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                  <h3 className="text-sm font-bold">Configuración de Dispositivo</h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre del Corresponsal</label>
                    <input
                      type="text"
                      value={corresponsalName}
                      onChange={(e) => setCorresponsalName(e.target.value)}
                      placeholder="Ej: Javier López Gómez"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-[10px] text-red-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <p>Cerrar sesión inhabilitará esta terminal de calle, requiriendo volver a ingresar el PIN de redacción.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-400 font-bold text-xs py-3 rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Cerrar Terminal
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="flex-1 bg-white hover:bg-gray-100 text-black font-bold text-xs py-3 rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
}
