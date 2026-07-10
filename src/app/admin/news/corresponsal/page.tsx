"use client";

import React, { useEffect, useState } from "react";
import { 
  fetchStagingQueue, 
  fetchEditorialAlerts, 
  deleteStagingItem, 
  updateStagingItem, 
  getPartnerWebhookUrl, 
  savePartnerWebhookUrl, 
  approveStagingItem,
  StagingQueueItem,
  EditorialAlert
} from "../../actions/corresponsal";
import { 
  MapPin, 
  User, 
  Calendar, 
  Check, 
  Trash2, 
  Settings, 
  AlertTriangle, 
  ExternalLink, 
  FileText, 
  Edit, 
  Save, 
  RefreshCw, 
  Info,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getClosestLocation, parseCoordinates } from "@/lib/location-db";

export default function CorresponsalStagingPage() {
  const [queue, setQueue] = useState<StagingQueueItem[]>([]);
  const [alerts, setAlerts] = useState<EditorialAlert[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [activeTab, setActiveTab] = useState<Record<string, 'nexativa' | 'partner'>>({});
  
  // Staging item editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNexativaTitle, setEditNexativaTitle] = useState("");
  const [editNexativaExcerpt, setEditNexativaExcerpt] = useState("");
  const [editNexativaContent, setEditNexativaContent] = useState("");
  const [editPartnerTitle, setEditPartnerTitle] = useState("");
  const [editPartnerContent, setEditPartnerContent] = useState("");

  // UI state for showing/hiding transcriptions
  const [showTranscript, setShowTranscript] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveWebhookSuccess, setSaveWebhookSuccess] = useState(false);

  // Error/Success banners
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setLoading(true);
    setMigrationRequired(false);
    try {
      const queueData = await fetchStagingQueue();
      setQueue(queueData);
      
      const alertData = await fetchEditorialAlerts();
      setAlerts(alertData);

      const url = await getPartnerWebhookUrl();
      setWebhookUrl(url);

      // Initialize active tabs for items
      const tabs: Record<string, 'nexativa' | 'partner'> = {};
      queueData.forEach(item => {
        tabs[item.id] = 'nexativa';
      });
      setActiveTab(tabs);
    } catch (err: any) {
      if (err.message === "MIGRATION_REQUIRED") {
        setMigrationRequired(true);
      } else {
        setErrorBanner("Error cargando los datos: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePartnerWebhookUrl(webhookUrl);
      setSaveWebhookSuccess(true);
      setTimeout(() => setSaveWebhookSuccess(false), 3000);
    } catch (err: any) {
      alert("Error al guardar Webhook: " + err.message);
    }
  };

  const handleStartEdit = (item: StagingQueueItem) => {
    setEditingId(item.id);
    setEditNexativaTitle(item.version_nexativa?.title || "");
    setEditNexativaExcerpt(item.version_nexativa?.excerpt || "");
    setEditNexativaContent(item.version_nexativa?.content || "");
    setEditPartnerTitle(item.version_partner?.title || "");
    setEditPartnerContent(item.version_partner?.content || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setActionLoadingId(id);
      const item = queue.find(q => q.id === id);
      if (!item) return;

      const updatedNexativa = item.version_nexativa ? {
        ...item.version_nexativa,
        title: editNexativaTitle,
        excerpt: editNexativaExcerpt,
        content: editNexativaContent
      } : null;

      const updatedPartner = item.version_partner ? {
        ...item.version_partner,
        title: editPartnerTitle,
        content: editPartnerContent
      } : null;

      await updateStagingItem(id, updatedNexativa, updatedPartner);
      
      // Update local state
      setQueue(queue.map(q => {
        if (q.id === id) {
          return {
            ...q,
            version_nexativa: updatedNexativa,
            version_partner: updatedPartner
          };
        }
        return q;
      }));

      setEditingId(null);
      setSuccessBanner("Artículo actualizado localmente en la cola.");
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      setErrorBanner("Error al guardar cambios: " + err.message);
      setTimeout(() => setErrorBanner(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte de corresponsal? Se descartarán las versiones generadas.")) {
      return;
    }

    try {
      setActionLoadingId(id);
      await deleteStagingItem(id);
      setQueue(queue.filter(q => q.id !== id));
      setSuccessBanner("Reporte eliminado de la cola.");
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      setErrorBanner("Error al eliminar: " + err.message);
      setTimeout(() => setErrorBanner(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (id: string, actionType: "APPROVE_NEXATIVA_ONLY" | "APPROVE_PARTNER_ONLY" | "APPROVE_ALL_SIMULTANEOUS") => {
    try {
      setActionLoadingId(id);
      setErrorBanner(null);
      setSuccessBanner(null);
      
      const res = await approveStagingItem(id, actionType);
      
      if (res.success) {
        let msg = "";
        if (actionType === "APPROVE_NEXATIVA_ONLY") msg = "Publicado exitosamente en Nexativa News.";
        else if (actionType === "APPROVE_PARTNER_ONLY") msg = "Despachado exitosamente al socio.";
        else msg = "Publicado en Nexativa News y despachado al socio simultáneamente.";

        if (res.webhookError) {
          msg += ` (Advertencia: Falló el webhook del socio: ${res.webhookError})`;
          setErrorBanner(`Fallo de Webhook: ${res.webhookError}`);
        } else {
          setSuccessBanner(msg);
          setTimeout(() => setSuccessBanner(null), 5000);
        }

        // Reload data to show updated statuses
        await loadPageData();
      } else {
        setErrorBanner("Fallo en la aprobación: " + res.error);
      }
    } catch (err: any) {
      setErrorBanner("Ocurrió un error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleTranscript = (id: string) => {
    setShowTranscript(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pendiente de Revisión</span>;
      case "APPROVED_NEXATIVA_ONLY":
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Aprobado Nexativa</span>;
      case "APPROVED_PARTNER_ONLY":
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Aprobado Socio</span>;
      case "APPROVED_ALL_SIMULTANEOUS":
        return <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Publicado & Despachado</span>;
      case "AUDIO_ERROR_MANUAL_REVIEW_REQUIRED":
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Error de Audio (Revisión Manual)</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-300 border border-gray-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  // Render migration requirement box
  if (migrationRequired) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Cola de Corresponsalía</h1>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-white space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400 w-8 h-8" />
            <h2 className="text-xl font-bold">Esquema de Base de Datos Pendiente</h2>
          </div>
          <p className="text-white/70">
            Falta crear las tablas de base de datos (`editorial_staging_queue` y `editorial_alerts`) necesarias para almacenar los borradores del corresponsal en staging.
          </p>
          <div className="bg-black/40 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-white/10 space-y-2">
            <p className="text-yellow-400 font-bold">// INSTRUCCIONES:</p>
            <p>1. Copia las sentencias SQL del archivo ubicado en la raíz del proyecto:</p>
            <p className="text-indigo-400 underline">create_editorial_staging.sql</p>
            <p>2. Pégalas en el "SQL Editor" de tu consola de administración de Supabase.</p>
            <p>3. Presiona el botón "Run".</p>
          </div>
          <button 
            onClick={loadPageData} 
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar Carga
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">Cola de Corresponsalía</h1>
          <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Staging Buffer Editorial & Copias Periodísticas</p>
        </div>
        
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4 text-[var(--color-brand-accent)]" />
          {settingsOpen ? "Cerrar Configuración" : "Configurar Socio Webhook"}
        </button>
      </div>

      {/* Settings Form */}
      {settingsOpen && (
        <form onSubmit={handleSaveWebhook} className="bg-black/30 border border-white/10 p-6 rounded-xl space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Settings className="text-[var(--color-brand-accent)] w-5 h-5" />
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Configuración de Distribución de Socios</h3>
          </div>
          <div className="space-y-2">
            <label className="block text-xs uppercase text-white/60 font-bold">Webhook URL del Socio Periodístico</label>
            <div className="flex gap-3">
              <input
                type="url"
                required
                placeholder="https://api.ejemplosocio.com/v1/posts-webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--color-brand-accent)]"
              />
              <button
                type="submit"
                className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black font-bold px-6 py-2 rounded-lg transition-colors text-sm uppercase tracking-wider"
              >
                Guardar
              </button>
            </div>
            <p className="text-[11px] text-white/50">
              Esta URL recibirá peticiones POST con el contenido de la Versión Socio en formato borrador (draft) cuando sea aprobada.
            </p>
          </div>
          {saveWebhookSuccess && (
            <div className="bg-green-500/20 text-green-300 border border-green-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider animate-pulse">
              ✓ Configuración guardada con éxito
            </div>
          )}
        </form>
      )}

      {/* Notifications */}
      {successBanner && (
        <div className="bg-green-500/20 text-green-300 border border-green-500/30 p-4 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successBanner}
        </div>
      )}
      {errorBanner && (
        <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-4 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {errorBanner}
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="text-center p-12 text-white/50 uppercase tracking-widest text-sm animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          Cargando cola de corresponsalía...
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center p-12 bg-black/10 border border-white/5 rounded-xl text-white/50 uppercase tracking-widest text-sm">
          No hay reportes de corresponsales en la cola de revisión.
        </div>
      ) : (
        <div className="space-y-8">
          {queue.map((item) => {
            const coords = parseCoordinates(item.geolocation_coordinates);
            const location = getClosestLocation(coords.lat, coords.lng);
            const isEditing = editingId === item.id;

            return (
              <div 
                key={item.id} 
                className={`glass-panel border rounded-xl overflow-hidden shadow-lg transition-all ${
                  item.status === 'PENDING_REVIEW' 
                    ? 'border-white/10 hover:border-amber-500/30 shadow-black/30' 
                    : item.status === 'AUDIO_ERROR_MANUAL_REVIEW_REQUIRED'
                    ? 'border-red-500/20 hover:border-red-500/40 shadow-red-950/10'
                    : 'border-white/5 bg-white/[0.02] opacity-70'
                }`}
              >
                {/* Meta Panel (Top bar) */}
                <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                      <User className="w-4 h-4 text-[var(--color-brand-accent)]" />
                      <span className="font-bold">ID Operador:</span>
                      <span className="font-mono text-xs">{item.operator_id.substring(0, 8)}...</span>
                    </div>

                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="w-4 h-4 text-[var(--color-brand-accent)]" />
                      <span className="font-bold">Ubicación:</span>
                      <span 
                        title={`Coordenadas exactas: ${item.geolocation_coordinates}`} 
                        className="underline decoration-dotted decoration-white/30 cursor-help"
                      >
                        {location?.name || "Corrientes / Ituzaingó"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="w-4 h-4 text-[var(--color-brand-accent)]" />
                      <span className="font-bold">Fecha:</span>
                      <span>{new Date(item.created_at).toLocaleString("es-AR")}</span>
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6">
                  {/* Title references & Media images */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic details */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-xs uppercase text-white/40 font-bold tracking-wider">Referencia de Título de Campo</h4>
                        <p className="text-white font-medium text-lg mt-1">{item.raw_metadata_title || "Sin título de referencia"}</p>
                      </div>

                      {/* Toggleable Transcription Box */}
                      <div className="bg-black/30 border border-white/5 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleTranscript(item.id)}
                          className="w-full flex justify-between items-center px-4 py-3 bg-white/5 text-xs text-white/70 hover:text-white transition-colors uppercase tracking-wider font-bold"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[var(--color-brand-accent)]" />
                            Transcripción de Audio limpia
                          </span>
                          {showTranscript[item.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        {showTranscript[item.id] && (
                          <div className="p-4 font-mono text-xs text-white/80 leading-relaxed bg-black/60 max-h-48 overflow-y-auto select-all">
                            {item.transcription}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Media images */}
                    <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs uppercase text-white/40 font-bold tracking-wider flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Media Adjunta ({item.attached_media_url?.length || 0})
                      </h4>
                      {item.attached_media_url && item.attached_media_url.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {item.attached_media_url.map((imgUrl, index) => (
                            <a 
                              key={index}
                              href={imgUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group relative aspect-video border border-white/10 rounded overflow-hidden hover:border-[var(--color-brand-accent)] transition-all bg-black/50"
                            >
                              <img 
                                src={imgUrl} 
                                alt={`Media ${index}`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="w-4 h-4 text-white" />
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/30 italic py-4 text-center">Sin imágenes adjuntas</p>
                      )}
                    </div>
                  </div>

                  {/* Versions block */}
                  <hr className="border-white/5" />

                  <div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4">
                      <h3 className="font-bold text-[var(--color-brand-text)] uppercase tracking-wider text-sm">Copias Redactadas (Nora AI)</h3>
                      {!isEditing && (item.status === 'PENDING_REVIEW' || item.status === 'AUDIO_ERROR_MANUAL_REVIEW_REQUIRED') && (
                        <button
                          onClick={() => handleStartEdit(item)}
                          disabled={actionLoadingId !== null}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors font-bold uppercase tracking-wider"
                        >
                          <Edit className="w-3.5 h-3.5 text-[var(--color-brand-accent)]" />
                          Editar Textos
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      /* Editing Interface */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/[0.02] p-4 rounded-xl border border-white/10">
                        {/* Edit Nexativa */}
                        <div className="space-y-4 border-r border-white/5 pr-0 lg:pr-6">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
                            <h4 className="font-bold text-sm uppercase text-white/80">Editar Versión Nexativa (Master)</h4>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-xs uppercase text-white/50 font-bold">Título</label>
                            <input
                              type="text"
                              value={editNexativaTitle}
                              onChange={(e) => setEditNexativaTitle(e.target.value)}
                              className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs uppercase text-white/50 font-bold">Copete (Deck)</label>
                            <textarea
                              value={editNexativaExcerpt}
                              onChange={(e) => setEditNexativaExcerpt(e.target.value)}
                              rows={2}
                              maxLength={150}
                              className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-[10px] text-white/30 text-right">{editNexativaExcerpt.length}/150 caracteres</p>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs uppercase text-white/50 font-bold">Contenido (HTML)</label>
                            <textarea
                              value={editNexativaContent}
                              onChange={(e) => setEditNexativaContent(e.target.value)}
                              rows={8}
                              className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Edit Partner */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-md shadow-purple-500/50" />
                            <h4 className="font-bold text-sm uppercase text-white/80">Editar Versión Socio (Sindicada)</h4>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs uppercase text-white/50 font-bold">Título</label>
                            <input
                              type="text"
                              value={editPartnerTitle}
                              onChange={(e) => setEditPartnerTitle(e.target.value)}
                              className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs uppercase text-white/50 font-bold">Contenido (HTML)</label>
                            <textarea
                              value={editPartnerContent}
                              onChange={(e) => setEditPartnerContent(e.target.value)}
                              rows={11}
                              className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <div className="lg:col-span-2 border-t border-white/5 pt-4 flex justify-end gap-3">
                          <button
                            onClick={handleCancelEdit}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Save className="w-4 h-4" /> Guardar Cambios
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Interface with tabs */
                      <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex border-b border-white/5 bg-white/5">
                          <button
                            onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: 'nexativa' }))}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                              activeTab[item.id] === 'nexativa'
                                ? 'text-blue-400 border-blue-500 bg-blue-500/5'
                                : 'text-white/50 border-transparent hover:text-white/80'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            Versión A (Nexativa Master)
                          </button>
                          <button
                            onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: 'partner' }))}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                              activeTab[item.id] === 'partner'
                                ? 'text-purple-400 border-purple-500 bg-purple-500/5'
                                : 'text-white/50 border-transparent hover:text-white/80'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            Versión B (Socio Alternativo)
                          </button>
                        </div>

                        <div className="p-6">
                          {activeTab[item.id] === 'nexativa' ? (
                            /* Nexativa Display */
                            <div className="space-y-4">
                              {item.version_nexativa ? (
                                <>
                                  <h2 className="text-2xl font-serif text-white font-bold leading-tight">{item.version_nexativa.title}</h2>
                                  
                                  <div className="bg-white/5 p-4 rounded border-l-4 border-[var(--color-brand-accent)] text-white/80 text-sm leading-relaxed italic">
                                    <strong>Copete:</strong> {item.version_nexativa.excerpt}
                                  </div>

                                  <div 
                                    className="text-white/70 text-sm leading-relaxed space-y-3 prose-custom"
                                    dangerouslySetInnerHTML={{ __html: item.version_nexativa.content }}
                                  />

                                  {item.version_nexativa.tags && item.version_nexativa.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                      {item.version_nexativa.tags.map((tag, i) => (
                                        <span key={i} className="bg-blue-900/30 text-blue-300 border border-blue-800/40 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-white/40 italic text-sm">Versión no disponible</p>
                              )}
                            </div>
                          ) : (
                            /* Partner Display */
                            <div className="space-y-4">
                              {item.version_partner ? (
                                <>
                                  <h2 className="text-2xl font-serif text-white font-bold leading-tight">{item.version_partner.title}</h2>
                                  
                                  <div 
                                    className="text-white/70 text-sm leading-relaxed space-y-3 prose-custom"
                                    dangerouslySetInnerHTML={{ __html: item.version_partner.content }}
                                  />

                                  <div className="bg-white/5 p-4 rounded border border-white/10 text-white/50 text-[11px] leading-relaxed italic flex items-center gap-2">
                                    <Info className="w-4 h-4 text-purple-400 shrink-0" />
                                    <span>
                                      <strong>Pie de Atribución (Auto):</strong> Cobertura en exteriores por gentileza de Nexativanews.com.ar
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <p className="text-white/40 italic text-sm">Versión no disponible</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                {(item.status === 'PENDING_REVIEW' || item.status === 'AUDIO_ERROR_MANUAL_REVIEW_REQUIRED') && (
                  <div className="bg-white/[0.02] border-t border-white/10 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={actionLoadingId !== null}
                      className="bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Descartar Reporte
                    </button>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleApprove(item.id, "APPROVE_NEXATIVA_ONLY")}
                        disabled={actionLoadingId !== null}
                        className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        Aprobar Nexativa
                      </button>
                      
                      <button
                        onClick={() => handleApprove(item.id, "APPROVE_PARTNER_ONLY")}
                        disabled={actionLoadingId !== null}
                        className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        Despachar Socio
                      </button>

                      <button
                        onClick={() => handleApprove(item.id, "APPROVE_ALL_SIMULTANEOUS")}
                        disabled={actionLoadingId !== null}
                        className="bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] text-black px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20"
                      >
                        Aprobar Todo Simultáneo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Webhook Alerts Panel */}
      {alerts.length > 0 && (
        <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-red-500/10 pb-3">
            <AlertTriangle className="text-red-400 w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-red-200 uppercase tracking-wider text-sm">Registro de Alertas Críticas (Socio Webhook)</h3>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-black/30 border border-red-500/10 p-4 rounded-lg flex gap-3 text-xs">
                <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center text-white/40">
                    <span className="font-mono text-[10px]">ID Alerta: {alert.id.substring(0, 8)}</span>
                    <span>{new Date(alert.created_at).toLocaleString("es-AR")}</span>
                  </div>
                  <p className="text-red-300 font-bold">{alert.message}</p>
                  {alert.details && (
                    <div className="bg-black/40 p-2.5 rounded font-mono text-[10px] text-white/50 mt-1 whitespace-pre-wrap">
                      URL: {alert.details.partner_webhook_url}<br />
                      Intentos: {alert.details.attempts}<br />
                      Error: {alert.details.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
