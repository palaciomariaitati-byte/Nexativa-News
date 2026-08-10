import { NextResponse } from "next/server";
import { runValenRealEstateHunter } from "@/modules/agents/valen_realestate_hunter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { region = "Ituzaingó, Corrientes" } = body;

    const result = await runValenRealEstateHunter(region);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Error al ejecutar el escáner de VALEN." },
      { status: 500 }
    );
  }
}
