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

    let refreshTimer: NodeJS.Timeout | null = null;
    const safeRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        router.refresh();
      }, 1000);
    };

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
            safeRefresh();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log("Global Realtime conectado");
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || err) {
            console.log("Global Realtime desconectado/error. Reconectando en 5s...");
            // 3. Reconexión automática por caída de red
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(() => {
              connectRealtime();
            }, 5000);
          }
        });
    };

    connectRealtime();

    // 2. Reconexión nativa al enfocar la pestaña o desbloquear celular
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Pestaña visible: reconectando Global Realtime...");
        safeRefresh();
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
