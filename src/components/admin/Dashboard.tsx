// src/components/admin/Dashboard.tsx
'use client';

import { useState } from 'react';
import { fetchAll, deleteRecord } from '@/app/admin/actions';
import type { Article, Product, Sponsor, StreamVideo, ProPartner } from '@/lib/types';

type Tab = 'articles' | 'products' | 'sponsors' | 'streams' | 'pro_partners';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('articles');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (tab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchAll<any>(tab);
      setData(fetched);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    }
    setLoading(false);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    loadData(tab);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(activeTab, id);
      // Refresh list
      loadData(activeTab);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    }
  };

  // Load default tab on mount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (data.length === 0 && !loading) {
    loadData(activeTab);
  }

  const renderRow = (item: any) => {
    const id = item.id;
    return (
      <tr key={id} className="border-b">
        <td className="px-4 py-2">{id}</td>
        <td className="px-4 py-2">
          <button
            onClick={() => handleDelete(id)}
            className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Panel de Administración</h2>
      <nav className="mb-4 flex gap-4">
        {(['articles', 'products', 'sponsors', 'streams', 'pro_partners'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`rounded px-3 py-1 ${t === activeTab ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </nav>

      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>{data.map(renderRow)}</tbody>
        </table>
      )}
    </div>
  );
}
