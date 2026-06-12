"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function GlobalRealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Nos suscribimos a todos los cambios en todas las tablas del esquema public
    const channel = supabase
      .channel("global_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          console.log(`Cambio detectado en tabla: ${payload.table} (${payload.eventType})`);
          // router.refresh() indica a Next.js que re-obtenga los datos de los Server Components
          // sin causar un "hard reload" en el navegador, dando una sensación de tiempo real fluido.
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
