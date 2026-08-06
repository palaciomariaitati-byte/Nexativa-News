"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  Target, 
  Brain, 
  MessageSquare, 
  Send, 
  Zap, 
  Users, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Award,
  Globe
} from "lucide-react";

interface Message {
  role: "user" | "valen";
  content: string;
  timestamp: string;
}

interface KPIState {
  total_leads: number;
  pitches_sent: number;
  leads_converted: number;
  conversion_rate: number;
  total_tasks_executed: number;
  average_success_score: number;
}

interface MemoryItem {
  key: string;
  category: string;
  content: string;
  updated_at?: string;
}

interface LeadItem {
  id: string;
  target_name: string;
  target_type: string;
  contact_info?: string;
  pitch_summary?: string;
  status: string;
  created_at: string;
}

export default function ValenExecutiveClient() {
  const [activeTab, setActiveTab] = useState<"chat" | "metrics" | "memory" | "leads">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "valen",
      content: "Hola. Soy **VALEN**, Chief Growth & Global Expansion Officer de Nexativa. He cargado el contexto estratégico de la compañía, las métricas actuales del ecosistema y mi memoria de negocio. ¿Qué estrategia o gestión comercial amplia abordamos hoy?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<KPIState>({
    total_leads: 0,
    pitches_sent: 0,
    leads_converted: 0,
    conversion_rate: 0,
    total_tasks_executed: 0,
    average_success_score: 100
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [memoryList, setMemoryList] = useState<MemoryItem[]>([]);
  const [leadsList, setLeadsList] = useState<LeadItem[]>([]);
  const [refreshingMetrics, setRefreshingMetrics] = useState(false);

  // New Memory Form State
  const [newMemKey, setNewMemKey] = useState("");
  const [newMemCategory, setNewMemCategory] = useState("brand_guidelines");
  const [newMemContent, setNewMemContent] = useState("");
  const [savingMemory, setSavingMemory] = useState(false);

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadType, setNewLeadType] = useState("CORPORATE_ADVERTISER");
  const [newLeadContact, setNewLeadContact] = useState("");
  const [newLeadPitch, setNewLeadPitch] = useState("");
  const [savingLead, setSavingLead] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/valen-executive");
      if (res.ok) {
        const data = await res.json();
        if (data.kpis) setKpis(data.kpis);
        if (data.metrics) setMetrics(data.metrics);
        if (data.memory) setMemoryList(data.memory);
        if (data.leads) setLeadsList(data.leads);
      }
    } catch (e) {
      console.error("Error fetching Valen data:", e);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputMessage("");
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/valen-executive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: textToSend,
          history: historyPayload,
          operatorName: "Socio Fundador"
        })
      });

      if (res.ok) {
        const data = await res.json();
        const valenMsg: Message = {
          role: "valen",
          content: data.text || "Entendido.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, valenMsg]);
        if (data.kpis) setKpis(data.kpis);
      } else {
        throw new Error("Error en respuesta de VALEN.");
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "valen",
        content: "⚠️ Ocurrió una interrupción temporal con mis módulos analíticos. Por favor intenta de nuevo.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestStatusReport = () => {
    handleSendMessage("Genera tu informe de estatus ejecutivo A-B-C actualizado para hoy por favor.");
  };

  const handleRefreshMetricsCron = async () => {
    setRefreshingMetrics(true);
    try {
      const res = await fetch("/api/cron/valen-metrics", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        await fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingMetrics(false);
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey || !newMemContent || savingMemory) return;
    setSavingMemory(true);
    try {
      const res = await fetch("/api/valen-executive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "train",
          memoryData: {
            key: newMemKey,
            category: newMemCategory,
            content: newMemContent
          }
        })
      });
      if (res.ok) {
        setNewMemKey("");
        setNewMemContent("");
        await fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMemory(false);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || savingLead) return;
    setSavingLead(true);
    try {
      const res = await fetch("/api/valen-executive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lead",
          leadData: {
            target_name: newLeadName,
            target_type: newLeadType,
            contact_info: newLeadContact,
            pitch_summary: newLeadPitch,
            status: "PROSPECT"
          }
        })
      });
      if (res.ok) {
        setNewLeadName("");
        setNewLeadContact("");
        setNewLeadPitch("");
        await fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingLead(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER EXECUTIVO */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                VALEN ACTIVE (COSTO $0 USD)
              </span>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full">
                GLOBAL GROWTH & EXPANSION CEO
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Globe className="w-8 h-8 text-indigo-400" />
              VALEN — Agente Executive
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Motor independiente de estrategia, análisis de métricas, pitches para VCs y expansión internacional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshMetricsCron}
              disabled={refreshingMetrics}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm border border-slate-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingMetrics ? "animate-spin text-indigo-400" : ""}`} />
              Actualizar Métricas
            </button>
            <button
              onClick={handleRequestStatusReport}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Solicitar Informe A-B-C
            </button>
          </div>
        </div>

        {/* TARJETAS DE KPIS / TASA DE ÉXITO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
              <span>Leads Totales</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{kpis.total_leads}</div>
            <div className="text-xs text-slate-500 mt-1">Prospectos en seguimiento</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
              <span>Pitches Enviados</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{kpis.pitches_sent}</div>
            <div className="text-xs text-blue-400/80 mt-1">Outreach ejecutado</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
              <span>Tasa de Éxito / Conversión</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{kpis.conversion_rate}%</div>
            <div className="text-xs text-emerald-500/80 mt-1">{kpis.leads_converted} convertidos</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
              <span>Score de Ejecución</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{kpis.average_success_score}/100</div>
            <div className="text-xs text-amber-500/80 mt-1">Precisión de decisiones</div>
          </div>
        </div>

        {/* NAU / TABS DE NAVEGACIÓN */}
        <div className="flex border-b border-slate-800 mt-8 space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("chat")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "chat"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat Ejecutivo & Tareas
          </button>

          <button
            onClick={() => setActiveTab("metrics")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "metrics"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Radar de Métricas
          </button>

          <button
            onClick={() => setActiveTab("memory")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "memory"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="w-4 h-4" />
            Memoria & Entrenamiento ({memoryList.length})
          </button>

          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "leads"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Leads & VCs ({leadsList.length})
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL POR TAB */}
      <div className="max-w-7xl mx-auto">
        {/* TAB 1: CHAT EJECUTIVO */}
        {activeTab === "chat" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[650px]">
            {/* SUGERENCIAS RÁPIDAS DE TAREA */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleSendMessage("VALEN, generá la estructura y el contenido completo para nuestro BROCHURE COMERCIAL Y PORTAFOLIO DE VENTAS 2026. Incluí portadas de alto impacto, propuesta de valor $0 USD de cómputo, desglose de servicios B2B, y prompts visuales surrealistas 3D de punta para ilustrar el portafolio.")}
                className="text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5"
              >
                📄 Generar Brochure & Portafolio de Ventas
              </button>
              <button
                onClick={() => handleSendMessage("VALEN, armá una estrategia de posicionamiento aplicando el ADN de Apple (simplicidad, status y experiencia impecable) para Nexativa News.")}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                 ADN Apple (Status & Simplicidad)
              </button>
              <button
                onClick={() => handleSendMessage("VALEN, diseñá un concepto publicitario aplicando el ADN de Red Bull (espectáculo surrealista masivo) para atraer grandes anunciantes.")}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                🐂 ADN Red Bull (Publicidad Surrealista)
              </button>
              <button
                onClick={() => handleSendMessage("Armá una propuesta comercial para un gran grupo de medios en Rosario.")}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                💼 Pitch Comercial Regional
              </button>
              <button
                onClick={() => handleSendMessage("Escribí un One-Pager ejecutivo para presentar Nexativa News a fondos de inversión VCs.")}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                📊 Pitch para Inversores (VC)
              </button>
            </div>

            {/* AREA DE MENSAJES */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-md"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4 mb-1 text-xs opacity-75 border-b border-white/10 pb-1">
                      <span className="font-semibold">
                        {m.role === "user" ? "Socio Fundador" : "VALEN (Chief Growth Officer)"}
                      </span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl rounded-bl-none p-4 text-sm flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>VALEN está analizando la solicitud y procesando métricas...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT DE CHAT */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                placeholder="Solicitá una tarea a VALEN (ej: 'Valen, armate un pitch para el mercado de Córdoba')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-xl transition flex items-center justify-center shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: RADAR DE MÉTRICAS */}
        {activeTab === "metrics" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Snapshot de Métricas del Ecosistema (`nexativa_metrics`)
            </h2>

            {metrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Búsquedas y Clics Estimados
                  </h3>
                  <div className="text-3xl font-extrabold text-emerald-400">{metrics.google_search_clicks}</div>
                  <p className="text-xs text-slate-500 mt-1">Tráfico acumulado proyectado en Google Search Console</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Conversiones Panel de Empleo
                  </h3>
                  <div className="text-3xl font-extrabold text-blue-400">{metrics.job_board_conversions}</div>
                  <p className="text-xs text-slate-500 mt-1">Matchings entre desempleados y postulaciones locales</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl md:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Keywords en Tendencia Hoy (Google Trends Argentina RSS)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(metrics.google_trending_keywords) && metrics.google_trending_keywords.map((kw: string, i: number) => (
                      <span key={i} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-lg text-xs font-medium">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Cargando métricas...</div>
            )}
          </div>
        )}

        {/* TAB 3: MEMORIA Y ENTRENAMIENTO */}
        {activeTab === "memory" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LISTADO DE MEMORIA */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Memoria Persistente de VALEN (`valen_memory`)
              </h2>
              <div className="space-y-3">
                {memoryList.map((m, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{m.key}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{m.category}</span>
                    </div>
                    <p className="text-sm text-slate-300 font-sans">{m.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FORMULARIO DE ENTRENAMIENTO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Enseñar Concepto a VALEN
              </h3>
              <form onSubmit={handleSaveMemory} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Clave / Nombre del Concepto</label>
                  <input
                    type="text"
                    value={newMemKey}
                    onChange={e => setNewMemKey(e.target.value)}
                    placeholder="ej: target_investors_latam"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoría</label>
                  <select
                    value={newMemCategory}
                    onChange={e => setNewMemCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="brand_guidelines">Directriz de Marca</option>
                    <option value="strategic_goal">Objetivo Estratégico</option>
                    <option value="learned_preference">Preferencia Aprendida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Instrucción / Contenido</label>
                  <textarea
                    value={newMemContent}
                    onChange={e => setNewMemContent(e.target.value)}
                    placeholder="Explicale a VALEN cómo responder ante este tema..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingMemory}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Guardar en Memoria
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: LEADS Y PROSPECTOS */}
        {activeTab === "leads" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Pipeline de Prospectos e Inversores Globales (`valen_global_leads`)
              </h2>
              <div className="space-y-3">
                {leadsList.map((lead) => (
                  <div key={lead.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-base">{lead.target_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{lead.contact_info || "Sin contacto asentado"}</div>
                      {lead.pitch_summary && (
                        <p className="text-xs text-slate-300 mt-2 bg-slate-900 p-2 rounded border border-slate-800">
                          {lead.pitch_summary}
                        </p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full">
                      {lead.status}
                    </span>
                  </div>
                ))}
                {leadsList.length === 0 && (
                  <div className="text-slate-500 text-sm">No hay prospectos asentados todavía.</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Registrar Prospecto
              </h3>
              <form onSubmit={handleSaveLead} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre Empresa / Inversor</label>
                  <input
                    type="text"
                    value={newLeadName}
                    onChange={e => setNewLeadName(e.target.value)}
                    placeholder="ej: Grupo Clarín / Kaszek Ventures"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipo de Target</label>
                  <select
                    value={newLeadType}
                    onChange={e => setNewLeadType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="CORPORATE_ADVERTISER">Anunciante Corporativo</option>
                    <option value="VC_INVESTOR">Fondo de Inversión (VC / Angel)</option>
                    <option value="REGIONAL_PARTNER">Socio Regional (Franquicia)</option>
                    <option value="PRESS_MEDIA">Medio Aliado / Prensa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contacto (Email / Tel / LinkedIn)</label>
                  <input
                    type="text"
                    value={newLeadContact}
                    onChange={e => setNewLeadContact(e.target.value)}
                    placeholder="ej: contacto@empresa.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Resumen del Pitch / Propuesta</label>
                  <textarea
                    value={newLeadPitch}
                    onChange={e => setNewLeadPitch(e.target.value)}
                    placeholder="Detalles de la propuesta enviada..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Registrar Lead
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
