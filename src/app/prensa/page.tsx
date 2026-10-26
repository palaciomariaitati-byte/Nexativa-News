import React from "react";
import Link from "next/link";
import { ChevronLeft, Radio, Tv, Sparkles } from "lucide-react";
import VideoSection from "@/components/VideoSection";

export const metadata = {
  title: "Transmisión En Vivo | Nexativa TV & Radio",
  description: "Señal oficial de streaming en vivo, TV comunitaria y radio en directo de Ituzaingó y el Litoral.",
};

export default function PrensaPage() {
  return (
    <main className="min-h-screen bg-[#0a0e14] text-[#e2e8f0] pb-20">
      {/* Header bar */}
      <div className="border-b border-gray-800 bg-[#0f141b]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Volver a Portada
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-bold tracking-wider text-red-400 font-mono uppercase">
              EN VIVO • SEÑAL OFICIAL
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* Title Masthead */}
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider inline-block">
            Mesa de Transmisión & Redacción
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
            Nexativa TV & Radio <span className="text-[#e5b242] italic">En Vivo</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Streaming multimedia continuo las 24 hs. Programación periodística, flashes informativos, deportes y cobertura directa desde el Corredor del Alto Paraná.
          </p>
        </div>

        {/* Video Player Box */}
        <div className="w-full rounded-3xl border border-white/10 overflow-hidden bg-slate-950 shadow-2xl p-2 sm:p-4">
          <VideoSection />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="rounded-2xl border border-[#1e2633] bg-[#0f141b] p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
              <Tv className="w-4 h-4" /> Señal Televisiva HD
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Emisión digital directa para dispositivos móviles, Smart TVs y navegadores. Conexión de baja latencia con respaldo redundante.
            </p>
          </div>

          <div className="rounded-2xl border border-[#1e2633] bg-[#0f141b] p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <Radio className="w-4 h-4" /> Radio Online Litoral
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Música, análisis de coyuntura, entrevistas con referentes comerciales y reportes del tránsito y clima en tiempo real.
            </p>
          </div>

          <div className="rounded-2xl border border-[#1e2633] bg-[#0f141b] p-5 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-sm font-bold">
              <Sparkles className="w-4 h-4" /> Pauta Intercalada
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Espacio exclusivo para auspiciantes de la región con alcance garantizado a miles de vecinos y turistas de Ituzaingó.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
