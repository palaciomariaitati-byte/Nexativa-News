'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for diagnostics
    console.error('Nexativa Client Runtime / Hydration Error:', error);

    // Auto-recover if it is a stale chunk or dynamic import error after a new Vercel deployment
    const msg = error?.message || '';
    if (
      msg.includes('ChunkLoadError') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Cannot find module')
    ) {
      console.warn('Stale build chunk detected. Reloading with cache refresh...');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e2e8f0] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f141b] border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold block">
            NEXATIVA TRUST SHIELD
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Actualización del Sistema en Curso
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Hemos actualizado la plataforma con las últimas noticias y mejoras de diseño. Hacé clic en reintentar para cargar la versión más reciente.
          </p>
        </div>

        {error?.digest && (
          <div className="px-3 py-1.5 rounded bg-black/40 border border-gray-800 text-[10px] font-mono text-gray-500">
            ID de Evento: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar Carga
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-[#171f2b] hover:bg-[#1f2a3a] border border-gray-700 text-gray-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" /> Ir a la Portada
          </Link>
        </div>
      </div>
    </div>
  );
}
