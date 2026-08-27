import { NextResponse } from "next/server";
import { executeSovereignText } from "@/lib/nora/sovereignCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { title, category, condition, price, currency, notes } = await req.json();

    const systemPrompt = `Sos Nora, la asistente inteligente de Clasificados Nexativa.
Tu tarea es redactar una descripción de venta clara, atractiva, profesional y vendedora para un artículo de segunda mano o vehículo.
Instrucciones:
1. Usá tono amigable, claro y honesto (estilo compra-venta regional de Corrientes/Misiones).
2. Estructurá la respuesta en 3 bloques cortos:
   - Resumen del estado general.
   - Puntos destacados / especificaciones.
   - Llamado a la acción para consultar por WhatsApp.
3. No uses precios falsos ni inventes datos que no se mencionen.
4. Respondé SOLO con el texto de la descripción final, sin saludos ni preámbulos.`;

    const userPrompt = `Por favor genera la descripción para publicar este clasificado:
- Título: ${title || "Artículo en venta"}
- Categoría: ${category || "General"}
- Estado: ${condition || "Buen estado"}
- Precio: ${price ? `${currency || "ARS"} ${price}` : "A convenir"}
- Detalles/Notas del vendedor: ${notes || "Sin detalles adicionales"}`;

    const res = await executeSovereignText({
      history: [],
      userMessage: userPrompt,
      systemPrompt,
      temperature: 0.4,
      maxTokens: 350
    });

    return NextResponse.json({ description: res.text.trim() });
  } catch (err: any) {
    console.warn("[Nora Clasificados Assist Error]:", err);
    return NextResponse.json({
      description: "Excelente oportunidad. Artículo en muy buen estado y listo para su uso. Consultar para coordinar entrega o visita."
    });
  }
}
