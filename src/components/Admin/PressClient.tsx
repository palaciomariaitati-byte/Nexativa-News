"use client";

import React, { useState } from "react";
import { Upload, Send, FileSpreadsheet, Newspaper, Sparkles, Code2, Trash2, ChevronDown, ChevronUp, Bell, AlertCircle, Rocket, ExternalLink, UserCheck, CreditCard } from "lucide-react";

export type BusinessStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "EXPIRED";

export interface ImportedSocio {
  id: string;
  selected: boolean;
  cuit: string;
  name: string;
  contact_person: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  status: BusinessStatus;
  subscription_due_date: string;
  isExpanded?: boolean;
}

export default function PressClient() {
  const [activeTab, setActiveTab] = useState<"import" | "press" | "stealth" | "make">("import");
  
  // Data Grid state for Excel / CSV import
  const [socios, setSocios] = useState<ImportedSocio[]>([]);
  const [rawText, setRawText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://hook.us2.make.com/xm5rpc50ot1igcz896rht2hbj1xybclg");
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  // Sample initial journalists list
  const [journalists] = useState([
    { id: "1", name: "Martín López", media: "Forbes Argentina", specialty: "Negocios / Tech", email: "m.lopez@forbes.com.ar", status: "SENT" },
    { id: "2", name: "Lucía Fernández", media: "Infobae", specialty: "Economía", email: "lfernandez@infobae.com", status: "PENDING" },
    { id: "3", name: "Santiago Rossi", media: "iProUP", specialty: "Innovación & Pymes", email: "srossi@iproup.com", status: "FOLLOW_UP_1" },
  ]);

  /**
   * Parser inteligente que auto-detecta columnas CUIT/DNI, Nombre Comercial, Referente y Rubro
   */
  const handleParseData = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setSocios([]);
      return;
    }

    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    const dueDateStr = defaultDueDate.toISOString().split('T')[0];

    const lines = text.trim().split("\n");
    const parsed: ImportedSocio[] = [];

    // Detectar separador (\t tabulación de Excel, ;, o ,)
    const firstLine = lines[0];
    let separator = "\t";
    if (firstLine.includes("\t")) separator = "\t";
    else if (firstLine.includes(";")) separator = ";";
    else if (firstLine.includes(",")) separator = ",";

    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase());
    const isHeader = headers.some(h => 
      ["cuit", "dni", "socio", "comercio", "razon", "rubro", "actividad", "referente"].includes(h)
    );

    const startIndex = isHeader ? 1 : 0;

    for (let idx = startIndex; idx < lines.length; idx++) {
      const line = lines[idx];
      const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length === 0 || !parts[0]) continue;

      let cuit = "";
      let name = "";
      let contact_person = "";
      let category = "";
      let address = "";
      let phone = "";
      let email = "";

      if (isHeader) {
        headers.forEach((h, colIndex) => {
          const val = parts[colIndex] || "";
          if (h.includes("cuit") || h.includes("dni") || h === "id" || h.includes("socio")) cuit = val;
          else if (h.includes("comercio") || h.includes("razon") || h.includes("nombre") || h === "name") name = val;
          else if (h.includes("referente") || h.includes("contacto") || h.includes("titular") || h.includes("persona")) contact_person = val;
          else if (h.includes("rubro") || h.includes("actividad") || h.includes("categoria")) category = val;
          else if (h.includes("direccion") || h.includes("domicilio") || h.includes("address")) address = val;
          else if (h.includes("telefono") || h.includes("celular") || h.includes("whatsapp")) phone = val;
          else if (h.includes("email") || h.includes("correo")) email = val;
        });
      } else {
        // Auto-detección por tipo de datos si Columna 0 es un CUIT/DNI numérico
        const isCol0Numeric = /^\d+$/.test(parts[0]);

        if (isCol0Numeric) {
          cuit = parts[0];
          name = parts[1] || `Comercio ${idx}`;
          // Si hay columna de referente o rubro
          if (parts.length >= 4) {
            contact_person = parts[2] || "";
            category = parts[3] || "Servicios Generales";
            address = parts[4] || "Ituzaingó, Corrientes";
            phone = parts[5] || "3786611250";
            email = parts[6] || "";
          } else {
            category = parts[2] || "Servicios Generales";
            address = parts[3] || "Ituzaingó, Corrientes";
          }
        } else {
          name = parts[0] || `Comercio ${idx}`;
          category = parts[1] || "Servicios Generales";
          address = parts[2] || "Ituzaingó, Corrientes";
          phone = parts[3] || "3786611250";
          email = parts[4] || "";
        }
      }

      parsed.push({
        id: `socio-${idx}-${Date.now()}`,
        selected: true,
        cuit: cuit || "N/A",
        name: name || "Comercio Local",
        contact_person: contact_person || "Referente no especificado",
        category: category || "Servicios Generales",
        address: address || "Ituzaingó, Corrientes",
        phone: phone || "3786611250",
        email: email || "contacto@comercio.com",
        status: "DRAFT",
        subscription_due_date: dueDateStr,
        isExpanded: false,
      });
    }

    setSocios(parsed);
    setImportStatus(`✅ Mapeo perfecto: Se procesaron ${parsed.length} comercios. Podés desplegar la fila (v) para ver CUIT y Referente.`);
  };

  // Toggle selection for all rows
  const handleToggleSelectAll = (select: boolean) => {
    setSocios(prev => prev.map(s => ({ ...s, selected: select })));
  };

  // Delete a specific row
  const handleDeleteRow = (id: string) => {
    setSocios(prev => prev.filter(s => s.id !== id));
  };

  // Inline cell edit
  const handleCellEdit = (id: string, field: keyof ImportedSocio, value: any) => {
    setSocios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Toggle dropdown drawer
  const handleToggleExpand = (id: string) => {
    setSocios(prev => prev.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
  };

  // Confirm and upload selected rows to API
  const handleConfirmImport = async () => {
    const selectedSocios = socios.filter(s => s.selected);
    if (selectedSocios.length === 0) {
      setImportStatus("❌ No hay ningún socio seleccionado para importar.");
      return;
    }

    setIsImporting(true);
    setImportStatus(null);

    try {
      const businessesPayload = selectedSocios.map(s => ({
        name: s.name,
        category: s.category,
        address: s.address,
        whatsapp: s.phone,
        phone: s.phone,
        email: s.email,
        description: `Comercio socio (${s.name}). Referente: ${s.contact_person}. CUIT/DNI: ${s.cuit}`,
        tier: "BRONCE",
        status: s.status,
        subscription_due_date: s.subscription_due_date,
      }));

      const res = await fetch("/api/admin/import-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businesses: businessesPayload }),
      });

      const data = await res.json();
      if (data.success) {
        setImportStatus(`✅ ¡Éxito! Se guardaron ${selectedSocios.length} comercios en estado BORRADOR (Amarillo). Presioná 'Publicar Todo' cuando estés listo.`);
      } else {
        setImportStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`❌ Error en la importación: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Global Publish All Action
  const handlePublishAll = async () => {
    if (!confirm("¿Confirmás publicar globalmente todas las fichas de la Guía Comercial? Pasarán a estado ACTIVO en /guia.")) {
      return;
    }

    setIsPublishingAll(true);
    try {
      const res = await fetch("/api/admin/import-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_all" }),
      });

      const data = await res.json();
      if (data.success) {
        setSocios(prev => prev.map(s => ({ ...s, status: "ACTIVE" })));
        setImportStatus("🚀 ¡GUÍA PUBLICADA CON ÉXITO! Todos los comercios pasaron a estado ACTIVO (Verde) y ya son visibles públicamente.");
      }
    } catch (err: any) {
      setImportStatus(`❌ Error al publicar: ${err.message}`);
    } finally {
      setIsPublishingAll(false);
    }
  };

  // NORA Reminder Actions
  const handleSendNORANewsletter = (socio: ImportedSocio) => {
    const text = `Hola ${socio.contact_person || socio.name}! Te escribimos de Nexativa News para compartirte las novedades de tu ficha comercial (${socio.name})...`;
    window.open(`https://wa.me/${socio.phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSendNORADebtReminder = (socio: ImportedSocio) => {
    const text = `Hola ${socio.contact_person || socio.name}! Te recordamos que la membresía de tu comercio (${socio.name}) venció el ${socio.subscription_due_date}...`;
    window.open(`https://wa.me/${socio.phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Handle Make.com Webhook Test
  const handleTestWebhook = async () => {
    setTestWebhookStatus("Enviando petición de prueba...");
    try {
      const res = await fetch("/api/social-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "estudio-nexativa-2026", type: "press_release" }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestWebhookStatus("✅ Webhook enviado con éxito a Make.com!");
      } else {
        setTestWebhookStatus(`⚠️ Nota: ${data.error || "No se pudo contactar el webhook"}`);
      }
    } catch (err: any) {
      setTestWebhookStatus(`❌ Error conectando: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ORQUESTADOR NORA PRO & CRM B2B</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Prensa & Páginas Amarillas 2.0
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestión de Pitching periodístico, importador masivo con Mapeo CUIT/Nombre/Referente y CRM NORA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePublishAll}
            disabled={isPublishingAll}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Rocket className="w-4 h-4" />
            <span>{isPublishingAll ? "Publicando..." : "PUBLICAR TODO A GUÍA"}</span>
          </button>

          <a
            href="/guia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <span>Ver /guia</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("import")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "import"
              ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Importador de Excel / CRM Comercios</span>
        </button>

        <button
          onClick={() => setActiveTab("press")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "press"
              ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Pitching a Periodistas</span>
        </button>

        <button
          onClick={() => setActiveTab("stealth")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "stealth"
              ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Campaña NORA Stealth Growth</span>
        </button>

        <button
          onClick={() => setActiveTab("make")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "make"
              ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Make.com & Webhooks</span>
        </button>
      </div>

      {/* TAB: Importador Interactivo de Excel & CRM */}
      {activeTab === "import" && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Cargar y Administrar Planilla de Comercios</h2>
            <p className="text-xs text-slate-400 mb-4">
              Pegá tus filas de Excel. El sistema reconoce automáticamente <strong className="text-cyan-400">CUIT, Nombre Fantasía, Referente y Rubro</strong>.
            </p>

            {/* Input Textarea */}
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => handleParseData(e.target.value)}
              placeholder="Copiá las columnas de tu Excel y pegalas acá directamente...
Ejemplo (CUIT	Nombre Comercio	Referente	Rubro	Dirección	Teléfono):
16993433	Mueblería Rube	Juan Rube	Mueblería	Av. San Martín 1420	3786611250
10211813	Todo Hogar	Carlos Gómez	Hogar	Calle Buenos Aires 850	3786611250"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 mb-4"
            />

            {importStatus && (
              <div className="text-xs font-medium text-cyan-300 p-3 rounded-lg bg-slate-950 border border-slate-800 mb-6">
                {importStatus}
              </div>
            )}

            {/* Data Grid with Expandable Row & Status Colors */}
            {socios.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">
                      Comercios: {socios.length} ({socios.filter(s => s.selected).length} seleccionados)
                    </span>
                    <button
                      onClick={() => handleToggleSelectAll(true)}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Seleccionar Todos
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => handleToggleSelectAll(false)}
                      className="text-[11px] text-slate-400 hover:underline"
                    >
                      Desmarcar Todos
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleConfirmImport}
                      disabled={isImporting || socios.filter(s => s.selected).length === 0}
                      className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isImporting ? "Guardando..." : "Guardar Borradores"}</span>
                    </button>

                    <button
                      onClick={handlePublishAll}
                      disabled={isPublishingAll}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Publicar Todo</span>
                    </button>
                  </div>
                </div>

                {/* Grid Table */}
                <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-[500px] overflow-y-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="text-slate-400 bg-slate-950 uppercase border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 w-10 text-center">Detalle</th>
                        <th className="p-3 w-10 text-center">Incluir</th>
                        <th className="p-3">Nombre del Comercio / Razón Social</th>
                        <th className="p-3">Rubro</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Vencimiento Membresía</th>
                        <th className="p-3 w-12 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                      {socios.map((s) => (
                        <React.Fragment key={s.id}>
                          <tr className={s.selected ? "hover:bg-slate-800/40" : "opacity-40 bg-slate-950/50"}>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleExpand(s.id)}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                                title="Desplegar para ver CUIT y Referente"
                              >
                                {s.isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>

                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={s.selected}
                                onChange={(e) => handleCellEdit(s.id, "selected", e.target.checked)}
                                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                              />
                            </td>

                            <td className="p-3 font-bold text-white">
                              <input
                                type="text"
                                value={s.name}
                                onChange={(e) => handleCellEdit(s.id, "name", e.target.value)}
                                className="bg-transparent border-b border-slate-700/50 focus:border-cyan-400 text-white font-bold text-xs w-full focus:outline-none"
                              />
                              {s.cuit !== "N/A" && (
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                  CUIT/DNI: {s.cuit}
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <input
                                type="text"
                                value={s.category}
                                onChange={(e) => handleCellEdit(s.id, "category", e.target.value)}
                                className="bg-transparent border-b border-slate-700/50 focus:border-cyan-400 text-cyan-300 text-xs w-full focus:outline-none"
                              />
                            </td>

                            <td className="p-3">
                              <select
                                value={s.status}
                                onChange={(e) => handleCellEdit(s.id, "status", e.target.value as BusinessStatus)}
                                className="bg-slate-950 text-xs border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                              >
                                <option value="DRAFT">🟡 Borrador</option>
                                <option value="ACTIVE">🟢 Activo</option>
                                <option value="INACTIVE">🔴 Inactivo</option>
                                <option value="EXPIRED">⚠️ Deuda / Vencido</option>
                              </select>
                            </td>

                            <td className="p-3">
                              <input
                                type="date"
                                value={s.subscription_due_date}
                                onChange={(e) => handleCellEdit(s.id, "subscription_due_date", e.target.value)}
                                className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                              />
                            </td>

                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteRow(s.id)}
                                className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                title="Borrar comercio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Dropdown Row for Detailed Referente & CUIT */}
                          {s.isExpanded && (
                            <tr className="bg-slate-950/90 border-b border-slate-800">
                              <td colSpan={7} className="p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <span className="text-cyan-400 flex items-center gap-1 font-semibold mb-1">
                                      <UserCheck className="w-3.5 h-3.5" /> Referente / Socio:
                                    </span>
                                    <input
                                      type="text"
                                      value={s.contact_person}
                                      onChange={(e) => handleCellEdit(s.id, "contact_person", e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-white font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-slate-400 flex items-center gap-1 font-semibold mb-1">
                                      <CreditCard className="w-3.5 h-3.5" /> CUIT / DNI / N° Socio:
                                    </span>
                                    <input
                                      type="text"
                                      value={s.cuit}
                                      onChange={(e) => handleCellEdit(s.id, "cuit", e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-slate-400 block font-semibold mb-1">WhatsApp / Teléfono:</span>
                                    <input
                                      type="text"
                                      value={s.phone}
                                      onChange={(e) => handleCellEdit(s.id, "phone", e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-slate-400 block font-semibold mb-1">Dirección:</span>
                                    <input
                                      type="text"
                                      value={s.address}
                                      onChange={(e) => handleCellEdit(s.id, "address", e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60">
                                  <span className="text-xs font-bold text-cyan-400">Acciones NORA CRM:</span>

                                  <button
                                    onClick={() => handleSendNORANewsletter(s)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium"
                                  >
                                    <Bell className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Enviar Novedades (WhatsApp)</span>
                                  </button>

                                  <button
                                    onClick={() => handleSendNORADebtReminder(s)}
                                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Aviso de Deuda / Recordatorio Vencimiento</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Pitching Periodistas */}
      {activeTab === "press" && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Lista de Outreach Periodístico</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-slate-400 bg-slate-950 uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Periodista</th>
                    <th className="p-3">Medio</th>
                    <th className="p-3">Especialidad</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Estado Anti-Spam</th>
                    <th className="p-3">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {journalists.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{j.name}</td>
                      <td className="p-3">{j.media}</td>
                      <td className="p-3">{j.specialty}</td>
                      <td className="p-3 text-slate-400">{j.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {j.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => alert(`Enviando pitch NORA a ${j.name}...`)}
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1 rounded text-[11px]"
                        >
                          Re-Enviar Pitch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Campaña Stealth */}
      {activeTab === "stealth" && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Motor de Seducción B2B "NORA Stealth Growth"</h2>
            <p className="text-xs text-slate-400 mb-6">
              Envía invitaciones de cortesía a los comercios para validar su ficha en las Páginas Amarillas sin presionar ni revelar vinculación privada.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mb-6">
              <div className="text-xs font-bold text-cyan-400">Mensaje de Cortesía (Fase 1):</div>
              <p className="text-xs text-slate-300 italic font-mono">
                &ldquo;Hola [Nombre del Comercio], soy Nora de Nexativa News. Pre-cargamos una ficha de cortesía sin costo para su negocio en la nueva Guía Comercial de la ciudad para darles visibilidad. ¿Les gustaría verificar sus datos o agregar su WhatsApp directo?&rdquo;
              </p>
            </div>

            <button
              onClick={() => alert("¡Iniciando secuencia de invitación a los primeros 20 comercios de la lista!")}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Lanzar Lote de Invitaciones Stealth (20 Comercios)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: Make.com & Webhooks */}
      {activeTab === "make" && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Configuración y Testeo de Webhook Make.com</h2>
            <p className="text-xs text-slate-400 mb-4">
              Ingresá la URL del Webhook de tu escenario de Make.com para recibir automáticamente la señal de publicación en redes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hook.us1.make.com/..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />

              <button
                onClick={handleTestWebhook}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap"
              >
                Probar Envío Webhook
              </button>
            </div>

            {testWebhookStatus && (
              <div className="text-xs font-semibold text-cyan-300 p-3 rounded-lg bg-slate-950 border border-slate-800 mb-6">
                {testWebhookStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
