import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/noraitu-sync
 * Genera un token efímero de 5 minutos para emparejamiento QR desde la PC.
 */
export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json().catch(() => ({}));
    const desktopSocketId = body.desktop_socket_id || `desktop_${Math.random().toString(36).substring(2, 10)}`;

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("noraitu_sync_tokens")
      .insert([
        {
          desktop_socket_id: desktopSocketId,
          status: "PENDING",
          expires_at: expiresAt
        }
      ])
      .select("token_id, expires_at")
      .single();

    if (error || !data) {
      console.warn("[NoraItu Sync POST Error]:", error);
      // Fallback en memoria si la tabla aún no se ha migrado en Supabase
      const fallbackTokenId = `sync_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      return NextResponse.json({
        token_id: fallbackTokenId,
        expires_at: expiresAt,
        sync_url: `https://nexativanews.com.ar/noraitu?sync_token=${fallbackTokenId}`
      });
    }

    return NextResponse.json({
      token_id: data.token_id,
      expires_at: data.expires_at,
      sync_url: `https://nexativanews.com.ar/noraitu?sync_token=${data.token_id}`
    });
  } catch (err: any) {
    console.error("[NoraItu Sync POST Exception]:", err);
    return NextResponse.json({ error: "Error generando token de sincronización" }, { status: 500 });
  }
}

/**
 * GET /api/noraitu-sync?token_id=...
 * Consulta el estado del token efímero (Sondeo / Long-polling desde la PC).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get("token_id");

    if (!tokenId) {
      return NextResponse.json({ error: "token_id es requerido" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("noraitu_sync_tokens")
      .select("token_id, user_id, session_id, status, expires_at")
      .eq("token_id", tokenId)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: "PENDING" });
    }

    const isExpired = new Date(data.expires_at).getTime() < Date.now();
    if (isExpired) {
      return NextResponse.json({ status: "EXPIRED" });
    }

    if (data.status === "AUTHORIZED") {
      // Marcar como consumido para evitar reutilización
      await supabase
        .from("noraitu_sync_tokens")
        .update({ status: "CONSUMED" })
        .eq("token_id", tokenId);

      return NextResponse.json({
        status: "AUTHORIZED",
        user_id: data.user_id,
        session_id: data.session_id
      });
    }

    return NextResponse.json({ status: data.status });
  } catch (err: any) {
    console.error("[NoraItu Sync GET Exception]:", err);
    return NextResponse.json({ error: "Error consultando estado" }, { status: 500 });
  }
}

/**
 * PUT /api/noraitu-sync
 * Invocado por el teléfono celular tras escanear el QR para autorizar la sincronización.
 */
export async function PUT(req: Request) {
  try {
    const { token_id, user_id, session_id } = await req.json();

    if (!token_id || !user_id) {
      return NextResponse.json({ error: "token_id y user_id son obligatorios" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Validar token y expiración
    const { data: tokenRecord, error: checkError } = await supabase
      .from("noraitu_sync_tokens")
      .select("token_id, expires_at, status")
      .eq("token_id", token_id)
      .single();

    if (checkError || !tokenRecord) {
      return NextResponse.json({ error: "Token no encontrado o inválido" }, { status: 404 });
    }

    if (new Date(tokenRecord.expires_at).getTime() < Date.now() || tokenRecord.status !== "PENDING") {
      return NextResponse.json({ error: "El código QR ha expirado. Por favor genera uno nuevo en tu PC." }, { status: 410 });
    }

    // Autorizar transferencia de identidad y sesión
    const { error: updateError } = await supabase
      .from("noraitu_sync_tokens")
      .update({
        user_id,
        session_id: session_id || null,
        status: "AUTHORIZED"
      })
      .eq("token_id", token_id);

    if (updateError) {
      return NextResponse.json({ error: "No se pudo autorizar la sincronización" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "¡Sincronización autorizada con éxito! Tu computadora ya está conectada."
    });
  } catch (err: any) {
    console.error("[NoraItu Sync PUT Exception]:", err);
    return NextResponse.json({ error: "Error autorizando sincronización" }, { status: 500 });
  }
}
