import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      property_id, 
      new_status, 
      action, 
      available_from, 
      available_to, 
      price_per_night,
      penalty_reason = "" 
    } = body;

    if (!property_id) {
      return NextResponse.json({ success: false, error: "ID de propiedad requerido." }, { status: 400 });
    }

    // ACCIÓN: ELIMINAR PROPIEDAD
    if (new_status === "DELETE" || action === "DELETE") {
      const { error: delError } = await supabaseAdmin
        .from("properties_for_rent")
        .delete()
        .eq("id", property_id);

      if (delError) {
        console.error("Error al eliminar propiedad en Supabase:", delError);
        return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Propiedad eliminada de la base de datos correctamente.",
        deleted_id: property_id,
      });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (new_status) {
      let dbStatus = "ACTIVE";
      if (new_status === "BAN_PERMANENT") {
        dbStatus = "BAN_PERMANENT";
        updateData.penalty_count = 1;
        updateData.fine_amount_ars = 50000.00;
      } else if (new_status === "SUSPENDED_NEGLIGENT") {
        dbStatus = "SUSPENDED_NEGLIGENT";
        updateData.penalty_count = 1;
        updateData.fine_amount_ars = 50000.00;
      } else if (
        new_status === "PAUSED" ||
        new_status === "OCUPADO" ||
        new_status === "EN_REPARACION" ||
        new_status === "EN_PREPARACION"
      ) {
        dbStatus = "PAUSED";
      } else {
        dbStatus = "ACTIVE";
      }

      updateData.status = dbStatus;
    }

    if (available_from) updateData.available_from = available_from;
    if (available_to) updateData.available_to = available_to;
    if (price_per_night) updateData.price_per_night = Number(price_per_night);

    const { data, error } = await supabaseAdmin
      .from("properties_for_rent")
      .update(updateData)
      .eq("id", property_id)
      .select()
      .single();

    if (error) {
      console.warn("Error actualizando propiedad en Supabase:", error.message);
      return NextResponse.json({
        success: false,
        error: `Error al actualizar en base de datos: ${error.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Propiedad actualizada correctamente.",
      property: data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("id") || searchParams.get("property_id");

    if (!property_id) {
      return NextResponse.json({ success: false, error: "ID de propiedad requerido para eliminar." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("properties_for_rent")
      .delete()
      .eq("id", property_id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Inmueble eliminado con éxito." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
