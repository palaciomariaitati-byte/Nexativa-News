"use client";

import React, { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Play } from "lucide-react";

export default function ImportBusinessesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /**
   * Parser inteligente para planillas Excel (Copiar y Pegar o CSV/TSV)
   * Mapea exactamente las columnas de tu Excel:
   * Col 1: COMERCIO (Nombre)
   * Col 2: ACTIVIDAD (Rubro / Categoría)
   * Col 3: DIRECCIÓN (Dirección física)
   * Col 4: LOCALIDAD (Ciudad)
   * Col 5: TELÉFONO (Teléfono / Celular / WhatsApp)
   * Col 6: EMAIL (Correo electrónico)
   * Col 7: FACEBOOK / REDES (Página web / Redes)
   * Col 8: ESTADO (Plan / Categoría)
   */
  const parseCSVOrText = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Detectar separador (tabulación de Excel \t, punto y coma ;, o coma ,)
    const firstLine = lines[0];
    let separator = "\t";
    if (firstLine.includes("\t")) separator = "\t";
    else if (firstLine.includes(";")) separator = ";";
    else if (firstLine.includes(",")) separator = ",";

    const headers = firstLine.split(separator).map((h) => h.trim().toLowerCase());
    
    // Comprobar si la primera fila es la fila de encabezados del Excel
    const isHeaderRow = headers.some((h) =>
      ["comercio", "actividad", "direccion", "localidad", "telefono", "email", "facebook"].includes(h)
    );

    const startIndex = isHeaderRow ? 1 : 0;
    const items: any[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length === 0 || !cols[0]) continue;

      let name = "";
      let category = "";
      let address = "";
      let city = "";
      let phone = "";
      let whatsapp = "";
      let email = "";
      let website = "";
      let tier = "BRONCE";

      if (isHeaderRow) {
        headers.forEach((h, index) => {
          const val = cols[index] || "";
          if (h.includes("comercio") || h.includes("nombre") || h === "name") name = val;
          else if (h.includes("actividad") || h.includes("rubro") || h.includes("categoria")) category = val;
          else if (h.includes("direccion") || h.includes("address")) address = val;
          else if (h.includes("localidad") || h.includes("ciudad") || h.includes("city")) city = val;
          else if (h.includes("telefono") || h.includes("phone") || h.includes("celular") || h.includes("whatsapp")) {
            phone = val;
            whatsapp = val.replace(/[^0-9]/g, ""); // Limpiar solo números para WhatsApp
          }
          else if (h.includes("email") || h.includes("correo")) email = val;
          else if (h.includes("facebook") || h.includes("redes") || h.includes("web")) website = val;
          else if (h.includes("estado") || h.includes("tier")) tier = val.toUpperCase();
        });
      } else {
        // Asignación directa por posición exacta de la planilla Excel
        name = cols[0] || "Comercio Local";
        category = cols[1] || "Servicios Generales";
        address = cols[2] || "Ituzaingó";
        city = cols[3] || "Ituzaingó";
        phone = cols[4] || "";
        whatsapp = (cols[4] || "").replace(/[^0-9]/g, "");
        email = cols[5] || "";
        website = cols[6] || "";
        tier = cols[7] ? cols[7].toUpperCase() : "BRONCE";
      }

      if (name) {
        items.push({
          name,
          category: category || "Servicios Generales",
          address: address || "Ituzaingó, Corrientes",
          city: city || "Ituzaingó",
          phone: phone || null,
          whatsapp: whatsapp || phone || null,
          email: email || null,
          website: website || null,
          tier: ["BRONCE", "PLATA", "ORO"].includes(tier) ? tier : "BRONCE",
          description: `Comercio socio verificado en el rubro ${category || 'local'}.`,
        });
      }
    }

    return items;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setPastedText(content);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleImportSubmit = async () => {
    if (!pastedText.trim()) {
      setStatusMessage({ type: "error", text: "Por favor copiá y pegá las filas de tu Excel o seleccioná un archivo CSV/TSV." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const parsedBusinesses = parseCSVOrText(pastedText);

      if (parsedBusinesses.length === 0) {
        setStatusMessage({ type: "error", text: "No se pudieron reconocer datos en la planilla. Verificá que las filas contengan información." });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/import-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businesses: parsedBusinesses }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `🎉 ¡Éxito! Se reconocieron e importaron ${data.count} comercios socios perfectamente mapeados (COMERCIO, ACTIVIDAD, DIRECCION, LOCALIDAD, TELEFONO, EMAIL, FACEBOOK).`,
        });
        setPastedText("");
        setFile(null);
      } else {
        setStatusMessage({ type: "error", text: data.error || "Error al procesar la importación." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Error al conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAll = async () => {
    setPublishing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/import-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_all" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: "🚀 ¡Publicación Global Exitosa! Todos los comercios importados de la planilla ya están activos en las Páginas Amarillas.",
        });
      } else {
        setStatusMessage({ type: "error", text: data.error || "Error al publicar comercios." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Error en la publicación masiva." });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="inline-block font-sans">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow border border-emerald-500/30 text-xs sm:text-sm transition-all flex items-center gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>📥 Importar Planilla Excel de Socios</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-gray-100">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Importador Masivo de Planilla de Socios (Excel Exacto)</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-emerald-300">
              <p className="font-bold mb-1">📋 Mapeo de Columnas Detectadas de tu Excel:</p>
              <p className="font-mono text-[11px]">
                1. COMERCIO | 2. ACTIVIDAD | 3. DIRECCION | 4. LOCALIDAD | 5. TELEFONO | 6. EMAIL | 7. FACEBOOK / REDES | 8. ESTADO
              </p>
            </div>

            {/* Subir Archivo */}
            <div className="border-2 border-dashed border-gray-700 hover:border-emerald-500/50 rounded-xl p-4 text-center bg-gray-950/40">
              <input
                type="file"
                accept=".csv, .txt, .tsv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <Upload className="w-7 h-7 text-emerald-400" />
                <span className="text-xs font-semibold text-gray-300">
                  {file ? `Archivo seleccionado: ${file.name}` : "Hacé clic aquí para seleccionar tu archivo CSV/TSV guardado de Excel"}
                </span>
              </label>
            </div>

            {/* O pegar directamente las celdas marcadas en Excel */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                O Copiá todas las celdas de tu Excel (incluyendo los encabezados) y pegalas aquí directamente:
              </label>
              <textarea
                rows={6}
                placeholder="Seleccioná todas las celdas de tu Excel (Ctrl+A o arrastrar mouse), copiá (Ctrl+C) y pegá (Ctrl+V) en esta caja..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Mensajes de Estado */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/60 border border-rose-500/40 text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={handlePublishAll}
                disabled={publishing}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{publishing ? "Publicando..." : "🚀 Publicar Todo a Páginas Amarillas"}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
                >
                  {loading ? "Importando..." : "📥 Procesar e Importar Planilla"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
