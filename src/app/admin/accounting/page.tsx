import React from "react";

export default function AdminAccountingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contabilidad</h1>
        <button className="bg-[var(--color-brand-accent)] text-black px-4 py-2 rounded font-bold hover:bg-white transition-colors">
          + Nuevo Movimiento
        </button>
      </div>

      <div className="glass-panel p-12 text-center text-gray-400">
        <p className="text-xl mb-2">Módulo en Construcción</p>
        <p className="text-sm">La vista de contabilidad estará disponible próximamente para registrar ingresos y egresos.</p>
      </div>
    </div>
  );
}
