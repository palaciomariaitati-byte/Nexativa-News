"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface InboundAlert {
  id: string;
  senderName: string;
  senderType: "corresponsal" | "ciudadano";
  excerpt: string;
  location?: string;
  timestamp: string;
}

export default function RealtimeAlertListener() {
  const [activeAlert, setActiveAlert] = useState<InboundAlert | null>(null);
  const [permissionState, setPermissionState] = useState<string>("default");
  const lastAlertIdRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const supabase = getSupabaseBrowserClient();

  // Solicitar permiso de Notificaciones de Escritorio al cargar o en interacción
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          setPermissionState(perm);
          console.log("[Desktop Alert] Permiso de notificaciones:", perm);
        });
      }
    }
  }, []);

  // Inicializar Sintetizador de Web Audio API en la primera interacción del usuario
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener("click", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });
    return () => {
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
    };
  }, []);

  // Reproductor de Alarma Audible Sintética (2 tonos potentes de sirena)
  const playAlarmSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const beeps = [
        { freq: 880, start: 0, duration: 0.2 },
        { freq: 1174.66, start: 0.2, duration: 0.2 },
        { freq: 880, start: 0.4, duration: 0.2 },
        { freq: 1174.66, start: 0.6, duration: 0.3 }
      ];

      beeps.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.4, now + start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (e) {
      console.warn("[Realtime Alert] Excepción al reproducir audio:", e);
    }
  }, []);

  // Disparar Notificación Nativa de Windows / Escritorio
  const triggerDesktopNotification = useCallback((alertData: InboundAlert) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const title = alertData.senderType === "corresponsal" 
          ? `🚨 NORA EXTERIORES: Cobertura de ${alertData.senderName}` 
          : `🟢 REPORTE CIUDADANO EN ENTRADA`;

        const notification = new Notification(title, {
          body: alertData.excerpt,
          icon: "/favicon.ico",
          tag: alertData.id,
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          window.location.href = "/admin/news/live";
        };
      }
    }
  }, []);

  // Procesar e invocar la alerta completa
  const handleInboundAlert = useCallback((record: any) => {
    if (!record || !record.id) return;
    if (lastAlertIdRef.current === record.id) return; // Evitar alertas duplicadas

    lastAlertIdRef.current = record.id;
    console.log("🚨 [REALTIME ALERT DISPATCHED]:", record);

    const sender = record.raw_metadata_title?.includes("Reporte Ciudadano") ? "Reporte Ciudadano" : (record.raw_metadata_title || "Nora Exteriores / Corresponsal");
    const excerpt = record.transcription || record.version_nexativa?.excerpt || record.version_nexativa?.title || "Nuevo material periodístico recibido en staging.";

    const alertItem: InboundAlert = {
      id: String(record.id),
      senderName: sender,
      senderType: sender.includes("Ciudadano") ? "ciudadano" : "corresponsal",
      excerpt: excerpt,
      location: record.geolocation_coordinates || "Ituzaingó, Corrientes",
      timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    };

    setActiveAlert(alertItem);
    playAlarmSound();
    triggerDesktopNotification(alertItem);
  }, [playAlarmSound, triggerDesktopNotification]);

  // MONITOREO DUAL: REALTIME SOCKET + POLLING CADA 4 SEGUNDOS (Garantía 100% de entrega)
  useEffect(() => {
    let channel: any = null;

    // 1. Polling de respaldo cada 4 segundos para detectar nuevos registros
    const pollLatestItem = async () => {
      try {
        const { data } = await supabase
          .from("editorial_staging_queue")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.id) {
          if (!lastAlertIdRef.current) {
            // Guardar ID inicial sin sonar la primera vez para no alertar de cosas viejas
            lastAlertIdRef.current = data.id;
          } else if (lastAlertIdRef.current !== data.id) {
            handleInboundAlert(data);
          }
        }
      } catch (err) {
        console.warn("[Realtime Alert] Polling error:", err);
      }
    };

    pollLatestItem();
    const pollInterval = setInterval(pollLatestItem, 4000);

    // 2. Realtime WebSocket Channel
    channel = supabase
      .channel("inbound_news_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "editorial_staging_queue" },
        (payload) => {
          if (payload.new) handleInboundAlert(payload.new);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, handleInboundAlert]);

  if (!activeAlert) return null;

  const whatsappText = `🚨 *NUEVO REPORTE EN ENTRADA - NORA EXTERIORES*%0A🎤 *Remitente:* ${encodeURIComponent(activeAlert.senderName)}%0A📍 *Ubicación:* ${encodeURIComponent(activeAlert.location || "Ituzaingó")}%0A📝 *Extracto:* ${encodeURIComponent(activeAlert.excerpt.substring(0, 200))}%0A👉 *Procesar en el Panel Admin:* https://nexativanews.digital/admin/news/live`;
  const whatsappUrl = `https://wa.me/5493786611250?text=${whatsappText}`;

  return (
    <div className="fixed bottom-6 right-6 z-[99999] max-w-md w-full animate-bounceIn font-sans">
      <div className="bg-gradient-to-br from-black via-zinc-900 to-red-950/90 text-white rounded-2xl border-2 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.5)] p-5 backdrop-blur-2xl relative overflow-hidden">
        
        {/* Header con indicador de alerta */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
              🚨 ALERTA SIMULTÁNEA • NORA
            </span>
            <span className="text-xs text-white/50">{activeAlert.timestamp} hs</span>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="text-white/50 hover:text-white bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
          >
            ✖
          </button>
        </div>

        {/* Detalle del reporte */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-start">
            <p className="font-bold text-sm text-[var(--color-brand-accent)] uppercase tracking-wide">
              {activeAlert.senderName}
            </p>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
              📍 {activeAlert.location}
            </span>
          </div>

          <p className="text-xs text-white/90 font-medium line-clamp-3 leading-relaxed bg-black/50 p-3 rounded-xl border border-white/10">
            "{activeAlert.excerpt}"
          </p>
        </div>

        {/* Acciones del Operador */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href="/admin/news/live"
            onClick={() => setActiveAlert(null)}
            className="bg-gradient-to-r from-[var(--color-brand-accent)] to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-lg transition-all text-center"
          >
            🚀 Lanzar / Procesar
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-lg transition-all text-center"
          >
            📱 Enviar WhatsApp 3786611250
          </a>
        </div>
      </div>
    </div>
  );
}
