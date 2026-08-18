import { NextResponse } from "next/server";
import * as math from "mathjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ========================================================================
 * 🧮 MOTOR DE CÁLCULO CIENTÍFICO Y ÁLGEBRA EXACTA (FASE 11)
 * Ubicación: /src/app/api/noraitu-math/route.ts
 * 
 * Resuelve expresiones analíticas, derivadas simbólicas, matrices y raíces
 * con precisión matemática determinística a Costo $0 sin alucinaciones de LLM.
 * ========================================================================
 */

interface MathRequestPayload {
  action: "evaluate" | "derivative" | "roots_and_extremes" | "matrix" | "simplify";
  expression: string;
  variable?: string;
  matrixA?: number[][];
  matrixB?: number[][];
  matrixOperation?: "det" | "inv" | "multiply" | "transpose" | "add";
}

export async function POST(req: Request) {
  try {
    const body: MathRequestPayload = await req.json();
    const { action = "evaluate", expression, variable = "x", matrixA, matrixB, matrixOperation = "det" } = body;

    // 1. EVALUACIÓN DIRECTA DE EXPRESIONES
    if (action === "evaluate") {
      if (!expression || typeof expression !== "string") {
        return NextResponse.json({ success: false, error: "Expresión matemática requerida." }, { status: 400 });
      }

      // Sanitizar expresión
      const cleanExpr = expression.trim().replace(/^[fgyh]\(x\)\s*=\s*/i, "");
      const compiled = math.compile(cleanExpr);
      const result = compiled.evaluate();

      return NextResponse.json({
        success: true,
        action: "evaluate",
        expression: cleanExpr,
        result: typeof result === "object" ? JSON.stringify(result) : String(result),
        formattedResult: `Resultado exacto: **${result}**`
      });
    }

    // 2. DERIVADA SIMBÓLICA EXACTA
    if (action === "derivative") {
      if (!expression) {
        return NextResponse.json({ success: false, error: "Expresión requerida para derivar." }, { status: 400 });
      }

      const cleanExpr = expression.trim().replace(/^[fgyh]\(x\)\s*=\s*/i, "");
      const derived = math.derivative(cleanExpr, variable);
      const simplified = math.simplify(derived);

      return NextResponse.json({
        success: true,
        action: "derivative",
        originalExpression: cleanExpr,
        variable,
        derivative: derived.toString(),
        simplifiedDerivative: simplified.toString(),
        formattedResult: `$$\\frac{d}{d${variable}}\\left(${cleanExpr}\\right) = ${simplified.toString()}$$`
      });
    }

    // 3. SIMPLIFICACIÓN ALGEBRAICA
    if (action === "simplify") {
      if (!expression) {
        return NextResponse.json({ success: false, error: "Expresión requerida para simplificar." }, { status: 400 });
      }

      const cleanExpr = expression.trim();
      const simplified = math.simplify(cleanExpr);

      return NextResponse.json({
        success: true,
        action: "simplify",
        originalExpression: cleanExpr,
        simplified: simplified.toString(),
        formattedResult: `Expresión simplificada: **${simplified.toString()}**`
      });
    }

    // 4. ANÁLISIS DE RAÍCES, VÉRTICES Y CORTES (POLINOMIOS / FUNCIONES COMUNES)
    if (action === "roots_and_extremes") {
      if (!expression) {
        return NextResponse.json({ success: false, error: "Función requerida para análisis." }, { status: 400 });
      }

      const cleanExpr = expression.trim().replace(/^[fgyh]\(x\)\s*=\s*/i, "");
      const compiled = math.compile(cleanExpr);
      
      // Corte con Eje Y (x = 0)
      let yIntercept: number | null = null;
      try {
        const valAtZero = compiled.evaluate({ x: 0 });
        if (typeof valAtZero === "number" && !isNaN(valAtZero) && isFinite(valAtZero)) {
          yIntercept = Number(valAtZero.toFixed(4));
        }
      } catch {}

      // Derivada primera para puntos críticos
      let criticalPoints: { x: number; y: number; type: "mínimo" | "máximo" | "inflexión" }[] = [];
      try {
        const d1 = math.derivative(cleanExpr, "x");
        const d2 = math.derivative(d1, "x");
        
        // Muestreo numérico en [-50, 50] para hallar raíces de f'(x)
        const step = 0.05;
        for (let x = -50; x <= 50; x += step) {
          const y1 = d1.evaluate({ x });
          const y2 = d1.evaluate({ x: x + step });
          if (typeof y1 === "number" && typeof y2 === "number" && y1 * y2 <= 0) {
            const rootX = Number((x + step / 2).toFixed(4));
            const rootY = Number(compiled.evaluate({ x: rootX }).toFixed(4));
            const curvature = d2.evaluate({ x: rootX });
            const type = curvature > 0 ? "mínimo" : curvature < 0 ? "máximo" : "inflexión";
            
            if (!criticalPoints.some(p => Math.abs(p.x - rootX) < 0.1)) {
              criticalPoints.push({ x: rootX, y: rootY, type });
            }
          }
        }
      } catch {}

      return NextResponse.json({
        success: true,
        action: "roots_and_extremes",
        expression: cleanExpr,
        yIntercept: yIntercept !== null ? { x: 0, y: yIntercept } : null,
        criticalPoints,
        plotSyntax: `\`\`\`plot\nf(x) = ${cleanExpr}\n\`\`\``
      });
    }

    // 5. ÁLGEBRA LINEAL Y MATRICES
    if (action === "matrix") {
      if (!matrixA || !Array.isArray(matrixA)) {
        return NextResponse.json({ success: false, error: "Matriz A requerida en formato 2D." }, { status: 400 });
      }

      let matrixResult: any = null;
      if (matrixOperation === "det") {
        matrixResult = math.det(matrixA);
      } else if (matrixOperation === "inv") {
        matrixResult = math.inv(matrixA);
      } else if (matrixOperation === "transpose") {
        matrixResult = math.transpose(matrixA);
      } else if (matrixOperation === "multiply" && matrixB) {
        matrixResult = math.multiply(matrixA, matrixB);
      } else if (matrixOperation === "add" && matrixB) {
        matrixResult = math.add(matrixA, matrixB);
      }

      return NextResponse.json({
        success: true,
        action: "matrix",
        operation: matrixOperation,
        result: matrixResult
      });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida." }, { status: 400 });

  } catch (error: any) {
    console.error("[NoraItu Math Engine Error]:", error?.message);
    return NextResponse.json({
      success: false,
      error: `Error en el cálculo matemático: ${error?.message || "Sintaxis o expresión inválida."}`
    }, { status: 500 });
  }
}
