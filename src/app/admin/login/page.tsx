"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../actions";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await adminLogin(password);
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-brand-bg)] px-4">
      <div className="glass-panel p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold tracking-widest text-[var(--color-brand-accent)]">
            NEXATIVA<span className="text-white font-light">NEWS</span>
          </h1>
          <p className="text-sm text-white/50 mt-2 uppercase tracking-widest">Acceso Restringido</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide text-xs">Clave de Acceso</label>
            <input
              type="password"
              required
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black font-bold uppercase tracking-widest py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar al Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
