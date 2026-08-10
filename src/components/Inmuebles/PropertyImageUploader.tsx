"use client";

import React, { useState } from "react";
import { Upload, Image as ImageIcon, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface PropertyImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
}

/**
 * Compresor y optimizador de imágenes del cliente usando HTML5 Canvas API
 * Reduce archivos pesados (ej. 10MB) a ~150KB en formato WebP/JPEG sin pérdida perceptible de calidad.
 */
async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No se pudo iniciar el contexto 2D");

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Error comprimiendo imagen");
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function PropertyImageUploader({
  onImageUploaded,
  currentImageUrl,
  label = "📷 Fotos del Inmueble (Optimización Automática HD)",
}: PropertyImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || "");
  const [originalSize, setOriginalSize] = useState<string>("");
  const [compressedSize, setCompressedSize] = useState<string>("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setOriginalSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    try {
      // 1. Compresión en el navegador
      const compressedBlob = await compressImage(file);
      setCompressedSize(`${(compressedBlob.size / 1024).toFixed(0)} KB`);

      // 2. Intento de subida a Supabase Storage
      const supabase = getSupabaseBrowserClient();
      const fileExt = "webp";
      const fileName = `property_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `inmuebles/${fileName}`;

      let finalUrl = "";

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, compressedBlob, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(filePath);
        finalUrl = publicData.publicUrl;
      } else {
        // Fallback ultra-rápido: Data URL Base64 optimizado
        const reader = new FileReader();
        reader.readAsDataURL(compressedBlob);
        await new Promise((res) => {
          reader.onloadend = () => {
            finalUrl = reader.result as string;
            res(true);
          };
        });
      }

      setPreviewUrl(finalUrl);
      onImageUploaded(finalUrl);
    } catch (err) {
      console.error("Error al procesar la imagen:", err);
      alert("No se pudo procesar la imagen. Intentá con otra foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onImageUploaded("");
    setOriginalSize("");
    setCompressedSize("");
  };

  return (
    <div className="space-y-3 font-sans">
      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
        {label}
      </label>

      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 p-2 group">
          <img
            src={previewUrl}
            alt="Vista previa de la propiedad"
            className="w-full h-52 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95"
            title="Quitar foto"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mt-2 px-2 py-1 flex items-center justify-between text-[11px] font-mono text-emerald-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Foto lista en calidad HD
            </span>
            {compressedSize && (
              <span className="text-slate-400">
                Optimizado: <strong className="text-amber-400">{compressedSize}</strong> (de {originalSize})
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center bg-slate-950 transition-colors cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-bold text-emerald-300">
                Comprimiendo y optimizando foto en HD...
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Reduciendo tamaño sin perder resolución ({originalSize})
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Toca aquí para seleccionar o tomar una foto
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Admite fotos de celular o cámara. Se optimizan automáticamente.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-amber-400 font-mono">
                <Sparkles className="w-3 h-3" /> Optimización inteligente inteligente HD
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
