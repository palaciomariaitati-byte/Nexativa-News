"use client";

import React, { useEffect, useState } from "react";
import { createStaffKey, deleteStaffKey, listStaffKeys } from "../actions";

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("redactor");

  async function fetchStaff() {
    setLoading(true);
    try {
      const data = await listStaffKeys();
      setStaff(data);
    } catch (e: any) {
      alert("Error al cargar personal: " + e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPassword) return;

    try {
      await createStaffKey(newName, newPassword, newRole);
      setNewName("");
      setNewPassword("");
      fetchStaff();
    } catch (e: any) {
      alert("Error al crear clave: " + e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el acceso para ${name}?`)) {
      try {
        await deleteStaffKey(id);
        fetchStaff();
      } catch (e: any) {
        alert("Error al eliminar: " + e.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Gestión de Personal</h1>
      
      {/* Formulario de Creación */}
      <form onSubmit={handleAdd} className="bg-black/20 rounded-xl border border-white/10 p-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Nombre</label>
          <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="Ej: Juan Perez" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Clave de Acceso</label>
          <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="Ej: Juan123" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase tracking-wide">Rol</label>
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]">
            <option value="redactor">Redactor (Solo Noticias)</option>
            <option value="operator">Operador (Noticias + Tienda + Streaming)</option>
            <option value="admin">Administrador (Todo + Contabilidad)</option>
          </select>
        </div>
        <button type="submit" className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black font-bold uppercase tracking-widest py-3 px-8 rounded-lg transition-colors h-[50px]">
          Crear Acceso
        </button>
      </form>

      {/* Lista de Personal */}
      <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/50">Cargando personal...</div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-white/50">No hay accesos creados.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Nombre</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Rol</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Fecha de Creación</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staff.map((person) => (
                <tr key={person.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{person.name}</td>
                  <td className="p-4">
                    <span className="bg-white/10 text-white/70 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{person.role}</span>
                  </td>
                  <td className="p-4 text-sm text-white/50">
                    {new Date(person.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(person.id, person.name)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase tracking-wider font-bold">Revocar Acceso</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
