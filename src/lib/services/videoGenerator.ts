import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VideoCampaignDirective } from "@/lib/nora/schemas";

export interface VideoGenerationJob {
  jobId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  videoUrl?: string;
  error?: string;
}

/**
 * Despacha un trabajo de renderizado de video asíncrono a servidores de cómputo GPU gratuitos
 */
export async function dispatchSurrealVideoJob(
  directive: VideoCampaignDirective, 
  userPhoneOrSession?: string
): Promise<VideoGenerationJob> {
  const jobId = `vjob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullPrompt = `${directive.base_scene_prompt || ''}. ${directive.surreal_intervention || ''}. ${directive.camera_movement || ''}, photorealistic commercial photography, 4k resolution, zero artifacts.`;

  console.log(`[Video Generator] 🎬 Despachando trabajo ${jobId} para modelo ${directive.target_model || 'wan-2.1'}...`);

  try {
    const hfToken = process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN;

    // Disparo de petición no-bloqueante en segundo plano
    if (hfToken) {
      fetch("https://api-inference.huggingface.co/models/Wan-AI/Wan2.1-T2V-1.4B", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "X-Wait-For-Model": "true"
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: { num_frames: 81, fps: 16 }
        })
      }).then(async (res) => {
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          
          // 1. Intentar subida principal a Cloudflare R2 (10 GB Gratis, 0 cost egreso)
          const { uploadToR2 } = await import("@/lib/storage/cloudflareR2");
          let publicUrl = await uploadToR2(`surreal_videos/${jobId}.mp4`, buffer, "video/mp4");

          // 2. Fallback secundario a Supabase Storage si R2 no está configurado
          if (!publicUrl) {
            const supabase = createServerSupabaseClient();
            const fileName = `surreal_videos/${jobId}.mp4`;
            const { data: storageData, error: storageErr } = await supabase.storage
              .from("media")
              .upload(fileName, buffer, { contentType: "video/mp4", upsert: true });

            if (!storageErr && storageData) {
              publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${fileName}`;
            }
          }

          if (publicUrl) {
            console.log(`[Video Generator] ✅ Video renderizado y almacenado: ${publicUrl}`);
            
            if (userPhoneOrSession) {
              const webhookNotifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nexativanews.digital'}/api/webhooks/video-status`;
              await fetch(webhookNotifyUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, status: "COMPLETED", videoUrl: publicUrl, phone: userPhoneOrSession })
              }).catch(() => {});
            }
          }
        }
      }).catch(err => console.error(`[Video Generator Error] ${jobId}:`, err.message));
    }

    return { jobId, status: "QUEUED" };
  } catch (err: any) {
    console.error("[Video Generator Exception]:", err);
    return { jobId, status: "FAILED", error: err.message };
  }
}
