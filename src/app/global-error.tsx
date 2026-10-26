'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#0a0e14] text-[#e2e8f0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0f141b] border border-red-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">
              SISTEMA REINICIÁNDOSE
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Nexativa News
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Detectamos una discrepancia temporal en los componentes del sistema. Reiniciando la sesión...
            </p>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Actualizar Plataforma
          </button>
        </div>
      </body>
    </html>
  );
}
