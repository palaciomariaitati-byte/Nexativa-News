"use client";

import React, { useState, useRef } from "react";
import { askNoraCreativeDirector, type CreativeDirectorResult } from "@/app/admin/actions/nora";
import { Sparkles, RefreshCw, CheckCircle, AlertCircle, Loader2, MessageSquare, Image as ImageIcon } from "lucide-react";

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

type GenerationPhase = "idle" | "consulting-nora" | "waiting-answer" | "generating" | "uploading" | "done" | "error";

interface ConversationMessage {
  role: "user" | "nora";
  content: string;
}

interface CreativeStudioProps {
  brandName?: string;
  clientLogoUrl?: string;
  onImageGenerated: (url: string, copyAida: string) => void;
}

// --- Helper: Phase progress bar ---
function PhaseIndicator({ phase }: { phase: GenerationPhase }) {
  const phases: { key: GenerationPhase; label: string }[] = [
    { key: "consulting-nora", label: "🧠 Nora interpreta el brief..." },
    { key: "generating", label: "🎨 Motor de imagen IA activo..." },
    { key: "uploading", label: "☁️ Guardando en tu servidor..." },
    { key: "done", label: "✅ ¡Listo!" },
  ];

  if (phase === "idle" || phase === "waiting-answer" || phase === "error") return null;

  const currentIndex = phases.findIndex((p) => p.key === phase);
  const current = phases[Math.max(0, currentIndex)];

  return (
    <div className="flex items-center gap-3 bg-black/50 border border-amber-500/30 rounded-xl px-4 py-3 mt-4">
      <Loader2 className={`w-4 h-4 text-amber-400 shrink-0 ${phase !== "done" ? "animate-spin" : ""}`} />
      <div className="flex-1">
        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">{current?.label}</p>
        <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / phases.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function CreativeStudio({ brandName, clientLogoUrl, onImageGenerated }: CreativeStudioProps) {
  const [brief, setBrief] = useState("");
  const [style, setStyle] = useState<string>("surreal_urban");
  const [format, setFormat] = useState<string>("16:9");
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [noraResult, setNoraResult] = useState<CreativeDirectorResult | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string>("");
  const lastSeed = useRef<number | null>(null);

  const resetSession = () => {
    setBrief("");
    setPhase("idle");
    setError(null);
    setNoraResult(null);
    setPendingAnswer("");
    setConversation([]);
    setGeneratedImageUrl(null);
    setImageSource("");
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

    // Apply style/format from Nora's interpretation if detected
    if (data.brief.style && STYLES.find((s) => s.id === data.brief.style)) {
      setStyle(data.brief.style);
    }
    if (data.brief.format && FORMATS.find((f) => f.id === data.brief.format)) {
      setFormat(data.brief.format);
    }

    const updatedHistory: ConversationMessage[] = [...newHistory, { role: "nora", content: data.htmlForPanel }];
    setConversation(updatedHistory);

    if (data.missing_critical) {
      setPhase("waiting-answer");
    } else {
      // Nora has everything — proceed to generate
      await handleGenerate(data.surrealismPrompt, data.brief.style || style, data.brief.format || format);
    }
  };

  const handleGenerate = async (prompt: string, imageStyle: string, imageFormat: string) => {
    setPhase("generating");
    setGeneratedImageUrl(null);

    try {
      const seed = Math.floor(Math.random() * 1_000_000);
      lastSeed.current = seed;

      const res = await fetch("/api/creative-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: imageStyle, aspectRatio: imageFormat, seed }),
      });

      setPhase("uploading");
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || "Error desconocido al generar imagen");

      setGeneratedImageUrl(data.imageUrl);
      setImageSource(data.source);
      setPhase("done");
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    }
  };

  const handleRegenerate = async () => {
    if (!noraResult?.surrealismPrompt) return;
    await handleGenerate(noraResult.surrealismPrompt, style, format);
  };

  const handleUseImage = () => {
    if (!generatedImageUrl || !noraResult) return;
    onImageGenerated(generatedImageUrl, noraResult.copy_aida || "");
  };

  const handleAnswerQuestion = async () => {
    if (!pendingAnswer.trim() || !noraResult) return;
    const answer = pendingAnswer.trim();
    setPendingAnswer("");
    await handleConsultNora(answer, conversation);
  };

  return (
    <div className="bg-gradient-to-br from-amber-950/30 via-purple-950/30 to-black/60 border border-amber-500/30 rounded-2xl p-5 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
            Nora Creative Director · Estudio Surrealista
          </span>
        </div>
        {brandName && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            {clientLogoUrl && <img src={clientLogoUrl} alt="Logo" className="w-4 h-4 object-contain rounded" />}
            <span className="text-[10px] text-amber-300 font-bold uppercase">{brandName}</span>
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
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
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
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide block">
            <MessageSquare className="inline w-3 h-3 mr-1" />
            Contale a Nora el brief de la campaña:
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="Ej: &quot;Algo para la panadería San Martín, quiero una empanada gigante en la plaza del pueblo&quot; · Podés ser informal, Nora entiende"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 resize-none placeholder:text-white/25 leading-relaxed"
          />

          {/* Style Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Estilo Surrealista:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    style === s.id
                      ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20"
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
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Formato de Salida:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    format === f.id
                      ? "bg-amber-500 text-black border-amber-400 shadow-md"
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
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Crear con Nora IA ✨
          </button>
        </div>
      )}

      {/* Nora is waiting for an answer */}
      {phase === "waiting-answer" && noraResult?.missing_critical && (
        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-amber-300 mb-1 uppercase tracking-wider">Nora necesita saber:</p>
            <p className="text-sm text-white/90">{noraResult.missing_critical}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={pendingAnswer}
              onChange={(e) => setPendingAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnswerQuestion()}
              placeholder="Tu respuesta..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAnswerQuestion}
              disabled={!pendingAnswer.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Responder
            </button>
          </div>
        </div>
      )}

      {/* Phase Indicator */}
      <PhaseIndicator phase={phase} />

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

      {/* Done State — Image Preview */}
      {phase === "done" && generatedImageUrl && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-black shadow-2xl">
            <img src={generatedImageUrl} alt="Gigantografía generada" className="w-full object-cover" />
            {imageSource && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-[9px] uppercase font-bold text-amber-300 px-2 py-1 rounded-full border border-amber-500/30">
                {imageSource === "gemini" ? "✨ Gemini IA" : "⚡ Flux Pro"}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerar variación
            </button>
            <button
              type="button"
              onClick={handleUseImage}
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Usar esta imagen ✓
            </button>
          </div>

          <button
            type="button"
            onClick={resetSession}
            className="w-full text-[10px] uppercase font-bold text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            Crear nueva campaña
          </button>
        </div>
      )}
    </div>
  );
}
