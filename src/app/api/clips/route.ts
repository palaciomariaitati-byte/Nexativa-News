import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// GET: Fetch all clips stored on Nexativa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const category = searchParams.get("category");

    const allClips: any[] = [];
    const seenSignatures = new Set<string>();

    // 1. Try querying news_clips table
    try {
      let query = supabaseAdmin
        .from("news_clips")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq("category", category);
      }

      const { data: clipsData, error: clipsError } = await query;

      if (!clipsError && Array.isArray(clipsData) && clipsData.length > 0) {
        clipsData.forEach((clip) => {
          const sig = `${clip.video_url}_${clip.start_time_seconds}_${clip.end_time_seconds}`;
          seenSignatures.add(sig);
          allClips.push(clip);
        });
      }
    } catch (err: any) {
      console.warn("[Clips API] news_clips no disponible aún:", err.message);
    }

    // 2. Also extract segments from news_flashes table to ensure zero loss
    try {
      const { data: flashesData, error: flashesError } = await supabaseAdmin
        .from("news_flashes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!flashesError && Array.isArray(flashesData)) {
        flashesData.forEach((flash) => {
          if (Array.isArray(flash.segments)) {
            flash.segments.forEach((seg: any, idx: number) => {
              const videoUrl = seg.video_url || flash.video_url;
              const startTime = seg.start_time_seconds ?? 0;
              const endTime = seg.end_time_seconds ?? (seg.duration_seconds || 60);
              const sig = `${videoUrl}_${startTime}_${endTime}`;

              if (!seenSignatures.has(sig)) {
                seenSignatures.add(sig);
                const ytId = getYouTubeId(videoUrl);
                const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : (flash.thumbnail_url || null);

                allClips.push({
                  id: seg.id || `flash-seg-${flash.id}-${idx}`,
                  flash_id: flash.id,
                  flash_title: flash.title,
                  title: seg.title || flash.title,
                  summary: seg.summary || flash.summary,
                  video_url: videoUrl,
                  source_title: seg.source_title || "Programa",
                  start_time_seconds: startTime,
                  end_time_seconds: endTime,
                  start_timestamp: seg.start_timestamp || "00:00",
                  end_timestamp: seg.end_timestamp || "01:00",
                  duration_seconds: seg.duration_seconds || Math.max(1, endTime - startTime),
                  impact_score: seg.impact_score || 8,
                  category: seg.category || flash.category || "nacional",
                  social_caption: seg.social_caption || "",
                  thumbnail_url: thumb,
                  status: "ready",
                  created_at: flash.created_at || new Date().toISOString()
                });
              }
            });
          }
        });
      }
    } catch (err: any) {
      console.warn("[Clips API] Error extrayendo clips de news_flashes:", err.message);
    }

    return NextResponse.json({
      success: true,
      total: allClips.length,
      clips: allClips
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Clips API Error]:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Error al obtener clips"
    }, { status: 500, headers: corsHeaders });
  }
}

// POST: Save one or multiple clips
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawClips = Array.isArray(body.clips) ? body.clips : [body];

    if (rawClips.length === 0 || !rawClips[0]?.video_url) {
      return NextResponse.json({
        success: false,
        error: "Se requiere al menos un clip con video_url válido."
      }, { status: 400, headers: corsHeaders });
    }

    const preparedClips = rawClips.map((clip: any) => {
      const ytId = getYouTubeId(clip.video_url);
      const thumbnail_url = clip.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);
      const duration = clip.duration_seconds || (Math.max(1, (clip.end_time_seconds || 60) - (clip.start_time_seconds || 0)));

      return {
        title: clip.title || "Clip Informativo",
        summary: clip.summary || "",
        video_url: clip.video_url,
        source_title: clip.source_title || "Programa",
        start_time_seconds: clip.start_time_seconds ?? 0,
        end_time_seconds: clip.end_time_seconds ?? 60,
        start_timestamp: clip.start_timestamp || "00:00",
        end_timestamp: clip.end_timestamp || "01:00",
        duration_seconds: duration,
        impact_score: clip.impact_score || 8,
        category: clip.category || "nacional",
        social_caption: clip.social_caption || "",
        thumbnail_url,
        status: clip.status || "ready",
        updated_at: new Date().toISOString()
      };
    });

    let savedClips: any[] = [];
    let savedToClipsTable = false;

    // Attempt 1: Insert into news_clips
    try {
      const { data, error } = await supabaseAdmin
        .from("news_clips")
        .insert(preparedClips)
        .select();

      if (!error && data) {
        savedClips = data;
        savedToClipsTable = true;
      }
    } catch (e: any) {
      console.warn("[Clips API] Inserción en news_clips no pudo completarse:", e.message);
    }

    // Fallback/Mirror in news_flashes to guarantee zero loss
    try {
      const firstClip = preparedClips[0];
      const ytId = getYouTubeId(firstClip.video_url);
      const embedUrl = ytId
        ? `https://www.youtube.com/embed/${ytId}?start=${firstClip.start_time_seconds}&end=${firstClip.end_time_seconds}&autoplay=1`
        : firstClip.video_url;

      await supabaseAdmin
        .from("news_flashes")
        .insert([{
          title: preparedClips.length === 1 
            ? `🎬 CLIP: ${firstClip.title}`
            : `🎬 LOTE DE ${preparedClips.length} CLIPS NORA: ${firstClip.title}`,
          summary: preparedClips.map((c: any) => `• [${c.source_title}] ${c.title}: ${c.summary}`).join("\n"),
          duration_seconds: preparedClips.reduce((acc: number, c: any) => acc + c.duration_seconds, 0),
          video_url: firstClip.video_url,
          thumbnail_url: firstClip.thumbnail_url,
          embed_url: embedUrl,
          segments: preparedClips,
          category: firstClip.category || "nacional",
          partner_visible: true,
          status: "published",
          updated_at: new Date().toISOString()
        }]);
    } catch (e: any) {
      console.warn("[Clips API] Respaldo en news_flashes advertencia:", e.message);
    }

    return NextResponse.json({
      success: true,
      message: `¡${preparedClips.length} clip(s) almacenados exitosamente en la plataforma Nexativa!`,
      saved_to_clips_table: savedToClipsTable,
      clips: savedClips.length > 0 ? savedClips : preparedClips
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Clips API POST Error]:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Error al guardar clips"
    }, { status: 500, headers: corsHeaders });
  }
}

// DELETE: Delete a clip by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400, headers: corsHeaders });
    }

    // Try deleting from news_clips
    try {
      await supabaseAdmin.from("news_clips").delete().eq("id", id);
    } catch (e) {}

    // Also try deleting if it was saved as a single-clip news_flash
    if (id.startsWith("flash-seg-")) {
      const parts = id.split("-");
      const flashId = parts[2];
      if (flashId) {
        try {
          await supabaseAdmin.from("news_flashes").delete().eq("id", flashId);
        } catch (e) {}
      }
    } else {
      try {
        await supabaseAdmin.from("news_flashes").delete().eq("id", id);
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: "Clip eliminado correctamente" }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
