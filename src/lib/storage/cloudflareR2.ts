import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "nora-media";

/**
 * Cliente de S3 inicializado dinámicamente para Cloudflare R2
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "https://placeholder.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Sube un archivo binario (Buffer) a Cloudflare R2
 */
export async function uploadToR2(fileName: string, buffer: Buffer, contentType: string = "video/mp4"): Promise<string | null> {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn("[Cloudflare R2 Warning] Variables de entorno R2 no configuradas. Usando canal secundario/fallback.");
    return null;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://${R2_BUCKET_NAME}.${accountId}.r2.dev`;
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${fileName}`;
    console.log(`[Cloudflare R2 Success] ✅ Archivo subido exitosamente: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.error("[Cloudflare R2 Error]:", err.message);
    return null;
  }
}

export { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command };
