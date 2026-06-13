"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/store/CartContext";

export default function CartButton() {
  const { totalItems } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || totalItems === 0) return null;

  return (
    <Link href="/checkout" className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-50 bg-[var(--color-brand-accent)] text-black p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-white transition-all duration-300 flex items-center justify-center group animate-pulse-subtle">
      <ShoppingCart className="w-6 h-6" />
      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-black">
        {totalItems}
      </div>
    </Link>
  );
}
