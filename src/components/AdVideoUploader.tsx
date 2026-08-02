"use client";

import React, { useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AdVideoUploaderProps {
  onSuccess?: () => void;
  defaultPartnerId?: string;
}

export default function AdVideoUploader({ onSuccess, defaultPartnerId = "cadena4" }: AdVideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [partnerId, setPartnerId] = useState(defaultPartnerId);
  const [channelTarget, setChannelTarget] = useState<"partner_only" | "master_only" | "global">("partner_only");
  const [durationSeconds, setDurationSeconds] = useState(30);
  
  // Progress states
  const [isUploading, setIsUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseBrowserClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        // Generar título por defecto según el nombre del archivo
        const baseName = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(baseName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setErrorMsg("Por favor selecciona un video y especifica un título.");
      return;
    }

    setIsUploading(true);
    setProgressPercent(0);
    setErrorMsg("");
    setStatusMessage("Iniciando subida de pauta publicitaria...");

    try {
      const fileExt = file.name.split('.').pop() || 'mp4';
      const cleanFileName = `pauta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `pautas_publicitarias/${cleanFileName}`;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error("Credenciales de Supabase no disponibles en el cliente.");
      }

      // Subida con XMLHttpRequest para tener la BARRA DE CARGA REAL (%)
      const uploadUrl = `${supabaseUrl}/storage/v1/object/uploads/${filePath}`;
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgressPercent(percent);
          setUploadedBytes(event.loaded);
          setTotalBytes(event.total);
          setStatusMessage(`Subiendo video: ${percent}% (${(event.loaded / (1024 * 1024)).toFixed(1)} MB de ${(event.total / (1024 * 1024)).toFixed(1)} MB)`);
        }
      };

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);
            resolve(data.publicUrl);
          } else {
            reject(new Error(`Error al subir archivo: ${xhr.statusText || xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error("Error de red durante la subida del video."));
      });

      xhr.send(file);

      const publicVideoUrl = await uploadPromise;
      setStatusMessage("Video subido. Registrando pauta en la base de datos...");

      // Registrar en la tabla ad_spots (o partner_videos / video_queue)
      const { error: dbError } = await supabase.from("ad_spots").insert([
        {
          title: title,
          video_url: publicVideoUrl,
          partner_id: partnerId,
          channel_target: channelTarget,
          status: "active",
          created_by_role: partnerId === "nexativa_main" ? "master_nexativa" : "partner_operator",
          duration_seconds: durationSeconds,
          position: 1
        }
      ]);

      if (dbError) {
        // Fallback a tabla video_queue si ad_spots no fue creada aún en SQL
        console.warn("Fallback a video_queue debido a:", dbError.message);
        await supabase.from("video_queue").insert([
          {
            title: `[PAUTA] ${title}`,
            video_url: publicVideoUrl,
            type: "custom",
            status: "queued",
            position: 1
          }
        ]);
      }

      setStatusMessage("✅ ¡Pauta publicitaria cargada y lista para salir al aire!");
      setFile(null);
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      setTimeout(() => {
        setIsUploading(false);
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Error al subir pauta:", err);
      setErrorMsg(err.message || "Error al procesar la subida del video.");
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black/60 via-zinc-900/80 to-black/80 rounded-2xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-accent)]/20 border border-[var(--color-brand-accent)]/40 flex items-center justify-center text-[var(--color-brand-accent)] font-bold text-xl">
          🎬
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide">Subir Pauta Publicitaria Externa</h3>
          <p className="text-xs text-white/50">Carga videos editados fuera de la plataforma con barra de progreso en tiempo real.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wider mb-2">
              Título / Anunciante *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Pauta Comercial Coca Cola 30s"
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-brand-accent)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wider mb-2">
              Socio / Medio *
            </label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-brand-accent)] transition-all"
            >
              <option value="cadena4">Cadena 4 (Ituzaingó)</option>
              <option value="nexativa_main">Nexativa News (Master Principal)</option>
              <option value="radio_corrientes">Radio Corrientes Partner</option>
              <option value="nuevo_socio">Futuro Socio / Medio</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wider mb-2">
              Destino de Emisión
            </label>
            <select
              value={channelTarget}
              onChange={(e: any) => setChannelTarget(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-brand-accent)] transition-all"
            >
              <option value="partner_only">Solo en el Portal del Socio (ej: Cadena 4)</option>
              <option value="master_only">Solo en Nexativa News (Master)</option>
              <option value="global">Global (Todas las señales coordinadas)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wider mb-2">
              Duración Estimada (segundos)
            </label>
            <input
              type="number"
              min={5}
              max={600}
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 30)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-brand-accent)] transition-all"
            />
          </div>
        </div>

        {/* Zona de Selección de Archivo */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wider mb-2">
            Archivo de Video (MP4, WebM, MOV) *
          </label>
          <div className="relative border-2 border-dashed border-white/20 hover:border-[var(--color-brand-accent)]/60 rounded-2xl p-6 text-center transition-all bg-black/30 group cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="space-y-2 pointer-events-none">
              <div className="text-3xl group-hover:scale-110 transition-transform">📹</div>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-emerald-400">{file.name}</p>
                  <p className="text-xs text-white/50">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-white/80">Arrastra aquí el video o haz clic para seleccionar</p>
                  <p className="text-xs text-white/40">Formatos soportados: .mp4, .webm, .mov (Cualquier resolución)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BARRA DE CARGA EN TIEMPO REAL */}
        {isUploading && (
          <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-[var(--color-brand-accent)]/30 animate-pulse">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[var(--color-brand-accent)] tracking-wider uppercase">Progreso de Subida</span>
              <span className="text-white text-sm">{progressPercent}%</span>
            </div>
            
            {/* Contenedor de la barra */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-[var(--color-brand-accent)] rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(234,179,8,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-white/60 text-center font-mono">{statusMessage}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-brand-accent)] to-amber-500 text-black font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
        >
          {isUploading ? `Subiendo Video (${progressPercent}%)...` : "🚀 Cargar Pauta a la Plataforma"}
        </button>
      </form>
    </div>
  );
}
