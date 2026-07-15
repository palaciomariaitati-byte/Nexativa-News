/* src/components/NationalRibbon.tsx */
"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";

export default function NationalRibbon() {
  const [isAlbiceleste, setIsAlbiceleste] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [matchStatus, setMatchStatus] = useState<"upcoming" | "live" | "finished">("upcoming");

  // Semifinal target time: July 15, 2026 at 16:00:00 UTC-3
  const targetDate = new Date("2026-07-15T16:00:00-03:00");

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("modoHincha") === "true";
    setIsAlbiceleste(savedTheme);
    if (savedTheme) {
      document.body.classList.add("albiceleste-theme");
    } else {
      document.body.classList.remove("albiceleste-theme");
    }
  }, []);

  // Countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        // If within 3 hours after start, match is live
        const threeHours = 3 * 60 * 60 * 1000;
        if (difference > -threeHours) {
          setMatchStatus("live");
        } else {
          setMatchStatus("finished");
        }
        return;
      }

      setMatchStatus("upcoming");

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Toggle theme mode
  const toggleTheme = () => {
    const nextState = !isAlbiceleste;
    setIsAlbiceleste(nextState);
    localStorage.setItem("modoHincha", String(nextState));

    if (nextState) {
      document.body.classList.add("albiceleste-theme");
      // Optional: Dispatch event to trigger confetti or sound elsewhere
      window.dispatchEvent(new CustomEvent("modoHinchaToggled", { detail: true }));
    } else {
      document.body.classList.remove("albiceleste-theme");
      window.dispatchEvent(new CustomEvent("modoHinchaToggled", { detail: false }));
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-sky-400 via-white to-sky-400 text-black py-2.5 px-4 font-sans font-bold flex flex-col md:flex-row items-center justify-between shadow-[0_4px_20px_rgba(116,172,223,0.3)] relative z-50 text-xs sm:text-sm border-b border-sky-300">
      {/* Light glow overlay */}
      <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />

      {/* Flag Sun accent in center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden lg:block">
        <svg width="40" height="40" viewBox="0 0 100 100" className="animate-spin-slow">
          <circle cx="50" cy="50" r="10" fill="#FFB81C" />
          {[...Array(16)].map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke="#FFB81C"
              strokeWidth="4"
              transform={`rotate(${i * 22.5} 50 50)`}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      {/* Left section: Text info */}
      <div className="flex items-center gap-2 mb-2 md:mb-0 relative z-10">
        <Trophy className="w-4 h-4 text-amber-600 animate-bounce" />
        <span className="tracking-wide">
          {matchStatus === "upcoming" && "🇦🇷 ¡HOY JUEGA ARGENTINA! Semifinales de la Copa del Mundo"}
          {matchStatus === "live" && "🔥 ¡JUEGA LA SELECCIÓN EN VIVO! Alentando por el pase a la final"}
          {matchStatus === "finished" && "🇦🇷 ¡GRACIAS SELECCIÓN! Pasión Nacional en Nexativa News"}
        </span>
      </div>

      {/* Right section: Timer & Toggle */}
      <div className="flex items-center gap-4 relative z-10">
        {matchStatus === "upcoming" && (
          <div className="bg-black/10 px-3 py-1 rounded-full text-xs font-mono tracking-widest flex items-center gap-1.5 border border-black/5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            INICIO: <span className="font-extrabold">{timeLeft}</span>
          </div>
        )}
        {matchStatus === "live" && (
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-extrabold animate-pulse tracking-wider">
            EN VIVO
          </div>
        )}

        <button
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold transition-all duration-300 shadow-md ${
            isAlbiceleste
              ? "bg-black text-[#FFB81C] hover:bg-black/90 scale-105 border border-[#FFB81C]/20"
              : "bg-sky-600 text-white hover:bg-sky-700"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isAlbiceleste ? "DESACTIVAR HINCHA" : "MODO HINCHA 🇦🇷"}
        </button>
      </div>
    </div>
  );
}
