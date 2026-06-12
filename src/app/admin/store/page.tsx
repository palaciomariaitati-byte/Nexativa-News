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

  // Función envuelta en useCallback si se usara en deps, pero aquí la extraemos o usamos directo
  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts();

    // Suscripción Realtime para la Tienda
    const channel = supabase
      .channel("store_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este producto permanentemente?")) {
      await supabase.from("products").delete().eq("id", id);
      // Realtime actualizará la lista, pero podemos actualizar localmente para mayor rapidez
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    // Mostramos estado de carga general (o en el botón, pero reusamos loading para inhabilitar)
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const imageFile = formData.get("image_file") as File | null;
    
    let finalImageUrl = editingProduct.image_url;

    // Subida de imagen a Supabase Storage
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `store/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, imageFile, { upsert: false });
      
      if (uploadError) {
        alert("Error subiendo imagen: " + uploadError.message);
        setLoading(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
      finalImageUrl = publicUrlData.publicUrl;
    }

    const payload = {
      title: editingProduct.title,
      description: editingProduct.description,
      price: editingProduct.price,
      stock: editingProduct.stock,
      buy_url: editingProduct.buy_url,
      image_url: finalImageUrl,
      updated_at: new Date().toISOString()
    };

    if (editingProduct.id) {
      // Update
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (!error) {
        setIsEditing(false);
      } else {
        alert("Error: " + error.message);
      }
    } else {
      // Insert
      const { error } = await supabase.from("products").insert([payload]);
      if (!error) {
        setIsEditing(false);
      } else {
        alert("Error: " + error.message);
      }
    }
    
    setLoading(false);
    // Realtime listener volverá a descargar todo al detectar el cambio
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
            
            <div className="flex flex-col">
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Imagen del Producto</label>
              {editingProduct.image_url && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editingProduct.image_url} alt="Vista previa" className="h-16 w-auto object-cover rounded border border-white/10" />
                  <p className="text-xs text-gray-500 mt-1">Imagen actual (sube un archivo nuevo para reemplazarla)</p>
                </div>
              )}
              <input 
                type="file" 
                name="image_file" 
                accept="image/*"
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-[var(--color-brand-accent)] file:text-black hover:file:bg-white transition-colors" 
              />
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
            <button type="submit" disabled={loading} className="flex-1 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] disabled:opacity-50 text-black font-bold uppercase tracking-widest py-3 rounded-lg transition-colors">
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
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
                    <td className="p-4 font-medium text-white flex items-center gap-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.title} className="w-10 h-10 object-cover rounded-md border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 bg-white/5 rounded-md border border-white/10 flex items-center justify-center text-xs text-gray-500">Sin img</div>
                      )}
                      <span>{product.title}</span>
                    </td>
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
