/**
 * src/lib/nexora/videoClient.ts
 * SDK Conector oficial entre Nexativa News y el microservicio independiente Nexora Video Studio.
 */

export interface RenderSpotParams {
  imageUrl: string;
  title: string;
  subtitle?: string;
  brandName?: string;
  clientLogoUrl?: string;
  accentColor?: string;
  ctaText?: string;
  format?: "vertical" | "horizontal";
}

export interface RenderSpotResult {
  success: boolean;
  videoUrl?: string;
  fileName?: string;
  format?: string;
  error?: string;
}

export class NexoraVideoClient {
  private baseUrl: string;

  constructor(customUrl?: string) {
    this.baseUrl = customUrl || process.env.NEXORA_STUDIO_URL || "http://localhost:4000";
  }

  /**
   * Solicita el renderizado de un Spot Publicitario Faux-CGI en MP4 1080p
   */
  async renderSpot(params: RenderSpotParams): Promise<RenderSpotResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/render-spot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(120000), // 2 minutos máx
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error en Nexora Studio: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        videoUrl: data.videoUrl,
        fileName: data.fileName,
        format: data.format,
      };
    } catch (err: any) {
      console.warn("[NexoraVideoClient] No se pudo conectar con el microservicio de renderizado:", err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Health check del microservicio
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      return data.status === "ok";
    } catch {
      return false;
    }
  }
}

export const nexoraVideoClient = new NexoraVideoClient();
