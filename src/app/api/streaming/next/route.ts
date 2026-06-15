import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: "No videoId provided" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 1. Marcar el video actual como 'played' o eliminarlo. Vamos a marcarlo como played para historial
    // pero como en AdminStreamingPage los filtra todos, si no es 'queued' o 'playing' tal vez no se vea bien
    // o podemos simplemente eliminarlo de la cola para mantenerla limpia.
    // Vamos a eliminarlo para que la cola avance y no se llene.
    const { error: delError } = await supabase
      .from("video_queue")
      .delete()
      .eq("id", videoId)
      .eq("status", "playing");

    if (delError) {
      console.error("Error eliminando video anterior:", delError);
      return NextResponse.json({ error: "Failed to remove previous video" }, { status: 500 });
    }

    // 2. Buscar el siguiente video en la cola
    const { data: nextVideos, error: fetchError } = await supabase
      .from("video_queue")
      .select("*")
      .eq("status", "queued")
      .order("position", { ascending: true })
      .limit(1);

    if (fetchError || !nextVideos || nextVideos.length === 0) {
      return NextResponse.json({ message: "Queue is empty, nothing to play next" });
    }

    const nextVideo = nextVideos[0];

    // 3. Poner el siguiente video como 'playing'
    const { error: updateError } = await supabase
      .from("video_queue")
      .update({ status: "playing" })
      .eq("id", nextVideo.id);

    if (updateError) {
      console.error("Error activando siguiente video:", updateError);
      return NextResponse.json({ error: "Failed to activate next video" }, { status: 500 });
    }

    return NextResponse.json({ success: true, nextVideoId: nextVideo.id });

  } catch (err: any) {
    console.error("Error en /api/streaming/next:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
