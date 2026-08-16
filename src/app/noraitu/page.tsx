"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Menu, 
  X, 
  Copy, 
  Check, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Zap, 
  Code, 
  FileText, 
  TrendingUp, 
  ShieldCheck,
  Paperclip,
  Camera,
  Image as ImageIcon,
  FileSpreadsheet,
  XCircle,
  FileCheck2
} from "lucide-react";

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  base64?: string;
  previewUrl?: string;
  textContent?: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  file?: {
    name: string;
    type: string;
    previewUrl?: string;
  };
  created_at?: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function NoraItuApp() {
  const [userId, setUserId] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 1. Inicializar UUID de usuario único en localStorage
  useEffect(() => {
    let storedUserId = localStorage.getItem("noraitu_user_id");
    if (!storedUserId) {
      storedUserId = "user_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
      localStorage.setItem("noraitu_user_id", storedUserId);
    }
    setUserId(storedUserId);
    fetchSessions(storedUserId);
  }, []);

  // 2. Cargar sesiones del usuario
  const fetchSessions = async (uid: string) => {
    try {
      const res = await fetch(`/api/noraitu-sessions?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error cargando sesiones:", err);
    }
  };

  // 3. Cargar mensajes al cambiar de sesión
  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/noraitu-sessions?session_id=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Crear nuevo chat
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputMessage("");
    setAttachedFile(null);
    setSidebarOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // 5. Eliminar sesión
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Deseas eliminar esta conversación?")) return;

    try {
      const res = await fetch(`/api/noraitu-sessions?session_id=${encodeURIComponent(sessionId)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Error eliminando sesión:", err);
    }
  };

  // 6. Auto-scroll al fondo
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 7. Procesar archivos y fotos seleccionados
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tamaño (Máx 15MB)
    if (file.size > 15 * 1024 * 1024) {
      alert("El archivo supera el límite de 15MB.");
      return;
    }

    const reader = new FileReader();

    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        setAttachedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64Data,
          previewUrl: file.type.startsWith("image/") ? result : undefined
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Para archivos de texto, CSV, código
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          textContent: reader.result as string
        });
      };
      reader.readAsText(file);
    }

    // Resetear input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  // 8. Enviar Mensaje a NoraItu (con soporte multimodal)
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if ((!textToSend.trim() && !attachedFile) || isLoading) return;

    const currentFile = attachedFile;
    const tempUserMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      file: currentFile ? {
        name: currentFile.name,
        type: currentFile.type,
        previewUrl: currentFile.previewUrl
      } : undefined,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage("");
    setAttachedFile(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const msgId = "msg_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
      const res = await fetch("/api/noraitu-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-message-id": msgId
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          session_id: currentSessionId,
          user_id: userId,
          message_id: msgId,
          file: currentFile ? {
            name: currentFile.name,
            mimeType: currentFile.type,
            base64: currentFile.base64,
            textContent: currentFile.textContent
          } : undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (data.session_id && data.session_id !== currentSessionId) {
          setCurrentSessionId(data.session_id);
          fetchSessions(userId);
        }
      } else {
        const errorMsg: Message = {
          role: "assistant",
          content: `⚠️ ${data.error || "Ocurrió un error temporal al procesar la respuesta."}`,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error de conexión con el servidor de NoraItu. Reintenta en unos instantes.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 9. Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // 10. Manejo de tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 11. Copiar texto al portapapeles
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 12. Speech to Text (Web Speech API)
  const toggleSpeechRecognition = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Para dictar en móviles, puedes utilizar el icono de micrófono que viene integrado en el teclado de tu teléfono.");
      return;
    }

    try {
      if (!isListening) {
        const recognition = new SpeechRecognition();
        recognition.lang = "es-AR";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInputMessage((prev) => {
              const base = prev.trim();
              return base ? `${base} ${currentTranscript}` : currentTranscript;
            });
          }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
      } else {
        setIsListening(false);
      }
    } catch (e) {
      setIsListening(false);
    }
  };

  // Renderizador de Markdown con soporte de código y tablas
  const renderMessageContent = (content: string, msgIndex: number) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 leading-relaxed text-sm md:text-[15px]">
        {parts.map((part, idx) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const codeLines = part.slice(3, -3).trim().split("\n");
            const lang = codeLines[0].trim();
            const code = (lang ? codeLines.slice(1) : codeLines).join("\n");
            const codeBlockId = `code_${msgIndex}_${idx}`;

            return (
              <div key={idx} className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#070a12] shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
                  <span>{lang || "código"}</span>
                  <button
                    onClick={() => handleCopy(code, codeBlockId)}
                    className="flex items-center gap-1.5 hover:text-sky-400 transition-colors"
                  >
                    {copiedId === codeBlockId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedId === codeBlockId ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-emerald-300/95 leading-snug">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          return (
            <div key={idx} className="space-y-2">
              {part.split("\n\n").map((paragraph, pIdx) => {
                if (paragraph.trim().startsWith("- ") || paragraph.trim().startsWith("* ")) {
                  const items = paragraph.split("\n");
                  return (
                    <ul key={pIdx} className="list-disc pl-5 space-y-1 my-2 text-slate-200">
                      {items.map((item, iIdx) => (
                        <li key={iIdx}>
                          <span dangerouslySetInnerHTML={{
                            __html: item.replace(/^[-*]\s+/, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-300 font-semibold">$1</strong>')
                          }} />
                        </li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p 
                    key={pIdx} 
                    className="text-slate-200"
                    dangerouslySetInnerHTML={{
                      __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-300 font-semibold">$1</strong>')
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#090d16] text-slate-100 font-sans overflow-hidden antialiased selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Inputs Ocultos de Archivos y Cámara */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* ================================================================= */}
      {/* 📱 SIDEBAR / HISTORIAL DE CONVERSACIONES                          */}
      {/* ================================================================= */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-80 bg-[#0c121e]/95 backdrop-blur-xl
        border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                NoraItu AI
              </h1>
              <p className="text-[10px] text-sky-400/80 font-mono">By MyJNexoraVisual</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botón Nuevo Chat */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-sky-600/20 hover:shadow-sky-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nuevo Chat</span>
          </button>
        </div>

        {/* Lista de Sesiones */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Conversaciones Guardadas
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay chats guardados aún.
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`
                    group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-150
                    ${isActive 
                      ? "bg-sky-950/60 border border-sky-800/60 text-sky-200 font-medium shadow-inner" 
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"}
                  `}
                >
                  <span className="truncate pr-2">{sess.title}</span>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity"
                    title="Eliminar chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Sidebar */}
        <div className="p-3 border-t border-slate-800/70 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>100% Blindada</span>
          </div>
          <span className="text-[10px] font-mono text-slate-600">Soberanía $0</span>
        </div>
      </aside>

      {/* Backdrop en Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ================================================================= */}
      {/* 💬 ÁREA PRINCIPAL DE CHAT                                         */}
      {/* ================================================================= */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-radial from-[#101827] via-[#090d16] to-[#06080e]">
        
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between bg-[#090d16]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span className="font-semibold text-sm text-slate-200">NoraItu Universal</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950/80 text-sky-400 border border-sky-800/40">
                Multimodal • Visión & Docs
              </span>
            </div>
          </div>
          
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo Chat</span>
          </button>
        </header>

        {/* Contenedor de Mensajes */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {messages.length === 0 ? (
            /* Vista de Bienvenida */
            <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center px-4 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-sky-500/20 mb-6">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent mb-2">
                NoraItu Inteligencia Multimodal
              </h2>
              <p className="text-sm text-slate-400 max-w-md mb-8">
                Sube fotos de productos, facturas, remitos, PDFs o documentos Word. NoraItu extraerá datos y analizará costos en tiempo real.
              </p>

              {/* Grid de Sugerencias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
                {[
                  { icon: Camera, title: "Identificar Producto / Foto", desc: "Toma una foto y cotiza precios de mercado", prompt: "Identifica este producto en la foto, sus especificaciones y precio promedio de venta." },
                  { icon: FileCheck2, title: "Auditar Factura o Recibo", desc: "Extrae CUIT, totales, ítems e IVA", prompt: "Extrae todos los ítems, CUIT, subtotal e impuestos de este comprobante adjunto." },
                  { icon: FileText, title: "Sintetizar PDF o Word", desc: "Resumen de contratos o informes", prompt: "Haz un resumen ejecutivo de los puntos críticos del documento adjunto." },
                  { icon: Zap, title: "Clima & Consultoría", desc: "Datos en tiempo real y estrategia", prompt: "¿Cuál es el clima actual en Ituzaingó y el pronóstico para hoy?" },
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-sky-500/40 text-left transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <card.icon size={16} className="text-sky-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">{card.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 group-hover:text-slate-300">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Stream de Mensajes */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div 
                    key={msg.id || index}
                    className={`flex gap-3.5 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 mt-1">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}

                    <div className={`
                      max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 shadow-md
                      ${isUser 
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-xs" 
                        : "bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-xs backdrop-blur-xs"}
                    `}>
                      
                      {/* Vista previa de archivo adjunto en el mensaje del usuario */}
                      {msg.file && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-white/20 bg-black/30 p-2">
                          {msg.file.previewUrl ? (
                            <img 
                              src={msg.file.previewUrl} 
                              alt="Adjunto" 
                              className="max-h-56 rounded-lg object-contain mx-auto" 
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-mono text-sky-200 p-1">
                              <FileText size={16} />
                              <span className="truncate">{msg.file.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {renderMessageContent(msg.content, index)}
                      
                      {!isUser && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-mono">NoraItu</span>
                          <button
                            onClick={() => handleCopy(msg.content, `msg_${index}`)}
                            className="flex items-center gap-1 hover:text-sky-400 transition-colors"
                          >
                            {copiedId === `msg_${index}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedId === `msg_${index}` ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                        <User size={16} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Indicador de Pensando */}
              {isLoading && (
                <div className="flex gap-3.5 items-center justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl px-4 py-3 text-xs text-sky-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-slate-400 ml-1 font-mono text-[11px]">NoraItu analizando...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Dock Fijo al Fondo */}
        <div className="p-3 md:p-4 bg-[#090d16]/90 backdrop-blur-md border-t border-slate-800/80">
          
          {/* Chip de archivo adjunto previo a enviar */}
          {attachedFile && (
            <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-sky-500/40 rounded-xl text-xs text-sky-200">
              {attachedFile.previewUrl ? (
                <img src={attachedFile.previewUrl} alt="Thumb" className="w-6 h-6 rounded object-cover" />
              ) : (
                <FileText size={16} className="text-sky-400" />
              )}
              <span className="truncate flex-1">{attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)</span>
              <button 
                onClick={() => setAttachedFile(null)} 
                className="text-slate-400 hover:text-rose-400"
              >
                <XCircle size={16} />
              </button>
            </div>
          )}

          <div className="max-w-3xl mx-auto relative flex items-end gap-1.5 bg-slate-900/90 border border-slate-700/70 focus-within:border-sky-500/80 rounded-2xl p-2 shadow-2xl transition-all">
            
            {/* Botón Adjuntar Archivo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors"
              title="Adjuntar PDF, Word, Excel o imagen"
            >
              <Paperclip size={18} />
            </button>

            {/* Botón Cámara */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors"
              title="Tomar foto con la cámara"
            >
              <Camera size={18} />
            </button>

            {/* Botón Micrófono */}
            <button
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl transition-colors ${
                isListening 
                  ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/50" 
                  : "text-slate-400 hover:text-sky-400 hover:bg-slate-800/60"
              }`}
              title={isListening ? "Detener micrófono" : "Dictar por voz"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Textarea Auto-expandible */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={attachedFile ? "Escribe qué deseas analizar de este archivo..." : "Escribe a NoraItu o adjunta un archivo..."}
              disabled={isLoading}
              className="flex-1 max-h-40 bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-[15px] resize-none focus:outline-hidden py-2 px-1 leading-relaxed"
            />

            {/* Botón Enviar */}
            <button
              onClick={() => handleSendMessage()}
              disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                (inputMessage.trim() || attachedFile) && !isLoading
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </div>

          <div className="text-center mt-2 text-[10px] text-slate-500 flex flex-wrap items-center justify-center gap-1.5">
            <span>NoraItu AI</span>
            <span>•</span>
            <span>Tecnología desarrollada por <strong className="text-sky-400 font-medium">MyJNexoraVisual</strong></span>
            <span>•</span>
            <span>Ituzaingó, Corrientes</span>
          </div>
        </div>
      </main>
    </div>
  );
}
