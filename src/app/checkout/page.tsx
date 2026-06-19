"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/store/CartContext";
import { Trash2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, removeItem, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("whatsapp");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <main className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-widest animate-pulse">Cargando...</h1>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-widest">Carrito Vacío</h1>
        <p className="text-gray-400 mb-8">No has agregado ningún producto a tu carrito todavía.</p>
        <Link href="/store" className="bg-[var(--color-brand-accent)] text-black font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-white transition-colors">
          Volver al Catálogo
        </Link>
      </main>
    );
  }

  const handleCheckout = () => {
    // Si eligió WhatsApp, generamos el mensaje para CADA tienda.
    // Como puede haber productos de distintas tiendas, idealmente el usuario compraría de una por vez,
    // o el sistema envía el pedido al admin central.
    // En este marketplace PyME, asumimos que se envía a un número central si hay varias tiendas,
    // o se procesa de forma centralizada. Aquí enviaremos un mensaje general si es "convenir".
    
    let text = "Hola! Quiero realizar el siguiente pedido:\\n\\n";
    items.forEach((item) => {
      text += `- ${item.quantity}x ${item.product.title} `;
      if (item.selectedSize) text += `(Talle: ${item.selectedSize}) `;
      if (item.selectedColor) text += `(Color: ${item.selectedColor}) `;
      text += `[$${(item.product.price * item.quantity).toFixed(2)}]\\n`;
      text += `  Tienda: ${item.store.name}\\n`;
    });
    text += `\\n*Total Estimado:* $${totalPrice.toFixed(2)}\\n`;
    text += `*Medio de Pago elegido:* ${paymentMethod.toUpperCase()}`;

    // Número de soporte proporcionado por el usuario
    const globalWhatsapp = "5493786414533"; 
    
    // Si todos los productos son de la MISMA tienda, usar el WA de esa tienda
    let firstStoreWa = items[0].store?.whatsapp;
    const allSameStore = items.every(i => i.store?.id === items[0].store?.id);
    
    if (firstStoreWa) {
      firstStoreWa = firstStoreWa.replace(/\D/g, ''); // Deja solo números
    }

    const finalNumber = allSameStore && firstStoreWa ? firstStoreWa : globalWhatsapp;

    const url = `https://wa.me/${finalNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    clearCart();
  };

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-12 pb-32">
      <h1 className="text-4xl font-black text-white mb-8 uppercase tracking-widest border-b border-white/10 pb-4">Tu Carrito</h1>
      
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, idx) => (
            <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${idx}`} className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-24 h-24 relative rounded-xl overflow-hidden shrink-0 bg-white/5">
                {item.product.image_url && <Image src={item.product.image_url} alt={item.product.title} fill className="object-cover" />}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-white line-clamp-1">{item.product.title}</h3>
                <p className="text-sm text-gray-400 mt-1">Tienda: {item.store?.name || "Nexativa"}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  {item.selectedSize && <span className="bg-white/10 text-xs px-2 py-1 rounded">Talle: {item.selectedSize}</span>}
                  {item.selectedColor && <span className="bg-white/10 text-xs px-2 py-1 rounded">Color: {item.selectedColor}</span>}
                  <span className="bg-[var(--color-brand-accent)]/20 text-[var(--color-brand-accent)] text-xs px-2 py-1 rounded font-bold">Cant: {item.quantity}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-center sm:items-end gap-4 shrink-0">
                <p className="text-2xl font-black text-white">${(item.product.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)} className="text-red-400 hover:text-red-300 transition-colors p-2 bg-red-400/10 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-black/40 border border-white/10 rounded-3xl p-8 h-fit sticky top-24">
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4">Resumen</h2>
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400">Total Productos</span>
            <span className="text-white font-bold">{items.reduce((s,i)=>s+i.quantity,0)}</span>
          </div>
          <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/10">
            <span className="text-gray-400">Total a Pagar</span>
            <span className="text-4xl font-black text-[var(--color-brand-accent)]">${totalPrice.toFixed(2)}</span>
          </div>

          <div className="space-y-4 mb-8">
            <label className="block text-sm font-bold text-gray-300 uppercase tracking-widest mb-2">Medio de Pago</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[var(--color-brand-accent)] appearance-none font-bold">
              <option value="whatsapp">💬 Convenir con vendedor (WhatsApp)</option>
              <option value="transferencia">🏦 Transferencia Bancaria</option>
              <option value="debito">💳 Tarjeta de Débito</option>
              <option value="credito">💳 Tarjeta de Crédito</option>
            </select>
          </div>

          <button onClick={handleCheckout} className="w-full bg-[var(--color-brand-accent)] hover:bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl transition-colors shadow-xl hover:shadow-[0_0_20px_var(--color-brand-accent)]">
            Finalizar Compra
          </button>
        </div>
      </div>
    </main>
  );
}
