"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "nora";
  content: string;
}

interface NoraChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  contextProductTitle: string | null;
}

export default function NoraChatWindow({ isOpen, onClose, contextProductTitle }: NoraChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const triggerInitialNoraMessage = async (productTitle: string) => {
    setIsTyping(true);
    
    try {
      const res = await fetch("/api/nora-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "",
          history: [],
          context: `Viendo el producto: ${productTitle}`
        }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages([{ role: "nora", content: data.text }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  // Initial trigger
  useEffect(() => {
    if (isOpen && messages.length === 0 && contextProductTitle) {
      triggerInitialNoraMessage(contextProductTitle);
    }
  }, [isOpen, contextProductTitle, messages.length]);
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    const newHistory: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const res = await fetch("/api/nora-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          context: null
        }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages([...newHistory, { role: "nora", content: data.text }]);
      }
    } catch (e) {
      console.error(e);
      setMessages([...newHistory, { role: "nora", content: "Ay, perdona, se me cortó la conexión un segundito. ¿Me repites?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-8 left-4 sm:left-8 z-50 w-[320px] sm:w-[380px] bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_40px_rgba(var(--color-brand-accent-rgb),0.2)] overflow-hidden flex flex-col h-[500px] max-h-[80vh] animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-accent-hover)] p-4 flex items-center justify-between shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Avatar placeholder - El usuario cambiará esto */}
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center border-2 border-white/30 overflow-hidden">
              <img src="/nora-avatar.png" alt="Nora" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
              <User className="w-6 h-6 text-black/50 absolute -z-10" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--color-brand-accent)]"></div>
          </div>
          <div>
            <h3 className="font-black text-black leading-tight text-lg">Nora</h3>
            <p className="text-black/70 text-xs font-bold">En línea</p>
          </div>
        </div>
        <button onClick={onClose} className="text-black/50 hover:text-black transition-colors bg-black/10 hover:bg-black/20 rounded-full p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === "user" 
                ? "bg-white/10 text-white rounded-br-sm" 
                : "bg-gradient-to-br from-gray-900 to-black border border-white/10 text-gray-100 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] text-gray-500 mt-1 px-1">
              {msg.role === "nora" ? "Nora" : "Tú"} • Ahora
            </span>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-bl-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent)] animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent)] animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent)] animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-black/50 border-t border-white/10 backdrop-blur-md">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..." 
            className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-[var(--color-brand-accent)] text-black rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <div className="text-center mt-2 flex items-center justify-center gap-1 text-[9px] text-gray-600 uppercase tracking-widest">
          <Sparkles className="w-3 h-3" /> Asistente de Ventas
        </div>
      </div>

    </div>
  );
}
