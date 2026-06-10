"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";

export default function AdminStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const supabase = getSupabaseBrowserClient();

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este producto permanentemente?")) {
      await supabase.from("products").delete().eq("id", id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (editingProduct.id) {
      // Update
      const { error } = await supabase.from("products").update({
        ...editingProduct,
        updated_at: new Date().toISOString()
      }).eq("id", editingProduct.id);
      if (!error) {
        setIsEditing(false);
        fetchProducts();
      } else alert("Error: " + error.message);
    } else {
      // Insert
      const { error } = await supabase.from("products").insert([{
        ...editingProduct,
        id: undefined,
        updated_at: new Date().toISOString()
      }]);
      if (!error) {
        setIsEditing(false);
        fetchProducts();
      } else alert("Error: " + error.message);
    }
  };

  const openEditor = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct({
        title: "",
        description: "",
        price: 0,
        stock: 0,
        image_url: "",
        buy_url: "",
      });
    }
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Tienda & Productos</h1>
        {!isEditing && (
          <button onClick={() => openEditor()} className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors">
            + Nuevo Producto
          </button>
        )}
      </div>

      {isEditing && editingProduct ? (
        <form onSubmit={handleSave} className="bg-black/20 rounded-xl border border-white/10 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Nombre del Producto</label>
              <input required type="text" value={editingProduct.title || ""} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">URL de Imagen</label>
              <input type="url" value={editingProduct.image_url || ""} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Precio ($)</label>
              <input required type="number" step="0.01" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Stock (Cantidad)</label>
              <input required type="number" value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Enlace de Compra Directo (Opcional - ej: MercadoPago)</label>
              <input type="url" value={editingProduct.buy_url || ""} onChange={e => setEditingProduct({...editingProduct, buy_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="Si está vacío, se usará el carrito del sistema." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Descripción</label>
              <textarea rows={3} value={editingProduct.description || ""} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
            </div>
          </div>
          <div className="flex space-x-4 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-lg font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest text-sm border border-white/10 hover:border-white/30">Cancelar</button>
            <button type="submit" className="flex-1 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black font-bold uppercase tracking-widest py-3 rounded-lg transition-colors">Guardar Producto</button>
          </div>
        </form>
      ) : (
        <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white/50">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-white/50">No hay productos en la tienda.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Producto</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Precio</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Stock</th>
                  <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white">{product.title}</td>
                    <td className="p-4 text-[var(--color-brand-accent)] font-bold">${product.price}</td>
                    <td className="p-4">{product.stock}</td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => openEditor(product)} className="text-[var(--color-brand-accent)] hover:text-white transition-colors text-sm uppercase tracking-wider font-bold">Editar</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase tracking-wider font-bold">Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
