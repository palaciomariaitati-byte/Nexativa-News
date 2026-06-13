"use client";

import React, { useState } from "react";
import { useCart } from "@/lib/store/CartContext";
import { Product, Store } from "@/lib/types";

export default function AddToCartButton({ product, store, sizes, colors }: { product: Product, store: Store, sizes: string[], colors: string[] }) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(colors[0] || "");
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (sizes.length > 0 && !selectedSize) return alert("Por favor elige un talle");
    if (colors.length > 0 && !selectedColor) return alert("Por favor elige un color");

    addItem({
      product,
      store,
      quantity: 1,
      selectedSize,
      selectedColor,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-t border-white/10 pt-6">
        {sizes.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wider">Talles Disponibles</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 rounded border transition-colors cursor-pointer ${selectedSize === s ? "border-[var(--color-brand-accent)] text-[var(--color-brand-accent)] bg-[var(--color-brand-accent)]/10" : "border-white/20 text-gray-300 hover:border-white/50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wider">Colores</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`px-4 py-2 rounded border transition-colors cursor-pointer ${selectedColor === c ? "border-[var(--color-brand-accent)] text-[var(--color-brand-accent)] bg-[var(--color-brand-accent)]/10" : "border-white/20 text-gray-300 hover:border-white/50"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <button
          onClick={handleAdd}
          className={`w-full font-black text-xl py-4 rounded-xl transition-all uppercase tracking-widest ${added ? "bg-green-500 text-white" : "bg-[var(--color-brand-accent)] text-black hover:bg-white"}`}
        >
          {added ? "¡Añadido!" : "Añadir al Carrito"}
        </button>
        {product.buy_url && (
          <a href={product.buy_url} target="_blank" rel="noopener noreferrer" className="block text-center mt-4 text-[var(--color-brand-accent)] underline">
            Link de pago directo
          </a>
        )}
      </div>
    </div>
  );
}
