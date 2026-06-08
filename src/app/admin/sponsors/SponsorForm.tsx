"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createSponsor, updateSponsor, deleteSponsor } from "../actions";

export default function SponsorForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    try {
      if (isEditing) {
        await updateSponsor(initialData.id, formData);
      } else {
        await createSponsor(formData);
      }
      router.push("/admin/sponsors");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar a este cliente?")) return;
    setLoading(true);
    try {
      await deleteSponsor(initialData.id);
      router.push("/admin/sponsors");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-6 max-w-2xl">
      {error && <div className="bg-red-500/20 text-red-200 p-3 rounded">{error}</div>}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Cliente *</label>
            <input
              type="text"
              name="name"
              defaultValue={initialData?.name || ""}
              required
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoría/Rubro *</label>
            <select
              name="category"
              defaultValue={initialData?.category || "Servicios"}
              required
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            >
              <option value="Hotelería">Hotelería</option>
              <option value="Turismo">Turismo</option>
              <option value="Gastronomía">Gastronomía</option>
              <option value="Servicios">Servicios</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sitio Web (Opcional)</label>
            <input
              type="url"
              name="website_url"
              defaultValue={initialData?.website_url || ""}
              placeholder="https://..."
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram (Opcional)</label>
            <input
              type="url"
              name="instagram_url"
              defaultValue={initialData?.instagram_url || ""}
              placeholder="https://instagram.com/..."
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Logo Cuadrado (Opcional)</label>
            {initialData?.logo_url && (
              <img src={initialData.logo_url} alt="Logo actual" className="h-16 object-contain bg-white/5 rounded p-1 mb-2" />
            )}
            <input
              type="file"
              name="logo"
              accept="image/*"
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-[var(--color-brand-accent)] file:text-black hover:file:bg-white"
            />
            <p className="text-xs text-gray-500">Formato cuadrado recomendado.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Banner Largo (Opcional)</label>
            {initialData?.banner_url && (
              <img src={initialData.banner_url} alt="Banner actual" className="h-16 w-full object-cover rounded mb-2" />
            )}
            <input
              type="file"
              name="banner"
              accept="image/*"
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-[var(--color-brand-accent)] file:text-black hover:file:bg-white"
            />
            <p className="text-xs text-gray-500">Se usará para la tarjeta grande.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--color-brand-accent)] text-black px-6 py-2 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Cliente"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/sponsors")}
            className="px-6 py-2 rounded font-bold text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-500 hover:text-red-400 font-bold px-4 py-2"
          >
            Eliminar Cliente
          </button>
        )}
      </div>
    </form>
  );
}
