// src/components/admin/LoginForm.tsx
'use client';

import { useState } from 'react';
import { adminLogin } from '@/app/admin/actions';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Call the server action
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – we call the server action directly
      await adminLogin(password);
      // On success the server action will set a cookie and the page will refresh
      // Force a reload to reflect the auth state
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="rounded bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-center">Acceso Administrador</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2 focus:outline-none"
          required
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded bg-black py-2 text-white hover:bg-gray-800"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
