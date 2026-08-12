import { SchemaType } from "@google/generative-ai";

export interface VideoCampaignDirective {
  base_scene_prompt: string;
  surreal_intervention: string;
  camera_movement: string;
  target_model: 'wan-2.1' | 'hunyuan-video' | 'cogvideo';
}

export const NoraUnifiedResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: { 
      type: SchemaType.STRING, 
      description: "Respuesta conversacional empática, humana, usando el estilo impecable de un recepcionista de hotel 5 estrellas." 
    },
    freeze: { 
      type: SchemaType.BOOLEAN, 
      description: "True si el usuario plantea un reclamo legal formal, una amenaza o una queja grave que requiera atención humana." 
    },
    report: {
      type: SchemaType.OBJECT,
      nullable: true,
      description: "Campos extraídos automáticamente si el usuario demuestra intenciones comerciales claras (leads).",
      properties: {
        rubro_cliente: { type: SchemaType.STRING },
        whatsapp_comercial: { type: SchemaType.STRING },
        producto_interes: { type: SchemaType.STRING }
      }
    },
    video_campaign_directive: {
      type: SchemaType.OBJECT,
      nullable: true,
      description: "Parámetros técnicos en inglés para generación de video Faux-CGI de surrealismo monumental.",
      properties: {
        base_scene_prompt: { type: SchemaType.STRING, description: "Descripción naturalista de la escena base en inglés." },
        surreal_intervention: { type: SchemaType.STRING, description: "Efecto surrealista gigante (25-30m) en inglés." },
        camera_movement: { type: SchemaType.STRING, description: "Movimiento de cámara cinematográfico." },
        target_model: { type: SchemaType.STRING, description: "Motor open-source óptimo: wan-2.1 | hunyuan-video." }
      }
    }
  },
  required: ["reply", "freeze"]
};
