"use client";

import React, { useState, useRef } from "react";
import { askNoraCreativeDirector, type CreativeDirectorResult } from "@/app/admin/actions/nora";
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MessageSquare, 
  Image as ImageIcon, 
  Download, 
  Copy, 
  Send, 
  Zap, 
  Check, 
  Layers
} from "lucide-react";

// --- Tipos & Constantes de Estilo ---
const STYLES = [
  { id: "surreal_urban", label: "🏙️ Gigantismo Urbano", desc: "Producto monumental 3D en la avenida principal" },
  { id: "surreal_magic", label: "✨ Impacto Mágico", desc: "Irrupción visual surrealista en la vida cotidiana" },
  { id: "cinematic", label: "🎬 Spot Cinematográfico", desc: "Iluminación de película, atardecer dorado y reflejos" },
  { id: "luxury", label: "💎 Lujo & Gala Editorial", desc: "Estética sofisticada, vidrio, metales y luces de estudio" },
  { id: "anamorphic", label: "🌐 Pantalla LED 3D", desc: "Efecto anamórfico que parece salir de la pantalla" },
] as const;

const FORMATS = [
  { id: "9:16", label: "📱 9:16 Vertical", sub: "Stories / Reels / WhatsApp Status (Recomendado)" },
  { id: "1:1", label: "🟦 1:1 Cuadrado", sub: "Feed Instagram / Facebook" },
  { id: "16:9", label: "🖥️ 16:9 Horizontal", sub: "Banners Web / Pantallas LED" },
  { id: "3:1", label: "🏙️ 3:1 Megabanner", sub: "Cabeceras de Diario y Gigantografías" },
] as const;

const PRESETS = [
  {
    title: "🍔 Gastronomía",
    brief: "Hamburguesa monumental de 15 metros con queso cheddar derretido y panceta crujiente flotando sobre la avenida principal, transeúntes asombrados mirando hacia arriba, luz solar dorada fotorrealista."
  },
  {
    title: "🏡 Cabañas / Alquileres",
    brief: "Cabaña de diseño moderno en madera nativa y cristal con piscina infinita frente a las playas del río Paraná en Ituzaingó al atardecer, vista de dron cinematográfica de ultra lujo."
  },
  {
    title: "☕ Café & Bar",
    brief: "Taza de café capuchino gigante humeante con arte latte flotando sobre la plaza central, granos de café cayendo como lluvia suave en cámara lenta, estética comercial de primer nivel."
  },
  {
    title: "🚗 Taller / Autos",
    brief: "Camioneta 4x4 todoterreno potente saliendo de un portal de luz holográfico 3D en el centro de la ciudad, chispas de energía y asfalto mojado con reflejos de neón."
  },
  {
    title: "👗 Moda & Calzado",
    brief: "Calzado deportivo de última generación a escala monumental suspendido en el aire con iluminación de pasarela de alta costura, reflejos dorados y fondo urbano futurista."
  }
];

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

export default function CreativeStudio({ 
  brandName, 
  clientLogoUrl, 
  onImageGenerated,
  onOpenVideoCreator
}: CreativeStudioProps) {
  const [brief, setBrief] = useState("");
  const [style, setStyle] = useState<string>("surreal_urban");
  const [format, setFormat] = useState<string>("9:16");
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [noraResult, setNoraResult] = useState<CreativeDirectorResult | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  const [mediaSource, setMediaSource] = useState<string>("");
  const [copiedPitch, setCopiedPitch] = useState(false);
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
    setCopiedPitch(false);
    lastSeed.current = null;
  };

  const handleConsultNora = async (userMessage: string, history: ConversationMessage[]) => {
    if (!userMessage.trim()) return;
    setPhase("consulting-nora");
    setError(null);

    const newHistory: ConversationMessage[] = [...history, { role: "user", content: userMessage }];
    setConversation(newHistory);

    try {
      const result = await askNoraCreativeDirector(
        userMessage,
        "Director Comercial",
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
        await handleGenerate(data.surrealismPrompt, data.brief.style || style, format);
      }
    } catch (err: any) {
      console.error("[CreativeStudio] Error al consultar a Nora:", err);
      // Fallback a generación directa inmediata
      await handleGenerate(userMessage, style, format);
    }
  };

  const handleGenerate = async (prompt: string, selectedStyle: string, selectedFormat: string) => {
    setPhase("generating");
    setGeneratedMediaUrl(null);
    setError(null);

    try {
      const seed = Math.floor(Math.random() * 1_000_000);
      lastSeed.current = seed;

      const res = await fetch("/api/creative-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          style: selectedStyle, 
          aspectRatio: selectedFormat, 
          seed 
        }),
      });

      setPhase("uploading");
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || "Error al generar pieza publicitaria");

      const url = data.imageUrl;
      setGeneratedMediaUrl(url);
      setMediaSource(data.source || "pollinations-flux-3d");
      setPhase("done");
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    }
  };

  const handleRegenerate = async () => {
    const promptToUse = noraResult?.surrealismPrompt || brief;
    if (!promptToUse) return;
    await handleGenerate(promptToUse, style, format);
  };

  const handleUseMedia = () => {
    if (!generatedMediaUrl) return;
    onImageGenerated(generatedMediaUrl, noraResult?.copy_aida || "");
  };

  const handleAnswerQuestion = async () => {
    if (!pendingAnswer.trim()) return;
    const answer = pendingAnswer.trim();
    setPendingAnswer("");
    await handleConsultNora(answer, conversation);
  };

  const copyPitchToClipboard = () => {
    const textToCopy = noraResult?.copy_aida 
      ? `${noraResult.copy_aida.replace(/<[^>]*>?/gm, '')}\n\nMirá la pieza que diseñamos para vos:\n${generatedMediaUrl || ''}`
      : `¡Hola! Diseñamos una pieza publicitaria 3D exclusiva para tu negocio en Nexativa News:\n${generatedMediaUrl || ''}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 3000);
  };

  const sendDirectWhatsApp = () => {
    const text = encodeURIComponent(
      noraResult?.copy_aida 
        ? `${noraResult.copy_aida.replace(/<[^>]*>?/gm, '')}\n\nAcá podés ver el anuncio publicitario 3D en alta resolución:\n${generatedMediaUrl || ''}`
        : `¡Hola! Te comparto la pieza publicitaria 3D de alto impacto creada para tu comercio en Nexativa News:\n${generatedMediaUrl || ''}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="bg-gradient-to-br from-purple-950/50 via-slate-900/90 to-black border border-purple-500/40 rounded-2xl p-5 space-y-5 shadow-2xl text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs uppercase font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-300 block">
              Estudio Creativo 3D · Flyers & Banners Caza-Clientes
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              Motor Soberano Nora AI (Groq Llama 3.3 70B) & Pollinations Flux 3D · En 2 segundos
            </span>
          </div>
        </div>

        {brandName && (
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-lg">
            {clientLogoUrl && <img src={clientLogoUrl} alt="Logo" className="w-4 h-4 object-contain rounded" />}
            <span className="text-[11px] text-purple-300 font-bold uppercase">{brandName}</span>
          </div>
        )}
      </div>

      {/* Historial de conversación con Nora */}
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
                {msg.role === "nora" ? "N" : "T"}
              </div>
              {msg.role === "nora" ? (
                <div
                  className="flex-1 text-xs text-white/90 bg-white/5 rounded-xl px-3 py-2 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              ) : (
                <div className="flex-1 text-xs text-white/80 bg-purple-900/30 rounded-xl px-3 py-2 leading-relaxed text-right border border-purple-500/20">
                  {msg.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Entrada del brief (Estado Inicial) */}
      {phase === "idle" && (
        <div className="space-y-4">
          
          {/* Presets Rápidos Caza-Clientes */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Plantillas Rápidas para Atraer Sponsors Comerciales:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBrief(p.brief)}
                  className="text-xs bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 px-3 py-1.5 rounded-lg transition-all text-gray-300 hover:text-white cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide block">
              <MessageSquare className="inline w-3 h-3 mr-1 text-pink-400" />
              Escribe la idea o producto del cliente que queremos captar:
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="Ej: 'Cabaña de troncos y vidrio con piscina infinita frente al río en Ituzaingó al atardecer, super cálida y elegante para alquilar los fines de semana.'"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500 resize-none placeholder:text-white/30 leading-relaxed"
            />
          </div>

          {/* Selector de Estilo */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Estilo de Impacto Visual:</label>
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

          {/* Selector de Formato */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Formato de la Pieza Gráfica:</label>
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
            className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm px-6 py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Diseñar Flyer 3D & Guión Caza-Clientes en 2 Segundos 🚀</span>
          </button>
        </div>
      )}

      {/* Fase de Espera / Pregunta de Nora */}
      {phase === "waiting-answer" && noraResult?.missing_critical && (
        <div className="space-y-3">
          <div className="bg-pink-500/10 border border-pink-500/40 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-pink-300 mb-1 uppercase tracking-wider">Nora necesita afinar un detalle:</p>
            <p className="text-sm text-white/90">{noraResult.missing_critical}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={pendingAnswer}
              onChange={(e) => setPendingAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnswerQuestion()}
              placeholder="Escribe tu aclaración..."
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

      {/* Barra de Progreso en Generación */}
      {(phase === "consulting-nora" || phase === "generating" || phase === "uploading") && (
        <div className="flex items-center gap-3 bg-black/60 border border-pink-500/40 rounded-xl px-4 py-4 mt-4 shadow-lg animate-pulse">
          <Loader2 className="w-5 h-5 text-pink-400 shrink-0 animate-spin" />
          <div className="flex-1">
            <p className="text-xs font-black text-pink-300 uppercase tracking-wider">
              {phase === "consulting-nora" && "🧠 Nora interpreta el brief y redacta el copy AIDA con Groq..."}
              {phase === "generating" && "🎨 Motor Pollinations Flux 3D renderizando escena fotorrealista..."}
              {phase === "uploading" && "☁️ Optimizando y guardando pieza en la nube..."}
            </p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700"
                style={{ 
                  width: phase === "consulting-nora" ? "35%" : phase === "generating" ? "75%" : "95%" 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manejo de Error */}
      {phase === "error" && error && (
        <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-300 uppercase tracking-wider mb-1">Aviso</p>
            <p className="text-xs text-red-200/80">{error}</p>
            <button
              type="button"
              onClick={resetSession}
              className="mt-2 text-[10px] uppercase font-bold text-red-300 hover:text-red-200 underline cursor-pointer"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Estado Terminado: Visualización HD + Copy AIDA + Acciones de Caza-Clientes */}
      {phase === "done" && generatedMediaUrl && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Contenedor Visual de la Pieza Gráfica */}
          <div className="relative rounded-2xl overflow-hidden border border-pink-500/50 bg-black shadow-2xl group max-h-[560px] flex items-center justify-center">
            <img 
              src={generatedMediaUrl} 
              alt="Pieza Publicitaria 3D Caza-Clientes" 
              className="max-h-[560px] w-auto object-contain mx-auto transition-transform duration-700 hover:scale-[1.02]"
            />

            {/* Badges superiores */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <div className="bg-black/85 backdrop-blur-md text-[10px] uppercase font-black text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/50 shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Flyer 3D Listo</span>
              </div>
            </div>

            {brandName && (
              <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] font-bold text-white flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{brandName}</span>
              </div>
            )}
          </div>

          {/* Guión y Pitch Comercial AIDA para Mandarle al Comerciante */}
          {noraResult?.copy_aida && (
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-amber-300 flex items-center gap-1.5 tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  Pitch y Copy de Prospección Comercial (Fórmula AIDA)
                </span>
                <span className="text-[10px] text-gray-400">
                  Formato: {format === "9:16" ? "Vertical (Stories/WhatsApp)" : format}
                </span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed font-sans whitespace-pre-line bg-black/40 p-3 rounded-lg border border-white/5">
                {noraResult.copy_aida.replace(/<[^>]*>?/gm, '')}
              </p>
            </div>
          )}

          {/* Barra de Acciones y Caza de Clientes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            
            {/* 1. Copiar Pitch para WhatsApp */}
            <button
              type="button"
              onClick={copyPitchToClipboard}
              className={`px-3 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                copiedPitch 
                  ? "bg-emerald-600 text-white" 
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold"
              }`}
            >
              {copiedPitch ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPitch ? "¡Pitch Copiado!" : "Copiar Pitch WhatsApp"}</span>
            </button>

            {/* 2. Enviar Directo a WhatsApp */}
            <button
              type="button"
              onClick={sendDirectWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            {/* 3. Descargar Flyer HD */}
            <a
              href={generatedMediaUrl}
              download="flyer_publicitario_3d.jpg"
              target="_blank"
              rel="noreferrer"
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs px-3 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Imagen HD</span>
            </a>

            {/* 4. Asignar a Campaña / Auspiciante en Diario */}
            <button
              type="button"
              onClick={handleUseMedia}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs px-3 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Fijar en Campaña ✓</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleRegenerate}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerar otra variación 3D</span>
            </button>

            <button
              type="button"
              onClick={resetSession}
              className="text-[10px] uppercase font-bold text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
            >
              + Diseñar otra pieza comercial
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
