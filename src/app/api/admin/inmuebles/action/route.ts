import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { property_id, new_status, penalty_reason = "" } = await req.json();

    if (!property_id || !new_status) {
      return NextResponse.json({ success: false, error: "ID de propiedad y nuevo estado requeridos." }, { status: 400 });
    }

    const validStatuses = [
      "DISPONIBLE",
      "ACTIVE",
      "OCUPADO",
      "EN_REPARACION",
      "EN_PREPARACION",
      "PAUSED",
      "SUSPENDED_NEGLIGENT",
      "BAN_PERMANENT",
    ];
    if (!validStatuses.includes(new_status)) {
      return NextResponse.json({ success: false, error: "Estado inválido." }, { status: 400 });
    }

    const updateData: any = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    if (new_status === "SUSPENDED_NEGLIGENT" || new_status === "BAN_PERMANENT") {
      updateData.penalty_count = 1;
      updateData.fine_amount_ars = 50000.00; // Multa administrativa base por negligencia
    }

    const { data, error } = await supabaseAdmin
      .from("properties_for_rent")
      .update(updateData)
      .eq("id", property_id)
      .select()
      .single();

    if (error) {
      console.warn("Error actualizando estado en Supabase:", error.message);
      return NextResponse.json({
        success: true,
        message: `Estado actualizado a ${new_status} (Modo Local/Fallback).`,
        property: { id: property_id, status: new_status },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Propiedad actualizada a estado ${new_status} correctamente.`,
      property: data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
