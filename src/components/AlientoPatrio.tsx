/* src/components/AlientoPatrio.tsx */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Heart, Share2, Send, Flame, Trophy, Star } from "lucide-react";
import { fireConfetti } from "@/lib/FlagConfetti";

interface CheerMessage {
  id: string;
  name: string;
  text: string;
  timestamp: string;
}

const PRESET_MESSAGES: CheerMessage[] = [
  {
    id: "preset-1",
    name: "Santi_Albiceleste",
    text: "¡Hoy el Dibu se ataja hasta el viento! ¡Vamos Argentina! 🧤🇦🇷",
    timestamp: "Hace 2 min",
  },
  {
    id: "preset-2",
    name: "Patria_Futbolera",
    text: "Messi querido, otra función de gala por favor. ¡Queremos la final! 🐐👑",
    timestamp: "Hace 5 min",
  },
  {
    id: "preset-3",
    name: "Maru_LaScaloneta",
    text: "Muchaaaachos... ¡ahora nos volvimos a ilusionar! 💙🤍💙",
    timestamp: "Hace 12 min",
  },
];

const ARG_CHANTS = [
  "¡VAMOS VAMOS ARGENTINA! 🇦🇷",
  "¡MUCHAAACHOOS! 🏆",
  "¡EL QUE NO SALTA ES UN INGLÉS! 🎶",
  "¡QUEREMOS LA COPA! 🌟",
  "¡VAMOS LEO! 🐐",
  "¡DIBU DIBU! 🧤",
];

export default function AlientoPatrio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cheersCount, setCheersCount] = useState(142589);
  const [userCheered, setUserCheered] = useState(false);
  const [activeTheme, setActiveTheme] = useState(false);
  
  // Predictor state
  const [goalsArg, setGoalsArg] = useState(2);
  const [goalsRival, setGoalsRival] = useState(1);
  const [rivalName, setRivalName] = useState("Rival");
  const [showShareToast, setShowShareToast] = useState(false);

  // Message board state
  const [messages, setMessages] = useState<CheerMessage[]>([]);
  const [newName, setNewName] = useState("");
  const [newText, setNewText] = useState("");
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const floatIdCounter = useRef(0);

  // Load state from localStorage on mount
  useEffect(() => {
    // Cheers count
    const localCheers = localStorage.getItem("alientoCount");
    if (localCheers) {
      setCheersCount(parseInt(localCheers, 10));
    } else {
      // Set a random starter close to target
      const starter = 142000 + Math.floor(Math.random() * 800);
      setCheersCount(starter);
      localStorage.setItem("alientoCount", String(starter));
    }

    // Messages
    const savedMsgs = localStorage.getItem("alientoMuro");
    if (savedMsgs) {
      try {
        setMessages(JSON.parse(savedMsgs));
      } catch (e) {
        setMessages(PRESET_MESSAGES);
      }
    } else {
      setMessages(PRESET_MESSAGES);
    }

    // Check theme state dynamically
    const checkTheme = () => {
      setActiveTheme(document.body.classList.contains("albiceleste-theme"));
    };
    checkTheme();
    
    // Listen to theme toggle event
    window.addEventListener("modoHinchaToggled", (e: any) => {
      setActiveTheme(e.detail);
    });

    return () => {
      window.removeEventListener("modoHinchaToggled", () => {});
    };
  }, []);

  // Handle cheer click
  const handleCheerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setUserCheered(true);
    const newCount = cheersCount + 1;
    setCheersCount(newCount);
    localStorage.setItem("alientoCount", String(newCount));

    // Fire canvas confetti
    if (canvasRef.current) {
      fireConfetti(canvasRef.current);
    }

    // Add floating text
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const randomChant = ARG_CHANTS[Math.floor(Math.random() * ARG_CHANTS.length)];
    const newFloat = {
      id: floatIdCounter.current++,
      text: randomChant,
      x: x + (Math.random() * 40 - 20),
      y: y - 20,
    };

    setFloatingTexts((prev) => [...prev, newFloat]);

    // Cleanup floating text after animation
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== newFloat.id));
    }, 1500);
  };

  // Handle score prediction copy
  const handleSharePrediction = () => {
    const text = `🇦🇷 ¡Mi pálpito para hoy es Argentina ${goalsArg} - ${goalsRival} ${rivalName}! Alentemos todos juntos en NEXATIVA NEWS 💙🤍. ¡Vamos Selección!`;
    navigator.clipboard.writeText(text).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  // Add new cheer message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const nickname = newName.trim() ? newName.trim() : "Hincha_Anónimo";
    const newMessage: CheerMessage = {
      id: `msg-${Date.now()}`,
      name: nickname.startsWith("@") ? nickname : `@${nickname}`,
      text: newText.trim(),
      timestamp: "Ahora",
    };

    const updated = [newMessage, ...messages];
    setMessages(updated);
    localStorage.setItem("alientoMuro", JSON.stringify(updated));

    // Reset input
    setNewText("");
    // Add custom celebration confetti
    if (canvasRef.current) {
      fireConfetti(canvasRef.current);
    }
  };

  return (
    <section className={`w-full transition-all duration-500 rounded-3xl p-6 border relative overflow-hidden ${
      activeTheme 
        ? "border-sky-400/30 bg-gradient-to-br from-sky-950/40 via-black/60 to-sky-950/40 shadow-[0_0_40px_rgba(116,172,223,0.15)]" 
        : "border-white/10 bg-gradient-to-br from-gray-900/40 via-black/60 to-gray-900/40"
    }`}>
      {/* Background glow effects */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 -z-10 ${
        activeTheme ? "bg-sky-500/10 opacity-70" : "bg-amber-500/5 opacity-50"
      }`} />
      
      {/* Dynamic Confetti Canvas inside this section */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${activeTheme ? "bg-sky-500/20 text-sky-400 animate-pulse" : "bg-white/5 text-[var(--color-brand-accent)]"}`}>
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              Altar de Aliento Nacional
              <Star className="w-5 h-5 fill-amber-400 text-amber-400 animate-spin-slow" />
            </h3>
            <p className="text-xs text-gray-400 font-sans mt-0.5">Semifinal del Mundo: Alentá, predecí y dejá tu mensaje</p>
          </div>
        </div>
        
        {/* Flag badge indicator */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
          <div className="w-2.5 h-1.5 bg-[#74ACDF]" />
          <div className="w-2.5 h-1.5 bg-white" />
          <div className="w-2.5 h-1.5 bg-[#74ACDF]" />
          <span className="ml-1 text-gray-300 font-sans font-medium">PASIÓN ALBICELESTE</span>
        </div>
      </div>

      {/* Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. Cheer Counter Panel */}
        <div className="glass-panel p-5 bg-white/5 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-sky-300 font-sans font-bold">ALIENTOS TOTALES</span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white mt-2 tracking-wider filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
              {cheersCount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 font-sans mt-1.5">Hinchas alentando en Nexativa</p>
          </div>

          {/* Big Interactive Button */}
          <div className="relative my-6 w-full flex justify-center">
            {floatingTexts.map((f) => (
              <span
                key={f.id}
                style={{ left: f.x, top: f.y }}
                className="absolute text-sky-300 font-black text-sm pointer-events-none animate-float-up whitespace-nowrap filter drop-shadow-[0_2px_5px_rgba(116,172,223,0.5)]"
              >
                {f.text}
              </span>
            ))}
            
            <button
              onClick={handleCheerClick}
              className={`w-32 h-32 rounded-full flex flex-col items-center justify-center relative group transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden ${
                activeTheme 
                  ? "bg-gradient-to-tr from-sky-500 to-sky-300 text-black animate-pulse" 
                  : "bg-gradient-to-tr from-gray-800 to-gray-700 text-white"
              }`}
            >
              {/* Sun of May watermark */}
              <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity flex items-center justify-center p-2">
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                  <circle cx="50" cy="50" r="12" fill="currentColor" />
                  {[...Array(24)].map((_, i) => (
                    <line key={i} x1="50" y1="50" x2="50" y2="10" stroke="currentColor" strokeWidth="3" transform={`rotate(${i * 15} 50 50)`} />
                  ))}
                </svg>
              </div>

              <Flame className="w-8 h-8 mb-1 relative z-10" />
              <span className="text-sm font-black tracking-wider relative z-10">¡ALENTAR!</span>
              <span className="text-[10px] opacity-70 mt-1 relative z-10 font-sans font-bold">(Haz clic)</span>
            </button>
          </div>

          <p className="text-xs text-gray-400 font-sans italic max-w-[200px]">
            {userCheered 
              ? "¡Tu aliento ya viaja a la cancha! Seguí alentando." 
              : "Clickeá el botón para enviar confeti patrio."}
          </p>
        </div>

        {/* 2. Match Predictor Panel */}
        <div className="glass-panel p-5 bg-white/5 flex flex-col justify-between min-h-[300px]">
          <div>
            <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Tu Pronóstico
            </h4>
            <p className="text-xs text-gray-400 font-sans mb-6">Dejá tu pálpito y compartilo con amigos</p>
          </div>

          {/* Scores interface */}
          <div className="flex items-center justify-center gap-4 my-2">
            {/* Argentina team */}
            <div className="text-center flex-1">
              <div className="w-12 h-12 rounded-2xl bg-sky-950/50 border border-sky-400/20 mx-auto flex items-center justify-center text-xl font-bold">
                🇦🇷
              </div>
              <span className="text-xs font-bold text-gray-300 block mt-2">ARGENTINA</span>
              
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <button 
                  onClick={() => setGoalsArg(Math.max(0, goalsArg - 1))}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-black hover:bg-white/10 active:scale-95"
                >
                  -
                </button>
                <span className="w-8 text-xl font-black text-white font-mono">{goalsArg}</span>
                <button 
                  onClick={() => setGoalsArg(goalsArg + 1)}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-black hover:bg-white/10 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* VS Divider */}
            <div className="font-serif font-black text-gray-500 italic text-xl px-2 self-start mt-6">
              VS
            </div>

            {/* Rival team */}
            <div className="text-center flex-1">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-xl font-bold">
                ⚽
              </div>
              
              <input
                type="text"
                value={rivalName}
                onChange={(e) => setRivalName(e.target.value.substring(0, 10))}
                className="w-full text-center bg-transparent border-b border-white/15 focus:border-[var(--color-brand-accent)] outline-none text-xs font-bold text-gray-300 mt-2 px-1 focus:ring-0"
                placeholder="Rival"
              />
              
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <button 
                  onClick={() => setGoalsRival(Math.max(0, goalsRival - 1))}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-black hover:bg-white/10 active:scale-95"
                >
                  -
                </button>
                <span className="w-8 text-xl font-black text-white font-mono">{goalsRival}</span>
                <button 
                  onClick={() => setGoalsRival(goalsRival + 1)}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-black hover:bg-white/10 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Share Prediction Button */}
          <div className="mt-6 relative">
            <button
              onClick={handleSharePrediction}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider group"
            >
              <Share2 className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              Compartir Pronóstico
            </button>

            {showShareToast && (
              <div className="absolute -top-12 left-0 right-0 mx-auto bg-green-500 text-black font-extrabold text-xs py-1.5 px-3 rounded-lg text-center shadow-lg animate-fade-in font-sans">
                ¡Copiado al portapapeles! 📋
              </div>
            )}
          </div>
        </div>

        {/* 3. Cheer Wall Panel */}
        <div className="glass-panel p-5 bg-white/5 flex flex-col justify-between min-h-[300px]">
          <div>
            <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
              Muro del Hincha
            </h4>
            <p className="text-xs text-gray-400 font-sans mb-4">Dejá tu aliento en vivo para el equipo</p>
          </div>

          {/* Messages list scrollable */}
          <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2.5 pr-1.5 custom-scrollbar mb-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-xs hover:border-white/10 transition-all hover:bg-white/10"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-[var(--color-brand-accent)]">{msg.name}</span>
                  <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                </div>
                <p className="text-gray-300 font-sans line-clamp-2">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="space-y-2 mt-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre o @usuario"
                value={newName}
                onChange={(e) => setNewName(e.target.value.substring(0, 15))}
                className="w-1/3 bg-black/40 border border-white/10 focus:border-sky-400 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
              />
              <input
                type="text"
                placeholder="¡Escribí tu aliento!"
                value={newText}
                required
                onChange={(e) => setNewText(e.target.value.substring(0, 75))}
                className="flex-grow bg-black/40 border border-white/10 focus:border-sky-400 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Floating text keyframes and animations inlined for simplicity */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(1.1);
          }
        }
        .animate-float-up {
          animation: floatUp 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </section>
  );
}
