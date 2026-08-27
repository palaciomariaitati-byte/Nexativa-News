"use client";

import React, { useState, useRef } from "react";
import { compressImageClientSide, CompressionResult } from "@/lib/classifieds/imageCompressor";
import { Upload, X, Star, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  onImagesSelected: (compressedImages: CompressionResult[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ onImagesSelected, maxImages = 10 }: Props) {
  const [images, setImages] = useState<CompressionResult[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      setErrorMsg(`Ya has alcanzado el límite máximo de ${maxImages} fotos.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    setIsCompressing(true);
    setCompressionProgress({ current: 0, total: filesToProcess.length });

    const newCompressed: CompressionResult[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      setCompressionProgress({ current: i + 1, total: filesToProcess.length });
      try {
        const result = await compressImageClientSide(filesToProcess[i]);
        newCompressed.push(result);
      } catch (err: any) {
        console.warn(`[Compress Warn] Error al comprimir imagen ${i + 1}:`, err);
      }
    }

    const updated = [...images, ...newCompressed];
    setImages(updated);
    onImagesSelected(updated);
    setIsCompressing(false);
    setCompressionProgress(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    onImagesSelected(updated);
  };

  const handleSetAsCover = (indexToCover: number) => {
    if (indexToCover === 0) return;
    const target = images[indexToCover];
    const rest = images.filter((_, idx) => idx !== indexToCover);
    const updated = [target, ...rest];
    setImages(updated);
    onImagesSelected(updated);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header y Contador */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-bold text-white flex items-center gap-2">
            <ImageIcon size={18} className="text-cyan-400" />
            Galería de Fotos (Hasta {maxImages} fotos)
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Subí fotos del frente, interior, motor, detalles o accesorios. Las imágenes se optimizan automáticamente.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-mono font-bold text-cyan-300 border border-slate-700">
          {images.length} / {maxImages}
        </span>
      </div>

      {/* Zona de Drop / Carga */}
      {images.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isCompressing
              ? "border-cyan-500 bg-cyan-950/20 cursor-wait"
              : "border-slate-700 hover:border-cyan-400/80 bg-slate-900/60 hover:bg-slate-900/90"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={isCompressing}
          />

          {isCompressing ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 size={32} className="text-cyan-400 animate-spin" />
              <p className="text-sm font-semibold text-cyan-300">
                Optimizando {compressionProgress?.current} de {compressionProgress?.total} fotos...
              </p>
              <p className="text-xs text-slate-400">
                Convirtiendo a formato WebP liviano de alta definición
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Upload size={22} />
              </div>
              <p className="text-sm font-bold text-white">
                Toca aquí para seleccionar fotos o arrastralas
              </p>
              <p className="text-xs text-slate-400">
                Podes seleccionar hasta {maxImages - images.length} fotos más simultáneamente (JPG, PNG, WebP)
              </p>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grilla de Miniaturas */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border transition-all ${
                idx === 0
                  ? "border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <img
                src={img.previewUrl}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Badge Portada */}
              {idx === 0 ? (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-cyan-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950 shadow-md">
                  <Star size={10} className="fill-slate-950" />
                  <span>PORTADA</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetAsCover(idx)}
                  className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 rounded-md bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md cursor-pointer"
                  title="Hacer foto principal"
                >
                  <Star size={10} />
                  <span>Hacer Portada</span>
                </button>
              )}

              {/* Botón Eliminar */}
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer"
                title="Eliminar foto"
              >
                <X size={12} />
              </button>

              {/* Badge de Ahorro de Memoria */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 rounded-md bg-slate-950/80 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 flex items-center justify-between border border-slate-800">
                <span>{Math.round(img.compressedSizeBytes / 1024)} KB</span>
                <span className="text-slate-400 font-sans">-{img.reductionPercentage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
