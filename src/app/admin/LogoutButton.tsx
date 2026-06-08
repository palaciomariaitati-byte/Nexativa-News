"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { adminLogout } from "./actions";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogout();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
    >
      Cerrar Sesión
    </button>
  );
}
