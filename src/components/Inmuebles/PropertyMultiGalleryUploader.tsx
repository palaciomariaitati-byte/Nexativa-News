"use client";

import React, { useState } from "react";
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2, 
  X, 
  Plus, 
  Trash2, 
  Camera, 
  MoveUp, 
  MoveDown,
  Sparkles,
  Info
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface GalleryPhoto {
  id: string;
  url: string;
  roomTag: string; // ej: "Dormitorio Principal", "Piscina", "Quincho / Parrilla", "Cocina", "Vista Exterior"
  caption: string; // Pie descriptivo
}

interface PropertyMultiGalleryUploaderProps {
  photos: GalleryPhoto[];
  onChange: (photos: GalleryPhoto[]) => void;
  maxPhotos?: number;
  minPhotos?: number;
}

const ROOM_SUGGESTIONS = [
  "Fachada / Exterior",
  "Dormitorio Principal",
  "Dormitorio Secundario",
  "Living / Sala de Estar",
  "Cocina & Comedor",
  "Piscina & Solárium",
  "Quincho & Parrilla",
  "Baño Principal",
  "Parque / Jardín",
  "Vista al Río / Paisaje",
  "Estacionamiento / Garage",
  "Otro Espacio"
];

async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<Blob> {
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
        if (!ctx) return reject("Error en contexto 2D");

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Error al comprimir");
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

export default function PropertyMultiGalleryUploader({
  photos = [],
  onChange,
  maxPhotos = 10,
  minPhotos = 5
}: PropertyMultiGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`Podés subir un máximo de ${maxPhotos} fotos en total.`);
      return;
    }

    setUploading(true);
    const newPhotos: GalleryPhoto[] = [...photos];
    const supabase = getSupabaseBrowserClient();

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Optimizando y subiendo foto ${i + 1} de ${files.length}...`);

        const compressedBlob = await compressImage(file);
        const fileExt = "webp";
        const fileName = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
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
          // Fallback a bucket media
          const { data: mediaData, error: mediaError } = await supabase.storage
            .from("media")
            .upload(filePath, compressedBlob, { contentType: "image/webp", upsert: true });
          if (!mediaError && mediaData) {
            const { data: publicData } = supabase.storage.from("media").getPublicUrl(filePath);
            finalUrl = publicData.publicUrl;
          } else {
            // Fallback a base64
            finalUrl = await new Promise<string>((res) => {
              const r = new FileReader();
              r.onload = (ev) => res(ev.target?.result as string);
              r.readAsDataURL(compressedBlob);
            });
          }
        }

        const autoRoom = ROOM_SUGGESTIONS[newPhotos.length % ROOM_SUGGESTIONS.length] || "Espacio del Inmueble";

        newPhotos.push({
          id: `photo_${Date.now()}_${i}`,
          url: finalUrl,
          roomTag: autoRoom,
          caption: ""
        });
      }

      onChange(newPhotos);
    } catch (err: any) {
      alert("Error subiendo fotos: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const handleUpdatePhoto = (id: string, field: "roomTag" | "caption", value: string) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    onChange(updated);
  };

  const handleDeletePhoto = (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    onChange(updated);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === photos.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const copy = [...photos];
    const item = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = item;
    onChange(copy);
  };

  return (
    <div className="space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
        <div>
          <label className="text-sm font-extrabold text-rose-300 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-rose-400" />
            Galería Completa de Fotos del Inmueble (5 a {maxPhotos} fotos)
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Sube fotos de cada espacio (dormitorios, pileta, quincho, cocina) y añade una descripción al pie de cada una.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
            photos.length >= minPhotos 
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
          }`}>
            {photos.length} / {maxPhotos} fotos {photos.length >= minPhotos ? "✓ Cumple Mínimo" : `(Mínimo ${minPhotos})`}
          </span>
        </div>
      </div>

      {/* Lista de Fotos Cargadas con Controles */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {photos.map((photo, index) => (
            <div 
              key={photo.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 relative group hover:border-rose-500/50 transition-all shadow-md"
            >
              {/* Badge de Portada o Número */}
              <div className="absolute top-2 left-2 z-10">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow ${
                  index === 0 ? "bg-rose-500 text-slate-950" : "bg-black/80 text-white border border-white/20"
                }`}>
                  {index === 0 ? "★ Portada Principal" : `Foto #${index + 1}`}
                </span>
              </div>

              {/* Imagen */}
              <div className="w-full sm:w-36 h-32 rounded-lg overflow-hidden bg-black shrink-0 relative">
                <img 
                  src={photo.url} 
                  alt={photo.roomTag} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Controles de Ambiente y Pie de Foto */}
              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Espacio / Ambiente:
                    </label>
                    <select
                      value={photo.roomTag}
                      onChange={(e) => handleUpdatePhoto(photo.id, "roomTag", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400 cursor-pointer"
                    >
                      {ROOM_SUGGESTIONS.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Pie Descriptivo / Comentario del espacio:
                    </label>
                    <input
                      type="text"
                      value={photo.caption}
                      onChange={(e) => handleUpdatePhoto(photo.id, "caption", e.target.value)}
                      placeholder="Ej: Aire acondicionado split frío/calor y sommier king..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                {/* Acciones: Ordenar y Eliminar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      title="Mover arriba"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, "down")}
                      disabled={index === photos.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      title="Mover abajo"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón de Subida Múltiple */}
      {photos.length < maxPhotos && (
        <div className="relative">
          <label className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all ${
            uploading
              ? "bg-slate-950 border-rose-500/50 opacity-80"
              : "bg-slate-950/60 border-slate-700 hover:border-rose-400 hover:bg-slate-950"
          }`}>
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={uploading}
              onChange={handleFilesSelected}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                <span className="text-xs text-rose-200 font-bold">{uploadProgress}</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    {photos.length === 0 ? "Subir Fotos del Inmueble (Seleccioná 5 a 7 fotos juntas)" : "+ Añadir Más Fotos"}
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Podés seleccionar múltiples fotos a la vez desde tu celular o computadora. Optimización automática en HD.
                  </span>
                </div>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
