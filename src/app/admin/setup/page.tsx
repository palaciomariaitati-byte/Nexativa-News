"use client";

import React, { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = getSupabaseBrowserClient();

  const handleCreate = async () => {
    setLoading(true);
    setMessage("");

    // 1. Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: "mjnexora.visual@gmail.com",
      password: "Almamia08.",
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setMessage("✅ El usuario ya existe en Supabase. Ve a /admin/login e inicia sesión.");
      } else {
        setMessage("❌ Error al crear usuario: " + error.message);
      }
    } else {
      setMessage("✅ Usuario creado con éxito. Si tienes activada la confirmación por email en Supabase, revisa tu correo mjnexora.visual@gmail.com. Si no, ¡ya puedes iniciar sesión en /admin/login!");
      
      // Auto-assign admin role in profiles if possible (the trigger might have set it to redactor)
      if (data.user) {
        await supabase.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-brand-bg)] px-4">
      <div className="glass-panel p-8 w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-serif font-bold text-[var(--color-brand-accent)] uppercase">
          Configuración Inicial
        </h1>
        <p className="text-white/70 text-sm">
          Haz clic en el botón de abajo para registrar tu cuenta maestra (mjnexora.visual@gmail.com).
        </p>
        
        <button 
          onClick={handleCreate} 
          disabled={loading}
          className="w-full bg-[var(--color-brand-accent)] text-black font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Usuario Administrador"}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-black/40 border border-white/20 rounded-lg text-sm text-white/90">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
