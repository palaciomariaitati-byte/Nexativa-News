"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Home,
  UserCheck,
  AlertTriangle,
  Ban,
  CheckCircle2,
  PlusCircle,
  Search,
  ExternalLink,
  DollarSign,
} from "lucide-react";

export default function AdminInmueblesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Usamos el endpoint público o consulta directa para cargar todas las propiedades para administración
      const res = await fetch("/api/inmuebles/list");
      const data = await res.json();
      if (data.success && data.properties) {
        setProperties(data.properties);
      }
    } catch (err) {
      console.error("Error al cargar propiedades en Admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleAction = async (propertyId: string, newStatus: string) => {
    const actionText =
      newStatus === "BAN_PERMANENT"
        ? "BANEAR PERMANENTEMENTE a este propietario por estafa o falta grave"
        : newStatus === "SUSPENDED_NEGLIGENT"
        ? "SUSPENDER APLICANDO MULTA por negligencia de calendario"
        : "ACTIVAR / RESTABLECER este inmueble";

    if (!confirm(`¿Estás seguro de que deseas ${actionText}?`)) {
      return;
    }

    setProcessingId(propertyId);
    try {
      const res = await fetch("/api/admin/inmuebles/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          new_status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        // Actualizar estado en pantalla localmente
        setProperties((prev) =>
          prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p))
        );
      } else {
        alert(data.error || "No se pudo actualizar la propiedad.");
      }
    } catch (err) {
      alert("Error al comunicarse con el servidor.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner_dni?.includes(searchQuery) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "TODOS" || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const activeCount = properties.filter((p) => p.status === "ACTIVE").length;
  const suspendedCount = properties.filter((p) => p.status === "SUSPENDED_NEGLIGENT").length;
  const bannedCount = properties.filter((p) => p.status === "BAN_PERMANENT").length;

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Encabezado Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black">
            <ShieldAlert className="w-4 h-4" />
            <span>CONSOLA DE AUDITORÍA Y CONTROL ANTI-ESTAFAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Administración de Inmuebles & Calendarios
          </h1>
          <p className="text-xs text-slate-400">
            Supervisión de propiedades declaradas, auditoría de DNI del propietario y aplicación de sanciones o baneos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/guia/inmuebles"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center gap-1.5"
          >
            <span>🌐 Ver Portal Público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/guia/inmuebles/registro"
            className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>Registrar Nuevo Inmueble</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Propiedades Activas</p>
            <p className="text-2xl font-black text-white">{activeCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Con Multa / Negligencia</p>
            <p className="text-2xl font-black text-amber-400">{suspendedCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Baneos Permanentes</p>
            <p className="text-2xl font-black text-rose-500">{bannedCount}</p>
          </div>
        </div>
      </div>

      {/* Buscador & Filtros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por Propietario, DNI o Dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Filtrar Estado:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-400 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVE">Activos (Verificados)</option>
            <option value="SUSPENDED_NEGLIGENT">Suspendidos con Multa</option>
            <option value="BAN_PERMANENT">Baneados Permanentemente</option>
          </select>
        </div>
      </div>

      {/* TABLA DE PROPIEDADES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
            Cargando listado de inmuebles y auditorías...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <Home className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-bold">No se encontraron propiedades registradas con ese criterio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="p-4">Inmueble</th>
                  <th className="p-4">Propietario (DNI / WhatsApp)</th>
                  <th className="p-4">Calendario Declarado</th>
                  <th className="p-4">Precio / Noche</th>
                  <th className="p-4">Estado / Blindaje</th>
                  <th className="p-4 text-right">Acciones de Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-950/60 transition-colors">
                    
                    {/* Inmueble */}
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-white text-sm">{p.title}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Home className="w-3 h-3 text-cyan-400" />
                        <span>{p.property_type} • {p.address}</span>
                      </p>
                    </td>

                    {/* Propietario */}
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-slate-200">{p.owner_name}</p>
                      <p className="text-[11px] font-mono text-slate-400">DNI: {p.owner_dni}</p>
                      <p className="text-[11px] font-mono text-emerald-400">WA: {p.owner_phone}</p>
                    </td>

                    {/* Calendario */}
                    <td className="p-4 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-amber-300 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{p.available_from} ➔ {p.available_to}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">Declaración Jurada Aceptada</span>
                    </td>

                    {/* Precio */}
                    <td className="p-4 font-mono font-bold text-amber-400 text-sm">
                      ${Number(p.price_per_night).toLocaleString("es-AR")}
                    </td>

                    {/* Estado */}
                    <td className="p-4">
                      {(p.status === "DISPONIBLE" || p.status === "ACTIVE" || !p.status) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3" /> DISPONIBLE
                        </span>
                      )}
                      {p.status === "OCUPADO" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold">
                          🔴 OCUPADO
                        </span>
                      )}
                      {p.status === "EN_REPARACION" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-extrabold">
                          🔧 EN REPARACIÓN
                        </span>
                      )}
                      {p.status === "EN_PREPARACION" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold">
                          🧹 EN PREPARACIÓN
                        </span>
                      )}
                      {p.status === "SUSPENDED_NEGLIGENT" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-extrabold">
                          <AlertTriangle className="w-3 h-3" /> MULTA / NEGLIGENCIA
                        </span>
                      )}
                      {p.status === "BAN_PERMANENT" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold">
                          <Ban className="w-3 h-3" /> BANEO PERMANENTE
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="p-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <select
                          disabled={processingId === p.id}
                          value={p.status || "DISPONIBLE"}
                          onChange={(e) => handleAction(p.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-bold text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="DISPONIBLE">🟢 Disponible</option>
                          <option value="OCUPADO">🔴 Ocupado</option>
                          <option value="EN_REPARACION">🔧 En Reparación</option>
                          <option value="EN_PREPARACION">🧹 En Preparación</option>
                          <option value="SUSPENDED_NEGLIGENT">⚠️ Aplicar Multa</option>
                          <option value="BAN_PERMANENT">🚫 Banear Propietario</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
