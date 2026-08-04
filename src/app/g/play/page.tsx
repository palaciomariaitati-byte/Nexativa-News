"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, QrCode, Trophy, ArrowRight, ShieldCheck, CheckCircle2, Gift, Zap, Store, Compass, Search, Tag, Flame, AlertTriangle } from "lucide-react";

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bannerOffer?: string;
}

const GAME_SECTORS: Record<string, { title: string; subtitle: string; icon: string; defaultOffer: string; questions: GameQuestion[] }> = {
  seguros: {
    title: "Desafío de Protección & Seguros",
    subtitle: "Respondé las 4 preguntas sobre prevención y ganá hasta 1.000 Puntos NexaPay.",
    icon: "🛡️",
    defaultOffer: "🛡️ Póliza Todo Riesgo con 20% de Bonificación en la primera cuota + Auxilio 24hs.",
    questions: [
      {
        id: 1,
        question: "¿Qué cobertura mínima exige la Ley de Tránsito en Argentina para circular en vehículo?",
        options: ["Seguro contra Terceros Obligatorio (Responsabilidad Civil)", "Seguro Todo Riesgo con Franquicia", "Seguro contra Granizo"],
        correctIndex: 0,
        explanation: "¡Correcto! El seguro de Responsabilidad Civil hacia terceros es obligatorio para circular.",
        bannerOffer: "💡 Promoción de la Semana: Cotizá tu seguro de auto en 2 minutos y obtené remolque ilimitado.",
      },
      {
        id: 2,
        question: "¿Qué documento de tu póliza de seguro debes llevar siempre digital o impreso en el auto?",
        options: ["Comprobante de Cobertura Vigente", "El contrato de 50 páginas", "La tarjeta de débito del pago"],
        correctIndex: 0,
        explanation: "¡Excelente! La Resolución SSN permite exhibir el comprobante de cobertura digital en el celular.",
        bannerOffer: "📲 Llevá tu credencial digital en el celular sin imprimir papel.",
      },
      {
        id: 3,
        question: "¿Qué incluye generalmente un seguro combinado para el hogar?",
        options: ["Incendio, Robo de Contenido y Cristales", "Únicamente pintura de paredes exterior", "Reemplazo de comida vencida"],
        correctIndex: 0,
        explanation: "¡Muy bien! Cubre contingencias de incendio, daños por agua, cristales y robo de bienes.",
        bannerOffer: "🏠 Protección Hogar: Cobertura contra granizo en cristales y cerramientos.",
      },
      {
        id: 4,
        question: "¿Qué beneficio extra suele incluir un buen seguro de auto en ruta?",
        options: ["Servicio de Auxilio Mecánico y Grúa 24hs", "Lavado de auto semanal gratis", "Combustible sin límite"],
        correctIndex: 0,
        explanation: "¡Perfecto! La asistencia mecánica y remolque 24hs es fundamental para viajes tranquilos.",
        bannerOffer: "🚀 Auxilio Mecánico Premium: Asistencia en ruta en todo el país sin cargo extra.",
      },
    ],
  },
  gastro: {
    title: "Desafío Gastronómico & Gourmet",
    subtitle: "Completá la trivia gastronómica de 4 niveles y sumá 1.000 Puntos NexaPay.",
    icon: "🍳",
    defaultOffer: "🔥 Menú del Día: Plato de Autor + Bebida con Descuento Exclusivo.",
    questions: [
      {
        id: 1,
        question: "¿Cuál es el plato de pescado de río más tradicional de Ituzaingó?",
        options: ["Surubí a la parrilla", "Merluza con crema", "Pejerrey empanado"],
        correctIndex: 0,
        explanation: "¡Correcto! El Surubí al paquete o a la parrilla es el ícono gastronómico regional.",
        bannerOffer: "🐟 Plato Estrella: Surubí a la Parrilla con salsa de finas hierbas y papas rústicas.",
      },
      {
        id: 2,
        question: "¿Qué harina autóctona se utiliza para elaborar el auténtico Chipá correntino?",
        options: ["Almidón de Mandioca", "Harina de Trigo 0000", "Harina de Avena"],
        correctIndex: 0,
        explanation: "¡Excelente! El almidón de mandioca y el queso criollo le dan su textura esponjosa inolvidable.",
        bannerOffer: "🧀 Chipá Calientito recién horneado: Porción especial con tu consumo del día.",
      },
      {
        id: 3,
        question: "¿Qué infusión tradicional acompaña las tardes correntinas?",
        options: ["Mate cocido con Chipá mbocá", "Té negro con leche", "Café expreso italiano"],
        correctIndex: 0,
        explanation: "¡Así es! El mate y el chipá mbocá al asador son tradición pura.",
        bannerOffer: "☕ Merienda Completa: Mate cocido quemado con mermelada artesanal.",
      },
      {
        id: 4,
        question: "¿Qué característica distingue a un buen guiso arrocero correntino?",
        options: ["Uso de vegetales de estación y caldo concentrado", "Cocción en microondas", "Servirse helado"],
        correctIndex: 0,
        explanation: "¡Perfecto! Un buen sofrito con vegetales frescos e ingredientes de campo le dan sabor único.",
        bannerOffer: "🍲 Almuerzo Ejecutivo: Guiso de Campo de cocción lenta.",
      },
    ],
  },
  construccion: {
    title: "Trivia de Arquitectura & Construcción",
    subtitle: "Calculá materiales y diseño en 4 pasos para desbloquear 1.000 Puntos.",
    icon: "🏗️",
    defaultOffer: "🧱 Oferta de Materiales: 15% OFF en bolsas de Cemento y cal por palet completo.",
    questions: [
      {
        id: 1,
        question: "¿Cuántos ladrillos comunes de 15 cm se estiman aproximadamente por metro cuadrado de pared?",
        options: ["60 ladrillos / m²", "20 ladrillos / m²", "120 ladrillos / m²"],
        correctIndex: 0,
        explanation: "¡Muy bien! Se estiman entre 55 y 60 ladrillos comunes por m².",
        bannerOffer: "🧱 Ladrillos Comunes de primera calidad: Envío directo a obra en Ituzaingó.",
      },
      {
        id: 2,
        question: "¿Cuál es la proporción clásica de mezcla para contrapiso (Cal, Cemento, Arena, Cascote)?",
        options: ["1 de cal, 1/4 de cemento, 3 de arena, 4 de cascote", "10 de cemento puro", "Solo agua y tierra"],
        correctIndex: 0,
        explanation: "¡Correcto! La dosificación 1:1/4:3:4 garantiza firmeza y buen filtrado.",
        bannerOffer: "⌛ Arena limpia de río y cascote picado: Descuentos por volumen.",
      },
      {
        id: 3,
        question: "¿Qué elemento previene la humedad de cimiento en las paredes?",
        options: ["Capa aisladora con hidrófugo", "Pintura sintética", "Papel mampuesto"],
        correctIndex: 0,
        explanation: "¡Excelente! La capa aisladora impermeable bloquea la subida de humedad del suelo.",
        bannerOffer: "💧 Aditivo Hidrófugo de alta concentración: 10% OFF en caja cerrada.",
      },
      {
        id: 4,
        question: "¿Qué ventaja ofrece la construcción en seco (Steel Framing)?",
        options: ["Rapidez de ejecución y aislación térmica superior", "Uso exclusivo de barro", "Mayor peso estructural"],
        correctIndex: 0,
        explanation: "¡Impecable! Reduce tiempos de obra hasta un 60% y mejora el rendimiento térmico.",
        bannerOffer: "🏗️ Perfilería de Galvanizado & Placas de Yeso: Asesoramiento sin cargo.",
      },
    ],
  },
  turismo: {
    title: "Pasaporte de Experiencias & Turismo",
    subtitle: "Demostrá cuánto sabés de los atractivos de Ituzaingó e Iberá.",
    icon: "🌿",
    defaultOffer: "🚤 Paseos en Lancha & Excursiones a Iberá: 20% OFF reservando por WhatsApp.",
    questions: [
      {
        id: 1,
        question: "¿Cuál es el portal de acceso a los Esteros del Iberá más cercano a Ituzaingó?",
        options: ["Portal Cambyretá", "Portal Carambola", "Portal San Nicolás"],
        correctIndex: 0,
        explanation: "¡Correcto! El Portal Cambyretá se encuentra a pocos minutos de Ituzaingó.",
        bannerOffer: "🌿 Excursión Guiada a Portal Cambyretá: Salidas diarias con merienda de campo.",
      },
      {
        id: 2,
        question: "¿Qué importante obra hidroeléctrica binacional se encuentra en Ituzaingó?",
        options: ["Represa Yacyretá", "Represa de Salto Grande", "Represa de Itaipú"],
        correctIndex: 0,
        explanation: "¡Excelente! Yacyretá es una de las centrales hidroeléctricas más grandes de Sudamérica.",
        bannerOffer: "📸 Tour Fotográfico a la Represa Yacyretá: Consultá promociones familiares.",
      },
      {
        id: 3,
        question: "¿Qué especie autóctona reintroducida podés avistar en el Portal Cambyretá?",
        options: ["Yaguareté y Guazú Pucú", "Oso Panda", "Canguro de árbol"],
        correctIndex: 0,
        explanation: "¡Así es! El proyecto de rewilding ha recuperado al Yaguareté y al Ciervo de los Pantanos.",
        bannerOffer: "🔭 Avistaje de Fauna Silvestre: Binoculares y guía biólogo incluido.",
      },
      {
        id: 4,
        question: "¿Qué actividad es muy popular en las playas de Ituzaingó sobre el Río Paraná?",
        options: ["Pesca deportiva con devolución y deportes náuticos", "Esquí en nieve", "Surf de olas gigantes"],
        correctIndex: 0,
        explanation: "¡Perfecto! La pesca del Dorado y Surubí con devolución es atracción mundial.",
        bannerOffer: "🎣 Jornada de Pesca Deportiva con Guía Experimentado + Equipamiento completo.",
      },
    ],
  },
  futbol: {
    title: "PRODE Semanal & Pasión Deportiva",
    subtitle: "Pronosticá 4 partidos de la fecha para ganar tus 1.000 Puntos NexaPay.",
    icon: "⚽",
    defaultOffer: "⚽ Combo Golero: Pizza Grande + 2 Bebidas heladas durante el partido.",
    questions: [
      {
        id: 1,
        question: "Partido 1: ¿Quién gana el primer clásico de la fecha?",
        options: ["Equipo Local", "Empate", "Equipo Visitante"],
        correctIndex: 0,
        explanation: "¡Pronóstico 1 registrado! +250 Pts.",
        bannerOffer: "🍕 Combo Fútbol: Pizza de Muzzarella + Cerveza o Gaseosa de litro en el bar.",
      },
      {
        id: 2,
        question: "Partido 2: ¿Habrá más de 2 goles en el partido principal?",
        options: ["Sí (Más de 2.5 goles)", "No (Menos de 2.5 goles)"],
        correctIndex: 0,
        explanation: "¡Pronóstico 2 registrado! +250 Pts.",
        bannerOffer: "🍟 Porción de Papas Provensal para compartir viendo el partido.",
      },
      {
        id: 3,
        question: "Partido 3: ¿Quién convertirá el primer gol?",
        options: ["Delantero Titular", "Centrocampista", "Defensor / Penal"],
        correctIndex: 0,
        explanation: "¡Pronóstico 3 registrado! +250 Pts.",
        bannerOffer: "🍔 Hamburguesa Doble Queso & Bacon: Descuento exclusivo para hinchas.",
      },
      {
        id: 4,
        question: "Partido 4: ¿Resultado del partido de la jornada?",
        options: ["Victoria Ajustada", "Goleada", "Empate a Cero"],
        correctIndex: 0,
        explanation: "¡Pronóstico 4 registrado! +250 Pts.",
        bannerOffer: "🏆 Premio Semanal al Campeón del PRODE: Voucher de $10.000 de consumo.",
      },
    ],
  },
};

// Control de Cupos Semanales de Premios Mayores (3 por semana por comercio)
const MAX_WEEKLY_JACKPOTS = 3;

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function GameContent() {
  const searchParams = useSearchParams();
  const utmSource = searchParams?.get("utm_source") || "comercio-socio";
  const utmCampaign = (searchParams?.get("utm_campaign") || "gastro").toLowerCase();

  const currentSector = GAME_SECTORS[utmCampaign] || GAME_SECTORS.gastro;
  const [merchantName, setMerchantName] = useState("Comercio Auspiciante");
  const [merchantData, setMerchantData] = useState<any | null>(null);

  // Control de Stock Semanal de Premios Mayores
  const [jackpotsRemaining, setJackpotsRemaining] = useState(MAX_WEEKLY_JACKPOTS);

  // Estado del Juego (4 Preguntas)
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Modo Búsqueda del Tesoro ("La Hamburguesa Completa")
  const [showTreasureMode, setShowTreasureMode] = useState(false);

  // Estado de Billetera NexaPay
  const [sessionToken, setSessionToken] = useState("");
  const [balance, setBalance] = useState(1000);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatedVoucher, setGeneratedVoucher] = useState<any | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    let sess = localStorage.getItem("nexapay_session_id");
    if (!sess) {
      sess = `sess_nx_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("nexapay_session_id", sess);
    }
    setSessionToken(sess);

    // Cargar stock semanal consumido para este comercio
    try {
      const weekNum = getWeekNumber(new Date());
      const year = new Date().getFullYear();
      const stockKey = `jackpot_stock_weekly_${utmSource}_${year}_W${weekNum}`;
      const usedThisWeek = Number(localStorage.getItem(stockKey) || 0);
      setJackpotsRemaining(Math.max(0, MAX_WEEKLY_JACKPOTS - usedThisWeek));
    } catch (e) {}

    // Leer datos del comercio desde localStorage / CRM
    try {
      const savedSocios = localStorage.getItem("nexativa_socios_crm_v3");
      if (savedSocios) {
        const list = JSON.parse(savedSocios);
        const found = list.find((s: any) => s.id === utmSource || s.name.toLowerCase().includes(utmSource.toLowerCase()));
        if (found) {
          setMerchantName(found.name);
          setMerchantData(found);
        }
      }
    } catch (e) {}

    async function fetchWallet() {
      try {
        const res = await fetch(`/api/nexapay/wallet?session=${sess}`);
        const data = await res.json();
        if (data.success) setBalance(data.balance);
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
      setScore((prev) => prev + 250);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQIndex + 1 < currentSector.questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setGameCompleted(true);
      const pointsToAward = score > 0 ? score : 1000;
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
        if (data.success && data.balance) setBalance(data.balance);
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
          points: 1000,
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

  const handleClaimJackpotTreasure = () => {
    if (jackpotsRemaining <= 0) return;
    try {
      const weekNum = getWeekNumber(new Date());
      const year = new Date().getFullYear();
      const stockKey = `jackpot_stock_weekly_${utmSource}_${year}_W${weekNum}`;
      const usedThisWeek = Number(localStorage.getItem(stockKey) || 0);
      localStorage.setItem(stockKey, String(usedThisWeek + 1));
      setJackpotsRemaining(Math.max(0, MAX_WEEKLY_JACKPOTS - (usedThisWeek + 1)));
    } catch (e) {}
    setShowTreasureMode(true);
  };

  // Dinámica de rotación de ofertas del perfil del cliente en cada pregunta
  const q = currentSector.questions[currentQIndex];
  const dynamicBannerOffer = React.useMemo(() => {
    if (!merchantData) return q.bannerOffer || currentSector.defaultOffer;

    switch (currentQIndex) {
      case 0:
        return `🔥 ${merchantData.name}: ${merchantData.description || 'Promoción especial en el rubro ' + merchantData.category}`;
      case 1:
        return `📍 Ubicación de ${merchantData.name}: ${merchantData.address || 'Ituzaingó, Corrientes'} • Consultas por WhatsApp`;
      case 2:
        return `⭐ Comercio Adherido en ${merchantData.category} • Beneficios en consumo presencial`;
      case 3:
        return `🎉 ¡Sumá Puntos NexaPay y canjeá tu descuento en ${merchantData.name}!`;
      default:
        return currentSector.defaultOffer;
    }
  }, [merchantData, currentQIndex, q.bannerOffer, currentSector.defaultOffer]);

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
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-cyan-500/30 p-5 rounded-3xl mb-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentSector.icon}</span>
            <div>
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest block">
                NORA AI • TRIVIA DE 4 NIVELES
              </span>
              <h1 className="text-lg font-black text-white leading-tight">{currentSector.title}</h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-light">{currentSector.subtitle}</p>
        </div>

        {/* BANNER SHOWCASE PUBLICITARIO DINÁMICO QUE LEE EL PERFIL DEL COMERCIO */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl mb-6 flex items-center gap-3 animate-fade-in shadow-lg">
          <Flame className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block uppercase text-[10px]">OFERTA DEL ANUNCIANTE ({merchantName.toUpperCase()}):</span>
            <span className="text-slate-100 font-semibold">{dynamicBannerOffer}</span>
          </div>
        </div>

        {/* Tarjeta de Pregunta o Resultado */}
        {!gameCompleted ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-800 pb-3">
              <span>Nivel {currentQIndex + 1} de {currentSector.questions.length}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>+250 Pts por nivel (+1.000 Total)</span>
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
                  <span>{currentQIndex + 1 < currentSector.questions.length ? "Siguiente Nivel 🚀" : "🎉 ¡Completar los 4 Niveles y Sumar 1.000 Pts!"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Pantalla de Elección Dual con Control Semanal y Regla de Consumición Mínima */
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="inline-flex p-4 bg-emerald-500/20 rounded-full text-emerald-400">
              <Trophy className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-1">¡4 Niveles Aprobados!</h2>
              <p className="text-xs text-slate-300">
                Completaste la trivia de <strong>{merchantName}</strong> y acumulaste <strong>1.000 Puntos NexaPay</strong>.
              </p>
            </div>

            {/* Control de Cupos Semanales */}
            <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-amber-300 text-[11px] font-bold px-3.5 py-1.5 rounded-full">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Premios Mayores de la Semana: {jackpotsRemaining} / {MAX_WEEKLY_JACKPOTS} disponibles</span>
            </div>

            {!showTreasureMode ? (
              /* ELECCIÓN DEL USUARIO */
              <div className="space-y-4 pt-1">
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  ¿Cómo querés disfrutar tu recompensa?
                </p>

                {/* OPCIÓN A: CANJE DIRECTO DE DESCUENTO */}
                <button
                  onClick={handleGenerateQR}
                  disabled={isGeneratingQR}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <QrCode className="w-5 h-5 text-slate-950" />
                  <span>🎟️ CANJEAR DESCUENTO EN MOSTRADOR (1.000 PTS)</span>
                </button>

                {/* OPCIÓN B: BÚSQUEDA DEL TESORO CON CONSUMISIÓN MÍNIMA Y CUPO SEMANAL */}
                {jackpotsRemaining > 0 ? (
                  <button
                    onClick={handleClaimJackpotTreasure}
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>🍔 IR POR LA HAMBURGUESA COMPLETA (Quedan {jackpotsRemaining} esta semana)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>El cupo semanal del premio mayor fue alcanzado ({MAX_WEEKLY_JACKPOTS}/{MAX_WEEKLY_JACKPOTS}). ¡Usá tus 1.000 Pts para el descuento directo!</span>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 leading-tight">
                  * El Premio Mayor de la Hamburguesa Completa es válido por 1 consumición previa en el local (ej. bebida/entrada) los días Sábados o según disponibilidad del restaurante.
                </p>
              </div>
            ) : (
              /* MODO BÚSQUEDA DEL TESORO REVELADO */
              <div className="p-5 bg-amber-950/40 border border-amber-500/50 rounded-2xl text-left space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm border-b border-amber-500/30 pb-2">
                  <Compass className="w-5 h-5 text-amber-400" />
                  <span>🔍 DESAFÍO: EL TESORO ESCONDIDO EN NEXATIVA</span>
                </div>

                <p className="text-xs text-amber-100 leading-relaxed">
                  ¡Excelente decisión! El <strong>Premio Mayor (Quedan {jackpotsRemaining} disponibles esta semana)</strong> está oculto dentro de uno de los artículos de noticias o en la sección de Empleos de Nexativa News.
                </p>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 text-xs text-amber-200">
                  💡 <strong>Pista Secreta de Nora AI:</strong> Navegá por las noticias de hoy o la Guía Comercial. Buscá el ícono de la <strong>Hamburguesa Dorada 🍔🎁</strong> al pie de los artículos para reclamar tu premio. Válido con 1 consumición previa en el local.
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/"
                    className="py-3 px-3 bg-amber-500 text-slate-950 font-black rounded-xl text-xs text-center block shadow-lg"
                  >
                    <span>📰 Explorar Noticias</span>
                  </Link>

                  <Link
                    href="/empleos"
                    className="py-3 px-3 bg-slate-800 text-white font-bold rounded-xl text-xs text-center block border border-slate-700"
                  >
                    <span>💼 Ver Empleos</span>
                  </Link>
                </div>
              </div>
            )}
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
            disabled={isGeneratingQR || balance < 1000}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <QrCode className="w-4 h-4" />
            <span>Canjear QR (1.000 Pts)</span>
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
              Presentá este código en el mostrador de <strong>{generatedVoucher.merchant_name || merchantName}</strong> para validar tu beneficio de 1.000 Pts.
            </p>

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
