"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, QrCode, Trophy, ArrowRight, ShieldCheck, CheckCircle2, Gift, Zap, Store } from "lucide-react";

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const GAME_SECTORS: Record<string, { title: string; subtitle: string; icon: string; questions: GameQuestion[] }> = {
  gastro: {
    title: "Desafío Gastronómico & Gourmet",
    subtitle: "Adiviná la trivia gastronómica y ganá 500 Puntos NexaPay para canjear en el restaurante.",
    icon: "🍳",
    questions: [
      {
        id: 1,
        question: "¿Cuál es el corte tradicional de pescado de río más emblemático de la región de Ituzaingó?",
        options: ["Surubí a la parrilla", "Merluza al horno", "Pejerrey frito"],
        correctIndex: 0,
        explanation: "¡Correcto! El Surubí es el rey de la gastronomía correntina.",
      },
      {
        id: 2,
        question: "¿Qué ingrediente principal no puede faltar en un auténtico Mbaypy correntino?",
        options: ["Harina de maíz y queso", "Arroz blanco", "Fideos secos"],
        correctIndex: 0,
        explanation: "¡Excelente! La harina de maíz y el queso criollo son la base del tradicional Mbaypy.",
      },
    ],
  },
  construccion: {
    title: "Trivia de Arquitectura & Construcción",
    subtitle: "Respondé sobre materiales y cálculo de obra para ganar tu voucher de descuento.",
    icon: "🏗️",
    questions: [
      {
        id: 1,
        question: "¿Cuántos ladrillos comunes de pared de 15 cm se estiman aproximadamente por metro cuadrado?",
        options: ["60 ladrillos / m²", "20 ladrillos / m²", "120 ladrillos / m²"],
        correctIndex: 0,
        explanation: "¡Muy bien! Se calculan entre 55 y 60 ladrillos comunes por m².",
      },
    ],
  },
  turismo: {
    title: "Pasaporte de Experiencias & Turismo",
    subtitle: "Poné a prueba tus conocimientos sobre Ituzaingó y los Esteros del Iberá.",
    icon: "🌿",
    questions: [
      {
        id: 1,
        question: "¿Cuál es el portal de acceso a los Esteros del Iberá más cercano a la ciudad de Ituzaingó?",
        options: ["Portal Cambyretá", "Portal Carambola", "Portal San Nicolás"],
        correctIndex: 0,
        explanation: "¡Correcto! El Portal Cambyretá es el acceso norte preferido desde Ituzaingó.",
      },
    ],
  },
  futbol: {
    title: "PRODE Semanal & Pasión Deportiva",
    subtitle: "Pronosticá el resultado del partido y sumá Puntos NexaPay en tu billetera.",
    icon: "⚽",
    questions: [
      {
        id: 1,
        question: "¿Quién ganará el clásico del fin de semana en la liga local?",
        options: ["Equipo Local", "Empate", "Equipo Visitante"],
        correctIndex: 0,
        explanation: "¡Pronóstico registrado! Sumaste puntos para la fecha.",
      },
    ],
  },
};

function GameContent() {
  const searchParams = useSearchParams();
  const utmSource = searchParams?.get("utm_source") || "comercio-socio";
  const utmCampaign = (searchParams?.get("utm_campaign") || "gastro").toLowerCase();

  const currentSector = GAME_SECTORS[utmCampaign] || GAME_SECTORS.gastro;
  const [merchantName, setMerchantName] = useState("Comercio Auspiciante");

  // Estado del Juego
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Estado de Billetera NexaPay
  const [sessionToken, setSessionToken] = useState("");
  const [balance, setBalance] = useState(500);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatedVoucher, setGeneratedVoucher] = useState<any | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    // Generar o recuperar sesión anónima de usuario
    let sess = localStorage.getItem("nexapay_session_id");
    if (!sess) {
      sess = `sess_nx_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("nexapay_session_id", sess);
    }
    setSessionToken(sess);

    // Buscar nombre del comercio auspiciante si existe en localStorage
    try {
      const savedSocios = localStorage.getItem("nexativa_socios_crm_v3");
      if (savedSocios) {
        const list = JSON.parse(savedSocios);
        const found = list.find((s: any) => s.id === utmSource || s.name.toLowerCase().includes(utmSource.toLowerCase()));
        if (found) setMerchantName(found.name);
      }
    } catch (e) {}

    // Cargar saldo de Billetera NexaPay
    async function fetchWallet() {
      try {
        const res = await fetch(`/api/nexapay/wallet?session=${sess}`);
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance);
        }
      } catch (e) {}
    }
    fetchWallet();
  }, [utmSource]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const q = currentSector.questions[currentQIndex];
    if (idx === q.correctIndex) {
      setScore((prev) => prev + 500);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQIndex + 1 < currentSector.questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setGameCompleted(true);
      // Acreditar Puntos NexaPay en backend
      const pointsToAward = score > 0 ? score : 500; // Regalo base de participación
      try {
        const res = await fetch("/api/nexapay/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "award_points",
            session: sessionToken,
            points: pointsToAward,
            merchantId: utmSource,
          }),
        });
        const data = await res.json();
        if (data.success && data.balance) {
          setBalance(data.balance);
        }
      } catch (e) {}
    }
  };

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      const res = await fetch("/api/nexapay/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_qr",
          session: sessionToken,
          points: 500,
          merchantId: utmSource,
          merchantName,
        }),
      });

      const data = await res.json();
      if (data.success && data.voucher) {
        setGeneratedVoucher(data.voucher);
        if (data.new_balance !== undefined) setBalance(data.new_balance);
        setShowQRModal(true);
      }
    } catch (e) {
      console.warn("Error generando QR:", e);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const q = currentSector.questions[currentQIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Header Co-Branding Dinámico */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-black text-cyan-400 tracking-tight text-base">NEXATIVA</span>
            <span className="text-[10px] text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full">News</span>
          </Link>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
            <Store className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[140px]">{merchantName}</span>
          </div>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="max-w-md mx-auto px-4 pt-6">
        
        {/* Banner del Desafío */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-cyan-500/30 p-5 rounded-3xl mb-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentSector.icon}</span>
            <div>
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest block">
                NORA AI • GAME EXPERIENCE
              </span>
              <h1 className="text-lg font-black text-white leading-tight">{currentSector.title}</h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-light">{currentSector.subtitle}</p>
        </div>

        {/* Tarjeta de Pregunta o Resultado */}
        {!gameCompleted ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-800 pb-3">
              <span>Pregunta {currentQIndex + 1} de {currentSector.questions.length}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>+500 Pts NexaPay</span>
              </span>
            </div>

            <h2 className="text-base font-extrabold text-white leading-snug">{q.question}</h2>

            {/* Opciones Interactivas */}
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                let btnStyle = "bg-slate-950 border-slate-800 text-slate-200 hover:border-cyan-500/50";
                if (isAnswered) {
                  if (idx === q.correctIndex) {
                    btnStyle = "bg-emerald-950 border-emerald-500 text-emerald-200 font-bold";
                  } else if (idx === selectedOption) {
                    btnStyle = "bg-rose-950 border-rose-600 text-rose-300";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explicación y Botón Continuar */}
            {isAnswered && (
              <div className="pt-4 border-t border-slate-800 space-y-4 animate-fade-in">
                <div className="p-3 bg-slate-950 rounded-xl text-xs text-cyan-300 border border-cyan-500/20">
                  💡 {q.explanation}
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span>{currentQIndex + 1 < currentSector.questions.length ? "Siguiente Pregunta 🚀" : "🎉 Finalizar y Sumar Puntos"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Pantalla de Victoria */
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="inline-flex p-4 bg-emerald-500/20 rounded-full text-emerald-400">
              <Trophy className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-1">¡Felicitaciones!</h2>
              <p className="text-xs text-slate-300">
                Completaste el desafío de <strong>{merchantName}</strong> y acreditamos <strong>500 Puntos NexaPay</strong> en tu billetera.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block">Tu nuevo Saldo Acumulado:</span>
              <span className="text-2xl font-black text-cyan-400">{balance} Pts NexaPay</span>
            </div>

            <button
              onClick={handleGenerateQR}
              disabled={isGeneratingQR}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              <QrCode className="w-5 h-5 text-slate-950" />
              <span>{isGeneratingQR ? "Generando QR..." : "🎟️ Generar Voucher QR para Canjear en Mostrador"}</span>
            </button>
          </div>
        )}

        {/* Bases & Condiciones Legal */}
        <div className="mt-8 text-center text-[10px] text-slate-500 space-y-1">
          <p>Nexativa News & NexaPay Loyalty Engine • Ley de Lealtad Comercial 24.240</p>
          <p>Los puntos no constituyen dinero en efectivo ni moneda de curso legal. Válido en Ituzaingó, Corrientes.</p>
        </div>
      </main>

      {/* STICKY WIDGET INFERIOR (WALLETS NEXAPAY MÓVIL) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-xl p-3 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Billetera NexaPay</span>
              <span className="text-sm font-black text-white">{balance} Pts</span>
            </div>
          </div>

          <button
            onClick={handleGenerateQR}
            disabled={isGeneratingQR || balance < 500}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <QrCode className="w-4 h-4" />
            <span>Canjear QR (500 Pts)</span>
          </button>
        </div>
      </div>

      {/* MODAL DE CÓDIGO QR GENERADO */}
      {showQRModal && generatedVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fade-in relative">
            <div className="inline-flex p-3 bg-cyan-500/10 rounded-full text-cyan-400 mb-1">
              <QrCode className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-white">Tu Voucher QR de Canje</h3>
            <p className="text-xs text-slate-300">
              Presentá este código en el mostrador de <strong>{generatedVoucher.merchant_name || merchantName}</strong> para validar tu beneficio.
            </p>

            {/* Código QR Ilustrativo */}
            <div className="bg-white p-6 rounded-2xl inline-block border-4 border-cyan-400/50 shadow-inner">
              <div className="font-mono text-slate-950 font-black text-2xl tracking-widest border-2 border-slate-950 p-3 rounded-lg">
                {generatedVoucher.qr_code || "NX-88219"}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-amber-300 border border-amber-500/30">
              ⏳ Válido por 48 horas. Presentalo directamente desde tu celular.
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">Cargando experiencia de juego...</div>}>
      <GameContent />
    </Suspense>
  );
}
