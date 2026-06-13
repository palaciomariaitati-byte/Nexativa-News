"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function GlobalRealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: any = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectRealtime = () => {
      // 1. Limpieza explícita: evitar canales duplicados o fugas de memoria
      if (channel) {
        supabase.removeChannel(channel);
      }

      channel = supabase
        .channel("global_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public" },
          (payload) => {
            console.log(`Cambio detectado en tabla: ${payload.table} (${payload.eventType})`);
            router.refresh();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log("Global Realtime conectado");
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || err) {
            console.log("Global Realtime desconectado/error. Reconectando en 3s...");
            // 3. Reconexión automática por caída de red
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(() => {
              connectRealtime();
            }, 3000);
          }
        });
    };

    connectRealtime();

    // 2. Reconexión nativa al enfocar la pestaña o desbloquear celular
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Pestaña visible: reconectando Global Realtime...");
        router.refresh(); // Forzar update por si nos perdimos algo
        connectRealtime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(reconnectTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  return null;
}
