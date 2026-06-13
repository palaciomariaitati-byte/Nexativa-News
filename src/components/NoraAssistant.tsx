"use client";

import React, { useState } from "react";
import { askNoraEditor, askNoraCM } from "@/app/admin/actions/nora";
import { Sparkles, PenTool, Share2, Copy, Check, Loader2 } from "lucide-react";

interface NoraAssistantProps {
  title: string;
  content: string;
}

export default function NoraAssistant({ title, content }: NoraAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [responseHtml, setResponseHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeMode, setActiveMode] = useState<"editora" | "cm" | null>(null);

  const handleAskEditor = async () => {
    if (!title && !content) return;
    setLoading(true);
    setActiveMode("editora");
    setResponseHtml(null);
    const res = await askNoraEditor(title, content);
    if (res.success) setResponseHtml(res.text || "");
    else setResponseHtml(`<p class="text-red-400">${res.error}</p>`);
    setLoading(false);
  };

  const handleAskCM = async () => {
    if (!title && !content) return;
    setLoading(true);
    setActiveMode("cm");
    setResponseHtml(null);
    const res = await askNoraCM(title, content);
    if (res.success) setResponseHtml(res.text || "");
    else setResponseHtml(`<p class="text-red-400">${res.error}</p>`);
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!responseHtml) return;
    // Strip HTML tags for clipboard
    const plainText = responseHtml.replace(/<[^>]+>/g, "");
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-purple-500/30 rounded-xl p-5 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-purple-500/20 p-2 rounded-lg">
          <Sparkles className="text-purple-400 w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">Nora IA <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full ml-2">Nexativa Brain</span></h3>
          <p className="text-xs text-purple-200">Editora, CM y Asesora Técnica</p>
        </div>
      </div>

      {activeMode === "soporte" ? (
        <div className="mb-4">
          <textarea
            placeholder="¿En qué puedo ayudarte, Jefe? Escribe tu consulta técnica aquí..."
            className="w-full bg-black/40 border border-purple-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 mb-2"
            rows={3}
            id="soporte-query"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const query = (document.getElementById("soporte-query") as HTMLTextAreaElement)?.value;
                if (!query) return;
                setLoading(true);
                setResponseHtml(null);
                const { askNoraSupport } = await import("@/app/admin/actions/nora");
                const res = await askNoraSupport(query);
                if (res.success) setResponseHtml(res.text || "");
                else setResponseHtml(`<p class="text-red-400">${res.error}</p>`);
                setLoading(false);
              }}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Preguntar"}
            </button>
            <button
              onClick={() => setActiveMode(null)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <button
            onClick={handleAskEditor}
            disabled={loading || (!title && !content)}
            className="flex items-center justify-center gap-2 bg-black/40 hover:bg-purple-600/30 border border-purple-500/30 text-white py-2 px-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Mejorar Redacción y SEO"
          >
            {loading && activeMode === "editora" ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <PenTool className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
            )}
            <span className="font-medium text-xs">Editora</span>
          </button>

          <button
            onClick={handleAskCM}
            disabled={loading || (!title && !content)}
            className="flex items-center justify-center gap-2 bg-black/40 hover:bg-pink-600/30 border border-pink-500/30 text-white py-2 px-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Generar Copys Virales"
          >
            {loading && activeMode === "cm" ? (
              <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
            ) : (
              <Share2 className="w-4 h-4 text-pink-400 group-hover:text-white transition-colors" />
            )}
            <span className="font-medium text-xs">CM Redes</span>
          </button>

          <button
            onClick={() => setActiveMode("soporte")}
            className="flex items-center justify-center gap-2 bg-black/40 hover:bg-blue-600/30 border border-blue-500/30 text-white py-2 px-2 rounded-lg transition-all duration-300 group"
            title="Soporte Técnico"
          >
            <Sparkles className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
            <span className="font-medium text-xs">Soporte</span>
          </button>
        </div>
      )}

      {responseHtml && (
        <div className="mt-4 bg-black/60 border border-white/10 rounded-lg p-4 relative group">
          <button 
            onClick={copyToClipboard}
            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 p-2 rounded transition-colors"
            title="Copiar al portapapeles"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
          </button>
          
          <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Respuesta de Nora ({activeMode})
            </span>
          </div>
          
          {/* Prose classes para estilizar el HTML inyectado de forma segura */}
          <div 
            className="text-gray-200 text-sm prose prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-2 prose-strong:text-white prose-ul:pl-4 prose-ul:mb-2"
            dangerouslySetInnerHTML={{ __html: responseHtml }}
          />
        </div>
      )}
    </div>
  );
}
