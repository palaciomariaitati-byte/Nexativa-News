"use client";

import React, { useState } from "react";
import { Radio, Clock, Play, Sparkles } from "lucide-react";
import CleanFlashPlayer from "./CleanFlashPlayer";

type Flash = {
  id: string;
  title: string;
  summary: string;
  duration_seconds: number;
  video_url: string;
  segments: any[];
  category: string;
  created_at: string;
};

export default function NewsFlashHomeWidget({ flashes }: { flashes: Flash[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const hasFlashes = flashes && flashes.length > 0;
  const currentFlash = hasFlashes ? flashes[activeIdx] : null;

  return (
    <section className="w-full bg-gradient-to-br from-red-950/40 via-black to-slate-950 border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-red-500/20 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
          <div>
            <h3 className="text-white text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              🔴 Flash Noticioso (1 a 5 min)
            </h3>
            <p className="text-xs text-gray-400">
              Síntesis informativa producida en tiempo real con Inteligencia Artificial Nora por <strong>MyJNexoraVisual</strong>.
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
          Nexativa Clean Player
        </span>
      </div>

      {hasFlashes && currentFlash ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Clean Player */}
          <div className="lg:col-span-2 space-y-4">
            <CleanFlashPlayer
              videoUrl={currentFlash.video_url}
              segments={currentFlash.segments}
              totalDurationSeconds={currentFlash.duration_seconds}
              title={currentFlash.title}
              partnerName="Nexativa News Portal"
            />

            <div className="bg-black/60 border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-red-600 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded">
                  {currentFlash.category || "NACIONAL"}
                </span>
                <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.floor(currentFlash.duration_seconds / 60)}m {currentFlash.duration_seconds % 60}s
                </span>
              </div>
              <h4 className="text-lg font-bold text-white leading-snug">{currentFlash.title}</h4>
              <p className="text-xs text-gray-300 line-clamp-3">{currentFlash.summary}</p>
            </div>
          </div>

          {/* Playlist of Flashes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Noticieros Rápidos Recientes ({flashes.length})
            </h4>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {flashes.map((flash, idx) => (
                <div
                  key={flash.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    activeIdx === idx
                      ? "bg-red-950/50 border-red-500 shadow-lg"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-red-400 uppercase">{flash.category || "General"}</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {Math.floor(flash.duration_seconds / 60)}m {flash.duration_seconds % 60}s
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white line-clamp-2">{flash.title}</h5>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Placeholder view when no flashes are published yet */
        <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
          <h4 className="text-base font-bold text-white">Bandeja de Flashes Noticiosos Lista</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Los noticieros de 1 a 5 minutos procesados con Nora IA aparecerán automáticamente en este espacio al ser emitidos.
          </p>
        </div>
      )}
    </section>
  );
}
