/**
 * ========================================================================
 * 🖼️ COMPRESOR DE IMÁGENES EN CLIENTE — CLASIFICADOS NEXATIVA
 * Ubicación: /src/lib/classifieds/imageCompressor.ts
 * 
 * Reduce imágenes pesadas de cámaras de celular (5MB - 12MB) a archivos
 * WebP ultra-livianos de alta definición (100KB - 180KB) directamente
 * en el navegador del usuario antes de subirlos a Supabase Storage.
 * ========================================================================
 */

export interface CompressionResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

export async function compressImageClientSide(
  file: File,
  maxWidth = 1440,
  maxHeight = 1440,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo seleccionado no es una imagen válida"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error al leer el archivo de imagen"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Error al procesar la imagen en memoria"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional manteniendo relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
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
        if (!ctx) {
          reject(new Error("No se pudo inicializar el contexto Canvas 2D"));
          return;
        }

        // Suavizado de imagen de alta fidelidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Priorizar WebP, fallback a JPEG
        const outputMime = "image/webp";
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Error al exportar blob comprimido"));
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], cleanFileName, {
              type: outputMime,
              lastModified: Date.now()
            });

            const originalSizeBytes = file.size;
            const compressedSizeBytes = blob.size;
            const reductionPercentage = Math.round(
              ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100
            );

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: compressedFile,
              blob,
              previewUrl,
              originalSizeBytes,
              compressedSizeBytes,
              reductionPercentage,
              width,
              height
            });
          },
          outputMime,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Procesa en lote hasta 10 imágenes con reporte de progreso
 */
export async function batchCompressImages(
  files: File[],
  onProgress?: (index: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  const maxLimit = Math.min(files.length, 10);

  for (let i = 0; i < maxLimit; i++) {
    try {
      const res = await compressImageClientSide(files[i]);
      results.push(res);
      if (onProgress) onProgress(i + 1, maxLimit);
    } catch (err) {
      console.warn(`[Batch Compress Warn] No se pudo comprimir imagen ${i + 1}:`, err);
    }
  }

  return results;
}
