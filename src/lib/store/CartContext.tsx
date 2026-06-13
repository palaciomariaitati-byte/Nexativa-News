"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, Store } from "@/lib/types";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  store: Store;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nexativa_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("nexativa_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.product.id === newItem.product.id &&
          i.selectedSize === newItem.selectedSize &&
          i.selectedColor === newItem.selectedColor
      );

      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += newItem.quantity;
        return newItems;
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (productId: string, size?: string, color?: string) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(i.product.id === productId && i.selectedSize === size && i.selectedColor === color)
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
