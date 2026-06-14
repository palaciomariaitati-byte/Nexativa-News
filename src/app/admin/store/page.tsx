"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Product, Store } from "@/lib/types";

export default function AdminStorePage() {
  const [activeTab, setActiveTab] = useState<"stores" | "products">("stores");
  
  // Stores state
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editingStore, setEditingStore] = useState<Partial<Store> | null>(null);

  // Products state (inside a selected store)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const supabase = getSupabaseBrowserClient();

  const fetchStores = async () => {
    setLoading(true);
    const { data } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
    if (data) setStores(data);
    setLoading(false);
  };

  const fetchProducts = async (storeId: string) => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // --- STORE ACTIONS ---
  const handleSaveStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStore) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const logoFile = formData.get("logo_file") as File | null;
    let logo_url = editingStore.logo_url || null;

    if (logoFile && logoFile.size > 0) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `store_logos/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, logoFile, { upsert: false });
      if (uploadError) {
        alert("Error subiendo el logo: " + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
      logo_url = publicUrlData.publicUrl;
    }

    const bannerFile = formData.get("banner_file") as File | null;
    let banner_url = editingStore.banner_url || null;

    if (bannerFile && bannerFile.size > 0) {
      const fileExt = bannerFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `store_banners/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, bannerFile, { upsert: false });
      if (uploadError) {
        alert("Error subiendo el banner: " + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
      banner_url = publicUrlData.publicUrl;
    }
    
    const payload = {
      name: editingStore.name,
      description: editingStore.description,
      address: editingStore.address,
      whatsapp: editingStore.whatsapp,
      instagram: editingStore.instagram,
      facebook: editingStore.facebook,
      x_url: editingStore.x_url,
      map_url: editingStore.map_url,
      logo_url: logo_url,
      banner_url: banner_url
    };

    if (editingStore.id) {
      const { error } = await supabase.from("stores").update(payload as any).eq("id", editingStore.id);
      if (!error) setIsEditingStore(false);
      else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from("stores").insert([payload as any]);
      if (!error) setIsEditingStore(false);
      else alert("Error: " + error.message);
    }
    fetchStores();
  };

  const handleDeleteStore = async (id: string) => {
    if (confirm("¿Eliminar esta tienda y TODOS sus productos permanentemente?")) {
      await supabase.from("stores").delete().eq("id", id);
      fetchStores();
    }
  };

  // --- PRODUCT ACTIONS ---
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct || !selectedStore) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const imageFiles = [
      formData.get("image_file_1") as File | null,
      formData.get("image_file_2") as File | null,
      formData.get("image_file_3") as File | null,
    ];
    
    let finalImageUrls = [
      editingProduct.image_url || "",
      editingProduct.image_url_2 || "",
      editingProduct.image_url_3 || ""
    ];

    for (let i = 0; i < 3; i++) {
      const imageFile = imageFiles[i];
      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `store/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, imageFile, { upsert: false });
        if (uploadError) {
          alert(`Error subiendo imagen ${i+1}: ` + uploadError.message);
          setLoading(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
        finalImageUrls[i] = publicUrlData.publicUrl;
      }
    }

    const payload = {
      title: editingProduct.title,
      description: editingProduct.description,
      price: editingProduct.price,
      stock: editingProduct.stock,
      sizes: editingProduct.sizes,
      colors: editingProduct.colors,
      image_url: finalImageUrls[0],
      image_url_2: finalImageUrls[1],
      image_url_3: finalImageUrls[2],
      store_id: selectedStore.id,
      updated_at: new Date().toISOString()
    };

    if (editingProduct.id) {
      const { error } = await supabase.from("products").update(payload as any).eq("id", editingProduct.id);
      if (!error) setIsEditingProduct(false);
      else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from("products").insert([payload as any]);
      if (!error) setIsEditingProduct(false);
      else alert("Error: " + error.message);
    }
    fetchProducts(selectedStore.id);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Eliminar este producto?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        alert("No se pudo eliminar el producto: " + error.message);
      }
      if (selectedStore) fetchProducts(selectedStore.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">
          Marketplace PyME
        </h1>
        {activeTab === "stores" && !isEditingStore && (
          <button onClick={() => { setEditingStore({ name: "" }); setIsEditingStore(true); }} className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors">
            + Nueva Tienda
          </button>
        )}
        {activeTab === "products" && selectedStore && !isEditingProduct && (
          <button onClick={() => { setEditingProduct({ title: "", price: 0, stock: 1 }); setIsEditingProduct(true); }} className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors">
            + Nuevo Producto
          </button>
        )}
      </div>

      <div className="flex space-x-1 border-b border-white/10 mb-8">
        <button
          onClick={() => { setActiveTab("stores"); setIsEditingStore(false); setSelectedStore(null); setIsEditingProduct(false); }}
          className={`px-6 py-3 font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${
            activeTab === "stores" ? "border-[var(--color-brand-accent)] text-[var(--color-brand-accent)]" : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          Gestión de Tiendas
        </button>
        {selectedStore && (
          <button
            onClick={() => { setActiveTab("products"); setIsEditingProduct(false); }}
            className={`px-6 py-3 font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${
              activeTab === "products" ? "border-[var(--color-brand-accent)] text-[var(--color-brand-accent)]" : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            Productos de: {selectedStore.name}
          </button>
        )}
      </div>

      {/* --- STORES VIEW --- */}
      {activeTab === "stores" && (
        <>
          {isEditingStore && editingStore ? (
            <form onSubmit={handleSaveStore} className="bg-black/20 rounded-xl border border-white/10 p-6 space-y-6 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Nombre de la Tienda</label>
                  <input required type="text" value={editingStore.name || ""} onChange={e => setEditingStore({...editingStore, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Descripción / Bio</label>
                  <textarea rows={2} value={editingStore.description || ""} onChange={e => setEditingStore({...editingStore, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Dirección Física</label>
                  <input type="text" value={editingStore.address || ""} onChange={e => setEditingStore({...editingStore, address: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="Ej: Av. San Martín 1234, Ciudad" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">WhatsApp</label>
                  <input type="text" value={editingStore.whatsapp || ""} onChange={e => setEditingStore({...editingStore, whatsapp: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="Ej: 54911000000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Instagram URL</label>
                  <input type="url" value={editingStore.instagram || ""} onChange={e => setEditingStore({...editingStore, instagram: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Facebook URL</label>
                  <input type="url" value={editingStore.facebook || ""} onChange={e => setEditingStore({...editingStore, facebook: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">X (Twitter) URL</label>
                  <input type="url" value={editingStore.x_url || ""} onChange={e => setEditingStore({...editingStore, x_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Mapa GPS (Google Maps Embed URL)</label>
                  <input type="url" value={editingStore.map_url || ""} onChange={e => setEditingStore({...editingStore, map_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="https://www.google.com/maps/embed?pb=..." />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Logo de la Tienda</label>
                  {editingStore.logo_url && <img src={editingStore.logo_url} alt="Logo" className="h-16 w-16 object-contain mb-2 bg-white/5 rounded border border-white/10 p-1" />}
                  <input type="file" name="logo_file" accept="image/*" className="w-full text-xs text-gray-400 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[var(--color-brand-accent)] file:text-black hover:file:bg-white" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Banner de la Tienda</label>
                  {editingStore.banner_url && <img src={editingStore.banner_url} alt="Banner" className="h-16 w-full object-cover mb-2 bg-white/5 rounded border border-white/10 p-1" />}
                  <input type="file" name="banner_file" accept="image/*" className="w-full text-xs text-gray-400 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[var(--color-brand-accent)] file:text-black hover:file:bg-white" />
                </div>
              </div>
              <div className="flex space-x-4 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsEditingStore(false)} className="px-6 py-3 rounded-lg font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest text-sm border border-white/10 hover:border-white/30">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] disabled:opacity-50 text-black font-bold uppercase tracking-widest py-3 rounded-lg transition-colors">
                  {loading ? "Guardando..." : "Guardar Tienda"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading && stores.length === 0 ? <p className="text-gray-500">Cargando tiendas...</p> : null}
              {stores.map(store => (
                <div key={store.id} className="bg-black/30 border border-white/10 rounded-xl p-6 hover:border-[var(--color-brand-accent)]/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">{store.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">{store.description || "Sin descripción"}</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setSelectedStore(store); setActiveTab("products"); fetchProducts(store.id); }} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded transition-colors text-sm uppercase">Gestionar Productos</button>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingStore(store); setIsEditingStore(true); }} className="flex-1 text-[var(--color-brand-accent)] hover:text-white transition-colors text-xs font-bold uppercase">Editar Tienda</button>
                      <button onClick={() => handleDeleteStore(store.id)} className="flex-1 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase">Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- PRODUCTS VIEW --- */}
      {activeTab === "products" && selectedStore && (
        <>
          {isEditingProduct && editingProduct ? (
            <form onSubmit={handleSaveProduct} className="bg-black/20 rounded-xl border border-white/10 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Nombre del Producto</label>
                  <input required type="text" value={editingProduct.title || ""} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
                
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((num) => {
                    const key = num === 1 ? "image_url" : `image_url_${num}`;
                    const val = (editingProduct as any)[key];
                    return (
                      <div key={num} className="bg-black/30 p-4 rounded border border-white/5">
                        <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Imagen {num}</label>
                        {val && <img src={val} alt="preview" className="h-16 w-full object-cover rounded mb-2 border border-white/10" />}
                        <input type="file" name={`image_file_${num}`} accept="image/*" className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[var(--color-brand-accent)] file:text-black hover:file:bg-white" />
                      </div>
                    )
                  })}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Precio ($)</label>
                  <input required type="number" step="0.01" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Stock</label>
                  <input required type="number" value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>

                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Talles Dispo. (Ej: S, M, L)</label>
                    <input type="text" value={editingProduct.sizes || ""} onChange={e => setEditingProduct({...editingProduct, sizes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="S, M, L, XL" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Colores (Ej: Rojo, Azul)</label>
                    <input type="text" value={editingProduct.colors || ""} onChange={e => setEditingProduct({...editingProduct, colors: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" placeholder="Rojo, Azul, Negro" />
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Descripción</label>
                  <textarea rows={3} value={editingProduct.description || ""} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]" />
                </div>
              </div>
              <div className="flex space-x-4 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsEditingProduct(false)} className="px-6 py-3 rounded-lg font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest text-sm border border-white/10 hover:border-white/30">Cancelar</button>
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
                <div className="p-8 text-center text-white/50">Esta tienda aún no tiene productos.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Producto</th>
                      <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Precio</th>
                      <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70">Variantes</th>
                      <th className="p-4 font-semibold text-xs uppercase tracking-wider text-white/70 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-white flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className="w-10 h-10 object-cover rounded border border-white/10" />
                          ) : <div className="w-10 h-10 bg-white/5 rounded border border-white/10" />}
                          <span>{product.title}</span>
                        </td>
                        <td className="p-4 text-[var(--color-brand-accent)] font-bold">${product.price}</td>
                        <td className="p-4 text-xs text-gray-400">
                          {product.sizes && <div>Talles: {product.sizes}</div>}
                          {product.colors && <div>Colores: {product.colors}</div>}
                        </td>
                        <td className="p-4 text-right space-x-3">
                          <button onClick={() => { setEditingProduct(product); setIsEditingProduct(true); }} className="text-[var(--color-brand-accent)] hover:text-white transition-colors text-sm uppercase font-bold">Editar</button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm uppercase font-bold">Borrar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
