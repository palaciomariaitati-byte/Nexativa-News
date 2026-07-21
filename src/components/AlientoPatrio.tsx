/* src/components/AlientoPatrio.tsx */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Trophy, Share2, Send, Flame, MessageSquare, Activity, Globe, CheckCircle2 } from "lucide-react";
import { fireConfetti } from "@/lib/FlagConfetti";

interface Match {
  id: string;
  league: "argentina" | "espana" | "inglaterra" | "italia" | "francia";
  leagueName: string;
  flag: string;
  homeTeam: string;
  homeLogo: string;
  homeScore: number;
  awayTeam: string;
  awayLogo: string;
  awayScore: number;
  status: "FINALIZADO" | "EN VIVO" | "PRÓXIMO";
  minute?: string;
  time?: string;
  date: string;
}

interface FanComment {
  id: string;
  name: string;
  text: string;
  league: string;
  timestamp: string;
}

const INITIAL_MATCHES: Match[] = [
  {
    id: "m-1",
    league: "argentina",
    leagueName: "Liga Profesional 🇦🇷",
    flag: "🇦🇷",
    homeTeam: "Boca Juniors",
    homeLogo: "🟦🟨🟦",
    homeScore: 2,
    awayTeam: "River Plate",
    awayLogo: "⬜🟥⬜",
    awayScore: 1,
    status: "FINALIZADO",
    date: "Ayer",
  },
  {
    id: "m-2",
    league: "espana",
    leagueName: "LaLiga 🇪🇸",
    flag: "🇪🇸",
    homeTeam: "Real Madrid",
    homeLogo: "⚪👑",
    homeScore: 3,
    awayTeam: "Barcelona",
    awayLogo: "🔵🔴",
    awayScore: 2,
    status: "FINALIZADO",
    date: "Ayer",
  },
  {
    id: "m-3",
    league: "inglaterra",
    leagueName: "Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    homeTeam: "Arsenal",
    homeLogo: "🔴⚪",
    homeScore: 1,
    awayTeam: "Man. City",
    awayLogo: "🩵⬜",
    awayScore: 1,
    status: "EN VIVO",
    minute: "82'",
    date: "En Directo",
  },
  {
    id: "m-4",
    league: "italia",
    leagueName: "Serie A 🇮🇹",
    flag: "🇮🇹",
    homeTeam: "Inter Milan",
    homeLogo: "🔵⚫",
    homeScore: 2,
    awayTeam: "AC Milan",
    awayLogo: "🔴⚫",
    awayScore: 0,
    status: "FINALIZADO",
    date: "Hace 2 días",
  },
  {
    id: "m-5",
    league: "francia",
    leagueName: "Ligue 1 🇫🇷",
    flag: "🇫🇷",
    homeTeam: "PSG",
    homeLogo: "🔴🔵",
    homeScore: 0,
    awayTeam: "Olympique Marseille",
    awayLogo: "⚪🩵",
    awayScore: 0,
    status: "PRÓXIMO",
    time: "21:00 hs",
    date: "Hoy",
  },
  {
    id: "m-6",
    league: "argentina",
    leagueName: "Liga Profesional 🇦🇷",
    flag: "🇦🇷",
    homeTeam: "Racing Club",
    homeLogo: "🩵⬜",
    homeScore: 1,
    awayTeam: "Independiente",
    awayLogo: "🔴⬜",
    awayScore: 0,
    status: "FINALIZADO",
    date: "Hace 3 días",
  },
];

const INITIAL_COMMENTS: FanComment[] = [
  {
    id: "c-1",
    name: "@GolazoArg",
    text: "¡Qué partidazo se viene entre PSG y Marsella hoy! Mi pálpito es victoria de París.",
    league: "🇫🇷 Francia",
    timestamp: "Hace 5 min",
  },
  {
    id: "c-2",
    name: "@LaScaloneta99",
    text: "Partidazo de Boca ayer, bien merecido el triunfo en el superclásico.",
    league: "🇦🇷 Argentina",
    timestamp: "Hace 14 min",
  },
  {
    id: "c-3",
    name: "@PremierFan",
    text: "¡Sigue emparejado el Arsenal vs Man City! Se define en los últimos minutos 🤯",
    league: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",
    timestamp: "Hace 22 min",
  },
];

export default function AlientoPatrio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [matches] = useState<Match[]>(INITIAL_MATCHES);

  // Predictor state
  const [predMatchId, setPredMatchId] = useState<string>("m-5");
  const [homePred, setHomePred] = useState(2);
  const [awayPred, setAwayPred] = useState(1);
  const [showShareToast, setShowShareToast] = useState(false);

  // Comments state
  const [comments, setComments] = useState<FanComment[]>([]);
  const [userName, setUserName] = useState("");
  const [userText, setUserText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("futbolComentarios");
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch {
        setComments(INITIAL_COMMENTS);
      }
    } else {
      setComments(INITIAL_COMMENTS);
    }
  }, []);

  const filteredMatches = selectedLeague === "all"
    ? matches
    : matches.filter((m) => m.league === selectedLeague);

  const selectedMatch = matches.find((m) => m.id === predMatchId) || matches[0];

  const handleSharePrediction = () => {
    const text = `⚽ Mi pálpito para ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}: ${selectedMatch.homeTeam} ${homePred} - ${awayPred} ${selectedMatch.awayTeam}. Seguí los resultados del fútbol mundial en NEXATIVA NEWS! ⚽🔥`;
    navigator.clipboard.writeText(text).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim()) return;

    const nickname = userName.trim() ? userName.trim() : "Hincha_Anonimo";
    const newComm: FanComment = {
      id: `c-${Date.now()}`,
      name: nickname.startsWith("@") ? nickname : `@${nickname}`,
      text: userText.trim(),
      league: selectedMatch.flag + " " + selectedMatch.homeTeam,
      timestamp: "Ahora",
    };

    const updated = [newComm, ...comments];
    setComments(updated);
    localStorage.setItem("futbolComentarios", JSON.stringify(updated));

    setUserText("");
    if (canvasRef.current) {
      fireConfetti(canvasRef.current);
    }
  };

  return (
    <section className="w-full transition-all duration-500 rounded-3xl p-6 border border-white/10 bg-gradient-to-br from-gray-900/60 via-black/80 to-gray-900/60 shadow-2xl relative overflow-hidden">
      {/* Dynamic Confetti Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              Central de Resultados & Fútbol Mundial ⚽
            </h3>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Marcadores en vivo y resultados destacados de las mejores ligas del planeta
            </p>
          </div>
        </div>

        {/* League Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: "all", label: "Todas", flag: "🌐" },
            { id: "argentina", label: "Argentina", flag: "🇦🇷" },
            { id: "espana", label: "España", flag: "🇪🇸" },
            { id: "inglaterra", label: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
            { id: "italia", label: "Italia", flag: "🇮🇹" },
            { id: "francia", label: "Francia", flag: "🇫🇷" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedLeague(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 border ${
                selectedLeague === tab.id
                  ? "bg-[var(--color-brand-accent)] text-black border-[var(--color-brand-accent)] shadow-md"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{tab.flag}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Results Feed */}
        <div className="glass-panel p-4 bg-white/5 flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Marcador de Partidos
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">
                {filteredMatches.length} partidos
              </span>
            </div>

            <div className="space-y-2.5 max-h-[270px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredMatches.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border transition-all ${
                    m.status === "EN VIVO"
                      ? "bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-2 font-sans">
                    <span className="font-bold text-gray-300">{m.leagueName}</span>
                    <span className="flex items-center gap-1 font-semibold">
                      {m.status === "EN VIVO" && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {m.minute}
                        </span>
                      )}
                      {m.status === "FINALIZADO" && (
                        <span className="text-gray-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Fin
                        </span>
                      )}
                      {m.status === "PRÓXIMO" && (
                        <span className="text-amber-400 font-bold">{m.time}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-bold text-sm text-gray-100">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-base">{m.homeLogo}</span>
                      <span className="line-clamp-1">{m.homeTeam}</span>
                    </div>

                    <div className="px-3 py-1 bg-black/40 rounded-lg font-mono text-lg font-black text-amber-400 border border-white/5 mx-2">
                      {m.status === "PRÓXIMO" ? "VS" : `${m.homeScore} - ${m.awayScore}`}
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-1 text-right">
                      <span className="line-clamp-1">{m.awayTeam}</span>
                      <span className="text-base">{m.awayLogo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Score Predictor */}
        <div className="glass-panel p-4 bg-white/5 flex flex-col justify-between min-h-[340px]">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Pálpito de la Fecha
            </h4>
            <p className="text-xs text-gray-400 font-sans mb-4">Elegí un partido y armá tu pronóstico</p>

            {/* Select Match Dropdown */}
            <div className="mb-4">
              <select
                value={predMatchId}
                onChange={(e) => setPredMatchId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-amber-400"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                    {m.flag} {m.homeTeam} vs {m.awayTeam} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Score controls */}
            <div className="flex items-center justify-between gap-2 my-4 bg-black/30 p-4 rounded-2xl border border-white/5">
              {/* Home Team */}
              <div className="text-center flex-1">
                <span className="text-2xl block mb-1">{selectedMatch.homeLogo}</span>
                <span className="text-xs font-bold text-gray-200 block line-clamp-1">{selectedMatch.homeTeam}</span>
                
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => setHomePred(Math.max(0, homePred - 1))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="text-xl font-black font-mono text-amber-400 w-6">{homePred}</span>
                  <button
                    onClick={() => setHomePred(homePred + 1)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="font-mono text-gray-500 font-black text-sm">VS</div>

              {/* Away Team */}
              <div className="text-center flex-1">
                <span className="text-2xl block mb-1">{selectedMatch.awayLogo}</span>
                <span className="text-xs font-bold text-gray-200 block line-clamp-1">{selectedMatch.awayTeam}</span>
                
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => setAwayPred(Math.max(0, awayPred - 1))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="text-xl font-black font-mono text-amber-400 w-6">{awayPred}</span>
                  <button
                    onClick={() => setAwayPred(awayPred + 1)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-2">
            <button
              onClick={handleSharePrediction}
              className="w-full bg-[var(--color-brand-accent)] hover:opacity-90 text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <Share2 className="w-4 h-4" />
              Compartir Pálpito
            </button>

            {showShareToast && (
              <div className="absolute -top-10 left-0 right-0 mx-auto bg-emerald-500 text-black font-extrabold text-xs py-1 px-3 rounded-lg text-center shadow-lg">
                ¡Pálpito copiado! 📋
              </div>
            )}
          </div>
        </div>

        {/* 3. Fan Debate Wall */}
        <div className="glass-panel p-4 bg-white/5 flex flex-col justify-between min-h-[340px]">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              Debate Futbolero
            </h4>
            <p className="text-xs text-gray-400 font-sans mb-3">Opina en vivo sobre los partidos</p>

            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar mb-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-black/30 border border-white/5 p-2 rounded-xl text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-400">{c.name}</span>
                    <span className="text-[10px] text-gray-500">{c.timestamp}</span>
                  </div>
                  <p className="text-gray-300 font-sans">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddComment} className="space-y-2 mt-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="@usuario"
                value={userName}
                onChange={(e) => setUserName(e.target.value.substring(0, 15))}
                className="w-1/3 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400"
              />
              <input
                type="text"
                placeholder="Escribí tu comentario..."
                value={userText}
                required
                onChange={(e) => setUserText(e.target.value.substring(0, 80))}
                className="flex-grow bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

      </div>

      <style jsx global>{`
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
      `}</style>
    </section>
  );
}

