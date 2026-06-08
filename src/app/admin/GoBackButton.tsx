"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

export default function GoBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // No mostrar el botón de volver si estamos en el inicio del panel
  if (pathname === "/admin") return null;

  return (
    <button 
      onClick={() => router.back()}
      className="mb-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
    >
      <span>← Volver atrás</span>
    </button>
  );
}
