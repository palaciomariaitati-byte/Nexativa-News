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
  const [permissionGranted, setPermissionGranted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const supabase = getSupabaseBrowserClient();

  // Solicitar permiso de Notificaciones de Escritorio (HTML5 Push API)
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionGranted(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") setPermissionGranted(true);
        });
      }
    }
  }, []);

  // Sintetizador de Sonido de Sirena / Alerta Periodística mediante Web Audio API
  const playAlarmSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Generar 3 beeps secuenciales de sirena periodística
      const beeps = [
        { freq: 880, start: 0, duration: 0.15 },
        { freq: 1174.66, start: 0.15, duration: 0.15 },
        { freq: 880, start: 0.30, duration: 0.15 },
        { freq: 1174.66, start: 0.45, duration: 0.25 }
      ];

      beeps.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.3, now + start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (e) {
      console.warn("[Realtime Alert] No se pudo reproducir audio Web Audio API:", e);
    }
  }, []);

  // Disparar Notificación de Escritorio Nativa
  const triggerDesktopNotification = useCallback((alertData: InboundAlert) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const title = alertData.senderType === "corresponsal" 
        ? `🚨 ALERTA: Cobertura de ${alertData.senderName}` 
        : `🟢 ALERTA: Reporte Ciudadano`;

      const notification = new Notification(title, {
        body: alertData.excerpt,
        icon: "/favicon.ico",
        tag: alertData.id,
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = "/admin/news/live";
      };
    }
  }, []);

  // Procesar nuevo reporte en tiempo real
  const handleNewReport = useCallback((payload: any) => {
    console.log("🚨 [Realtime Alert] ¡NUEVO REPORTE RECIBIDO EN STAGING!", payload);

    const newRecord = payload.new || payload;
    const title = newRecord.version_nexativa?.title || newRecord.raw_metadata_title || "Nuevo Reporte en Entrada";
    const sender = newRecord.raw_metadata_title?.includes("Reporte Ciudadano") ? "Ciudadano" : "Nora Exteriores / Corresponsal";
    const excerpt = newRecord.transcription || newRecord.version_nexativa?.excerpt || "Material periodístico recibido.";

    const alertItem: InboundAlert = {
      id: newRecord.id || String(Date.now()),
      senderName: sender,
      senderType: sender.includes("Ciudadano") ? "ciudadano" : "corresponsal",
      excerpt: excerpt,
      location: newRecord.geolocation_coordinates || "Ituzaingó, Corrientes",
      timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    };

    setActiveAlert(alertItem);
    playAlarmSound();
    triggerDesktopNotification(alertItem);
  }, [playAlarmSound, triggerDesktopNotification]);

  // Suscripción Realtime a Supabase
  useEffect(() => {
    let channel: any = null;

    const setupSubscription = () => {
      channel = supabase
        .channel("realtime_inbound_alerts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "editorial_staging_queue" },
          (payload) => handleNewReport(payload)
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "nora_leads" },
          (payload) => handleNewReport(payload)
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("🟢 [Realtime Alert] Escuchando alertas de entrada en vivo...");
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, handleNewReport]);

  if (!activeAlert) return null;

  const whatsappMessage = `🚨 *ALERTA DE NOTICIA EN ENTRADA*%0A🎤 *Remitente:* ${activeAlert.senderName}%0A📍 *Ubicación:* ${activeAlert.location}%0A📝 *Extracto:* ${activeAlert.excerpt.substring(0, 150)}...%0A👉 *Procesar en Vivo:* https://nexativanews.digital/admin/news/live`;
  const whatsappUrl = `https://wa.me/5493786611250?text=${whatsappMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-md w-full animate-bounceIn font-sans">
      <div className="bg-gradient-to-br from-black via-zinc-900 to-red-950/90 text-white rounded-2xl border-2 border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.4)] p-5 backdrop-blur-2xl relative overflow-hidden">
        
        {/* Header con Pulso de Alerta Rojo */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
              🚨 NOTICIA EN ENTRADA
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

        {/* Cuerpo de la Noticia */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-start">
            <p className="font-bold text-sm text-[var(--color-brand-accent)] uppercase tracking-wide">
              {activeAlert.senderName}
            </p>
            {activeAlert.location && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                📍 {activeAlert.location}
              </span>
            )}
          </div>

          <p className="text-xs text-white/90 font-medium line-clamp-3 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
            "{activeAlert.excerpt}"
          </p>
        </div>

        {/* Acciones de la Alerta */}
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
            📱 WhatsApp 3786611250
          </a>
        </div>
      </div>
    </div>
  );
}
