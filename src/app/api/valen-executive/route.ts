import { NextResponse } from "next/server";
import { 
  chatWithValen, 
  fetchValenMemory, 
  trainValenMemory, 
  fetchValenKPIs, 
  fetchLatestMetrics, 
  saveValenGlobalLead 
} from "@/modules/agents/valen_growth_agent";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const memory = await fetchValenMemory();
    const metrics = await fetchLatestMetrics();
    const kpis = await fetchValenKPIs();

    const supabase = createServerSupabaseClient();
    const { data: leads } = await supabase
      .from("valen_global_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      memory,
      metrics,
      kpis,
      leads: leads || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, message, history, operatorName, memoryData, leadData } = body;

    if (action === "train") {
      if (!memoryData?.key || !memoryData?.content) {
        return NextResponse.json({ error: "Faltan datos de memoria (key, content)." }, { status: 400 });
      }
      const ok = await trainValenMemory(memoryData.key, memoryData.category || "brand_guidelines", memoryData.content);
      const kpis = await fetchValenKPIs();
      return NextResponse.json({ success: ok, kpis, message: ok ? "Concepto aprendido por VALEN." : "Error al guardar memoria." });
    }

    if (action === "lead") {
      if (!leadData?.target_name) {
        return NextResponse.json({ error: "El nombre de la empresa/contacto es obligatorio." }, { status: 400 });
      }
      const newLead = await saveValenGlobalLead(leadData);
      const kpis = await fetchValenKPIs();
      return NextResponse.json({ success: !!newLead, lead: newLead, kpis });
    }

    if (action === "kpis") {
      const kpis = await fetchValenKPIs();
      return NextResponse.json({ success: true, kpis });
    }

    // Default chat or status report action
    const promptMessage = action === "report" 
      ? "Genera tu informe de estatus ejecutivo A-B-C actualizado para hoy por favor." 
      : (message || "Hola VALEN, preséntate brevemente y dime qué oportunidades de expansión tenemos hoy.");

    const response = await chatWithValen(promptMessage, history, operatorName || "Socio Fundador");
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error en valen-executive route:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
