import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET: Recuperar sesiones del usuario o mensajes de una sesión específica
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const sessionId = searchParams.get("session_id");

    const supabase = createServerSupabaseClient();

    // 1. Si se solicita una sesión específica: Devolver sus mensajes cronológicos limpios
    if (sessionId) {
      const { data: messages, error: msgError } = await supabase
        .from("noraitu_messages")
        .select("id, role, content, created_at, metadata")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 500 });
      }

      const cleanMessages = (messages || []).filter(
        (m: any) => m.content && typeof m.content === "string" && m.content.trim().length > 0
      );

      return NextResponse.json({ messages: cleanMessages });
    }

    // 2. Si se solicita por user_id: Devolver el listado de sesiones
    if (userId) {
      const { data: sessions, error: sessError } = await supabase
        .from("noraitu_sessions")
        .select("id, title, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (sessError) {
        return NextResponse.json({ error: sessError.message }, { status: 500 });
      }

      return NextResponse.json({ sessions: sessions || [] });
    }

    return NextResponse.json({ error: "Parámetro user_id o session_id requerido." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error en el servidor." }, { status: 500 });
  }
}

// DELETE: Eliminar una sesión y sus mensajes en cascada
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id requerido." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("noraitu_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al eliminar sesión." }, { status: 500 });
  }
}
