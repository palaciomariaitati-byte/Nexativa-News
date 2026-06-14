"use client";

import React, { useState } from "react";
import { AccountingMovement } from "@/lib/types";
import { createAccountingMovement, deleteRecord } from "../actions";

export default function AccountingClient({ initialData }: { initialData: AccountingMovement[] }) {
  const [movements, setMovements] = useState<AccountingMovement[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalIncome = movements.filter(m => m.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = movements.filter(m => m.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = totalIncome - totalExpense;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await createAccountingMovement(formData);
    if (res?.error) {
      alert("Error: " + res.error);
      setSaving(false);
      return;
    }
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    try {
      await deleteRecord('accounting_movements', id);
      setMovements(movements.filter(m => m.id !== id));
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Contabilidad</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[var(--color-brand-accent)] text-black px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
        >
          + Nuevo Movimiento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 border border-white/10 rounded-2xl flex flex-col items-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">Ingresos Totales</p>
          <p className="text-3xl font-extrabold text-green-400">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-6 border border-white/10 rounded-2xl flex flex-col items-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">Egresos Totales</p>
          <p className="text-3xl font-extrabold text-red-400">${totalExpense.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-6 border border-white/10 rounded-2xl flex flex-col items-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">Balance</p>
          <p className={`text-3xl font-extrabold ${balance >= 0 ? 'text-[var(--color-brand-accent)]' : 'text-red-400'}`}>
            ${balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 overflow-hidden">
        {movements.length === 0 ? (
          <p className="text-center text-white/50 py-8">No hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-sm uppercase tracking-widest text-gray-400">
                  <th className="pb-4">Fecha</th>
                  <th className="pb-4">Descripción</th>
                  <th className="pb-4">Tipo</th>
                  <th className="pb-4 text-right">Monto</th>
                  <th className="pb-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 text-sm text-gray-300">
                      {new Date(item.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-4 font-medium">{item.description}</td>
                    <td className="py-4">
                      {item.type === 'income' ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Ingreso</span>
                      ) : (
                        <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Egreso</span>
                      )}
                    </td>
                    <td className={`py-4 text-right font-bold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {item.type === 'income' ? '+' : '-'}${Number(item.amount).toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 text-sm font-bold uppercase tracking-widest">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold uppercase tracking-widest text-[var(--color-brand-accent)]">Nuevo Movimiento</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-white mb-2 uppercase">Tipo de Movimiento</label>
                <select name="type" required className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] appearance-none">
                  <option value="income">Ingreso (+)</option>
                  <option value="expense">Egreso (-)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-white mb-2 uppercase">Monto ($)</label>
                <input type="number" name="amount" required step="0.01" min="0" placeholder="Ej: 50000" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-white mb-2 uppercase">Descripción</label>
                <input type="text" name="description" required placeholder="Ej: Pago de servidor, Publicidad..." className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl transition-all uppercase tracking-widest text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-[var(--color-brand-accent)] text-black font-bold py-3 px-4 rounded-xl transition-all uppercase tracking-widest text-sm hover:scale-105 disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
