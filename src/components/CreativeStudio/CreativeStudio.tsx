"use client";

import React, { useState, useRef } from "react";
import { askNoraCreativeDirector, type CreativeDirectorResult } from "@/app/admin/actions/nora";
import { Sparkles, RefreshCw, CheckCircle, AlertCircle, Loader2, MessageSquare, Video, Image as ImageIcon, Film } from "lucide-react";

// --- Types & Constants ---
const STYLES = [
  { id: "surreal_urban", label: "🏙️ Gigantismo Urbano", desc: "Objeto monumental en la ciudad" },
  { id: "surreal_magic", label: "✨ Historia Mágica", desc: "Irrupción mágica en escena cotidiana" },
  { id: "cinematic", label: "🎬 Spot Cinematográfico", desc: "Ángulo dramático, luz de película" },
  { id: "luxury", label: "💎 Lujo & Gala", desc: "Escultura de alto diseño editorial" },
  { id: "anamorphic", label: "🌐 Anamórfico 3D", desc: "Ilusión de pantalla LED gigante" },
] as const;

const FORMATS = [
  { id: "9:16", label: "📱 9:16 Vertical", sub: "Reels / TikTok / Stories" },
  { id: "1:1", label: "🟦 1:1 Cuadrado", sub: "Instagram / Feed FB" },
  { id: "16:9", label: "🖥️ 16:9 Horizontal", sub: "Banners / YouTube" },
  { id: "3:1", label: "🏙️ 3:1 Megabanner", sub: "Cabeceras / Gigantografías" },
] as const;

type OutputType = "video" | "image";
type GenerationPhase = "idle" | "consulting-nora" | "waiting-answer" | "generating" | "uploading" | "done" | "error";

interface ConversationMessage {
  role: "user" | "nora";
  content: string;
}

interface CreativeStudioProps {
  brandName?: string;
  clientLogoUrl?: string;
  onImageGenerated: (url: string, copyAida: string) => void;
  onOpenVideoCreator?: (url: string, copyAida: string) => void;
}

// --- Helper: Phase progress bar ---
function PhaseIndicator({ phase, outputType }: { phase: GenerationPhase; outputType: OutputType }) {
  const phases: { key: GenerationPhase; label: string }[] = [
    { key: "consulting-nora", label: "🧠 Nora interpreta el brief..." },
    { key: "generating", label: outputType === "video" ? "🎬 Motor de Video Faux-CGI (Wan 2.1 GPU) procesando fotogramas..." : "🎨 Motor de Imagen IA activo..." },
    { key: "uploading", label: "☁️ Guardando el MP4 en tu servidor..." },
    { key: "done", label: "✅ ¡Spot de Video Listo!" },
  ];

  if (phase === "idle" || phase === "waiting-answer" || phase === "error") return null;

  const currentIndex = phases.findIndex((p) => p.key === phase);
  const current = phases[Math.max(0, currentIndex)];

  return (
    <div className="flex items-center gap-3 bg-black/60 border border-pink-500/40 rounded-xl px-4 py-3.5 mt-4 shadow-lg animate-pulse">
      <Loader2 className={`w-5 h-5 text-pink-400 shrink-0 ${phase !== "done" ? "animate-spin" : ""}`} />
      <div className="flex-1">
        <p className="text-xs font-black text-pink-300 uppercase tracking-wider">{current?.label}</p>
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / phases.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function CreativeStudio({ 
  brandName, 
  clientLogoUrl, 
  onImageGenerated,
  onOpenVideoCreator
}: CreativeStudioProps) {
  const [brief, setBrief] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("video"); // Default to Video for maximum impact
  const [style, setStyle] = useState<string>("surreal_urban");
  const [format, setFormat] = useState<string>("9:16"); // Default to Reels format
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [noraResult, setNoraResult] = useState<CreativeDirectorResult | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  const [mediaSource, setMediaSource] = useState<string>("");
  const lastSeed = useRef<number | null>(null);

  const resetSession = () => {
    setBrief("");
    setPhase("idle");
    setError(null);
    setNoraResult(null);
    setPendingAnswer("");
    setConversation([]);
    setGeneratedMediaUrl(null);
    setMediaSource("");
    lastSeed.current = null;
  };

  const handleConsultNora = async (userMessage: string, history: ConversationMessage[]) => {
    if (!userMessage.trim()) return;
    setPhase("consulting-nora");
    setError(null);

    const newHistory: ConversationMessage[] = [...history, { role: "user", content: userMessage }];
    setConversation(newHistory);

    const result = await askNoraCreativeDirector(
      userMessage,
      "Operador",
      history.map((m) => ({ role: m.role, content: m.content }))
    );

    if ("error" in result) {
      setError(result.error);
      setPhase("error");
      return;
    }

    const data = result.data;
    setNoraResult(data);

    if (data.brief.style && STYLES.find((s) => s.id === data.brief.style)) {
      setStyle(data.brief.style);
    }

    const updatedHistory: ConversationMessage[] = [...newHistory, { role: "nora", content: data.htmlForPanel }];
    setConversation(updatedHistory);

    if (data.missing_critical) {
      setPhase("waiting-answer");
    } else {
      await handleGenerate(data.surrealismPrompt, data.brief.style || style, format, outputType);
    }
  };

  const handleGenerate = async (prompt: string, selectedStyle: string, selectedFormat: string, targetType: OutputType) => {
    setPhase("generating");
    setGeneratedMediaUrl(null);

    try {
      const seed = Math.floor(Math.random() * 1_000_000);
      lastSeed.current = seed;

      const endpoint = targetType === "video" ? "/api/creative-studio/generate-video" : "/api/creative-studio/generate";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: selectedStyle, aspectRatio: selectedFormat, seed }),
      });

      setPhase("uploading");
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || "Error al generar material creativo");

      const url = data.videoUrl || data.imageUrl;
      setGeneratedMediaUrl(url);
      setMediaSource(data.source);
      setPhase("done");
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    }
  };

  const handleRegenerate = async () => {
    if (!noraResult?.surrealismPrompt) return;
    await handleGenerate(noraResult.surrealismPrompt, style, format, outputType);
  };

  const handleUseMedia = () => {
    if (!generatedMediaUrl || !noraResult) return;
    onImageGenerated(generatedMediaUrl, noraResult.copy_aida || "");
  };

  const handleAnswerQuestion = async () => {
    if (!pendingAnswer.trim() || !noraResult) return;
    const answer = pendingAnswer.trim();
    setPendingAnswer("");
    await handleConsultNora(answer, conversation);
  };

  return (
    <div className="bg-gradient-to-br from-purple-950/40 via-pink-950/20 to-black/80 border border-purple-500/40 rounded-2xl p-5 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-pink-400 animate-pulse" />
          <span className="text-xs uppercase font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-300">
            Estudio Faux-CGI 3D & Videos Surrealistas · Nora AI
          </span>
        </div>
        {brandName && (
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-lg">
            {clientLogoUrl && <img src={clientLogoUrl} alt="Logo" className="w-4 h-4 object-contain rounded" />}
            <span className="text-[10px] text-purple-300 font-bold uppercase">{brandName}</span>
          </div>
        )}
      </div>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {conversation.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "nora" ? "flex-row" : "flex-row-reverse"}`}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                  msg.role === "nora"
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                }`}
              >
                {msg.role === "nora" ? "N" : "V"}
              </div>
              {msg.role === "nora" ? (
                <div
                  className="flex-1 text-xs text-white/80 bg-white/5 rounded-xl px-3 py-2 leading-relaxed nora-html-panel"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              ) : (
                <div className="flex-1 text-xs text-white/70 bg-purple-900/20 rounded-xl px-3 py-2 leading-relaxed text-right">
                  {msg.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Brief Input (initial state) */}
      {phase === "idle" && (
        <div className="space-y-4">
          
          {/* Selector de Formato de Salida: Video MP4 vs Imagen Fija */}
          <div>
            <label className="text-[11px] font-extrabold text-pink-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-pink-400" />
              Tipo de Producción Publicitaria:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutputType("video")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  outputType === "video"
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black border-pink-400 shadow-lg shadow-pink-500/30 scale-[1.02]"
                    : "bg-black/50 text-gray-300 border-white/10 hover:bg-white/5"
                }`}
              >
                <Video className="w-4 h-4" />
                <div className="text-left">
                  <span className="text-xs font-black block">🎥 Video Spot Faux-CGI (.mp4)</span>
                  <span className="text-[9px] opacity-80 block font-normal">Ideal para Reels, TikTok y YouTube Shorts</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutputType("image")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  outputType === "image"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black border-amber-400 shadow-lg shadow-amber-500/30 scale-[1.02]"
                    : "bg-black/50 text-gray-300 border-white/10 hover:bg-white/5"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <div className="text-left">
                  <span className="text-xs font-black block">🖼️ Imagen Gigantografía Fija</span>
                  <span className="text-[9px] opacity-80 block font-normal">Para banners estáticos e impresión</span>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide block">
              <MessageSquare className="inline w-3 h-3 mr-1" />
              Escribe el brief o idea creativa para el spot:
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="Ej: &quot;Quiero un gato gigante caminando sobre los edificios de la avenida principal, luego salta y vuelve a su tamaño real frente a un plato de comida.&quot;"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500 resize-none placeholder:text-white/30 leading-relaxed"
            />
          </div>

          {/* Style Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Estilo Visual Surrealista:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    style === s.id
                      ? "bg-pink-600 text-white font-bold border-pink-400 shadow-md shadow-pink-500/20"
                      : "bg-black/40 text-gray-300 border-white/10 hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold block">{s.label}</span>
                  <span className="text-[10px] font-normal opacity-70 mt-0.5 block">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Formato de Video / Pantalla:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    format === f.id
                      ? "bg-purple-600 text-white font-bold border-purple-400 shadow-md"
                      : "bg-black/40 text-gray-300 border-white/10 hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold block">{f.label}</span>
                  <span className="text-[9px] font-normal opacity-70 mt-0.5 block">{f.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!brief.trim()}
            onClick={() => handleConsultNora(brief, [])}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm px-6 py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            {outputType === "video" ? <Video className="w-5 h-5 animate-bounce" /> : <Sparkles className="w-5 h-5" />}
            {outputType === "video" ? "Generar Spot de Video Faux-CGI (.mp4) 🎬" : "Crear Gigantografía Fija ✨"}
          </button>
        </div>
      )}

      {/* Nora is waiting for an answer */}
      {phase === "waiting-answer" && noraResult?.missing_critical && (
        <div className="space-y-3">
          <div className="bg-pink-500/10 border border-pink-500/40 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-pink-300 mb-1 uppercase tracking-wider">Nora necesita saber:</p>
            <p className="text-sm text-white/90">{noraResult.missing_critical}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={pendingAnswer}
              onChange={(e) => setPendingAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnswerQuestion()}
              placeholder="Tu respuesta..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-pink-500"
            />
            <button
              type="button"
              onClick={handleAnswerQuestion}
              disabled={!pendingAnswer.trim()}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Responder
            </button>
          </div>
        </div>
      )}

      {/* Phase Indicator */}
      <PhaseIndicator phase={phase} outputType={outputType} />

      {/* Error State */}
      {phase === "error" && error && (
        <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-300 uppercase tracking-wider mb-1">Error</p>
            <p className="text-xs text-red-200/80">{error}</p>
            <button
              type="button"
              onClick={resetSession}
              className="mt-2 text-[10px] uppercase font-bold text-red-300 hover:text-red-200 underline cursor-pointer"
            >
              Empezar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Done State — Video / Image Preview */}
      {phase === "done" && generatedMediaUrl && (() => {
        const isActualVideo = Boolean(
          (generatedMediaUrl.match(/\.(mp4|webm|ogg)$/i) || generatedMediaUrl.includes("video-proxy")) &&
          !generatedMediaUrl.match(/\.(jpg|jpeg|png|webp)$/i)
        );
        const videoSrc = (isActualVideo && generatedMediaUrl.startsWith("http") && !generatedMediaUrl.includes("/api/video-proxy"))
          ? `/api/video-proxy?url=${encodeURIComponent(generatedMediaUrl)}`
          : generatedMediaUrl;

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="relative rounded-2xl overflow-hidden border border-pink-500/50 bg-black shadow-2xl group">
              {/* Contenedor Visual Cinemático con Animación de Cámara 3D Constante */}
              <div className="relative overflow-hidden aspect-video max-h-[480px] w-full bg-slate-950 flex items-center justify-center">
                <img 
                  src={generatedMediaUrl} 
                  alt="Spot Faux-CGI 3D" 
                  className="w-full h-full object-cover animate-pulse transition-all duration-1000 scale-105"
                  style={{
                    animation: "cinematicMotion 8s ease-in-out infinite alternate"
                  }}
                />

                {/* Capa de atmósfera cinemática y resplandor */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(236,72,153,0.15),transparent_60%)] pointer-events-none animate-pulse" />

                {/* Textos y Guión Comercial Sobreimpresos (Estilo Reel / Spot Publicitario) */}
                {noraResult?.copy_aida && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/15 space-y-1.5 shadow-2xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                        🎬 Guión Comercial AIDA
                      </span>
                      <span className="text-[10px] text-pink-300 font-bold">
                        {brandName || "Nexativa Spot"}
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-medium line-clamp-2 leading-relaxed drop-shadow">
                      {noraResult.copy_aida}
                    </p>
                  </div>
                )}
              </div>

              {/* Estilos CSS para el movimiento de cámara Dron 3D constante */}
              <style jsx>{`
                @keyframes cinematicMotion {
                  0% {
                    transform: scale(1) translate(0%, 0%);
                  }
                  50% {
                    transform: scale(1.1) translate(-1.5%, -1%);
                  }
                  100% {
                    transform: scale(1.05) translate(1.5%, 1%);
                  }
                }
              `}</style>

              {/* Badges de Estado Superior */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <div className="bg-black/85 backdrop-blur-md text-[10px] uppercase font-black text-pink-300 px-3 py-1 rounded-full border border-pink-500/50 shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                  <span>Spot Faux-CGI 3D Activo</span>
                </div>
              </div>

              {brandName && (
                <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{brandName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleRegenerate}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerar variación
              </button>
              
              {onOpenVideoCreator && (
                <button
                  type="button"
                  onClick={() => {
                    handleUseMedia();
                    onOpenVideoCreator(generatedMediaUrl, noraResult?.copy_aida || "");
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl animate-pulse"
                >
                  <Film className="w-4 h-4" />
                  <span>Editar Spot con Música & Efectos 🎥</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleUseMedia}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Usar en Campaña ✓
              </button>
            </div>

            <button
              type="button"
              onClick={resetSession}
              className="w-full text-[10px] uppercase font-bold text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            >
              Crear nueva campaña audiovisual
            </button>
          </div>
        );
      })()}
    </div>
  );
}
