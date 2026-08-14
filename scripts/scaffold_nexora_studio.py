"""
scripts/scaffold_nexora_studio.py
Generador de la estructura y archivos del microservicio independiente Nexora Video Studio.
"""
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

STUDIO_DIR = r"D:\Proyectos\nexora-video-studio"

FILES = {
    "package.json": """{
  "name": "nexora-video-studio",
  "version": "1.0.0",
  "description": "Microservicio autónomo de producción y renderizado de video publicitario Faux-CGI con Remotion y FFmpeg para Nexativa",
  "main": "dist/api/server.js",
  "scripts": {
    "dev": "tsx watch src/api/server.ts",
    "remotion:preview": "remotion preview src/engines/remotion/Root.tsx",
    "build": "tsc",
    "start": "node dist/api/server.js"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@fastify/static": "^8.0.3",
    "@remotion/bundler": "^4.0.220",
    "@remotion/cli": "^4.0.220",
    "@remotion/renderer": "^4.0.220",
    "dotenv": "^16.4.7",
    "fastify": "^5.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "remotion": "^4.0.220",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
""",

    "tsconfig.json": """{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist"
  },
  "include": ["src/**/*", "remotion.config.ts"]
}
""",

    "remotion.config.ts": """import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
""",

    "src/engines/remotion/Root.tsx": """import React from "react";
import { Composition, registerRoot } from "remotion";
import { CommercialSpot, commercialSpotSchema } from "./compositions/CommercialSpot";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Spot Publicitario Vertical para Reels / TikTok / Shorts (9:16) - 30 Segundos */}
      <Composition
        id="CommercialSpotVertical"
        component={CommercialSpot}
        durationInFrames={900} // 30 segundos a 30 FPS
        fps={30}
        width={1080}
        height={1920}
        schema={commercialSpotSchema}
        defaultProps={{
          imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1080&q=80",
          title: "EXPERIENCIA EXCLUSIVA",
          subtitle: "Cabañas de Lujo frente al Río en Ituzaingó",
          brandName: "Cabañas del Paraná",
          accentColor: "#ec4899",
          ctaText: "¡Reservá tu estadía por WhatsApp!",
          durationInSeconds: 30,
        }}
      />

      {/* Spot Publicitario Horizontal para TV / YouTube / Banners (16:9) - 30 Segundos */}
      <Composition
        id="CommercialSpotHorizontal"
        component={CommercialSpot}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        schema={commercialSpotSchema}
        defaultProps={{
          imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
          title: "EXPERIENCIA EXCLUSIVA",
          subtitle: "Cabañas de Lujo frente al Río en Ituzaingó",
          brandName: "Cabañas del Paraná",
          accentColor: "#ec4899",
          ctaText: "¡Reservá tu estadía por WhatsApp!",
          durationInSeconds: 30,
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
""",

    "src/engines/remotion/compositions/CommercialSpot.tsx": """import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Audio,
} from "remotion";
import { z } from "zod";

export const commercialSpotSchema = z.object({
  imageUrl: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  brandName: z.string().optional(),
  clientLogoUrl: z.string().optional(),
  accentColor: z.string().default("#ec4899"),
  ctaText: z.string().optional(),
  voiceoverUrl: z.string().optional(),
  musicUrl: z.string().optional(),
});

export type CommercialSpotProps = z.infer<typeof commercialSpotSchema>;

export const CommercialSpot: React.FC<CommercialSpotProps> = ({
  imageUrl,
  title,
  subtitle,
  brandName,
  clientLogoUrl,
  accentColor = "#ec4899",
  ctaText = "¡Contáctanos!",
  voiceoverUrl,
  musicUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Movimiento de Cámara 3D (Zoom Ken Burns y Paneo suave)
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.18], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, durationInFrames], [0, -30], {
    extrapolateRight: "clamp",
  });

  // Animación del Título Principal con rebote elástico (Spring)
  const titleEntrance = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const titleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animación del Call to Action (Aparece en el segundo 3)
  const ctaEntrance = spring({
    frame: frame - 90,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Audio Ducking: La música de fondo baja cuando suena la locución y sube al final
  const musicVolume = interpolate(
    frame,
    [0, 15, durationInFrames - 45, durationInFrames],
    [0.4, 0.18, 0.22, 0.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", overflow: "hidden", fontFamily: "sans-serif" }}>
      {/* Pista de Locución Comercial en Español */}
      {voiceoverUrl && <Audio src={voiceoverUrl} volume={1.0} startFrom={10} />}

      {/* Pista de Música Comercial de Fondo */}
      {musicUrl && <Audio src={musicUrl} volume={musicVolume} />}

      {/* 1. Imagen de Fondo Faux-CGI con Animación de Cámara */}
      <AbsoluteFill style={{ transform: `scale(${scale}) translateY(${translateY}px)` }}>
        <Img
          src={imageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* 2. Capa de atmósfera cinematográfica (Vignette & Color Grading) */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, ${accentColor}25, transparent 65%)`,
        }}
      />

      {/* 3. Header de Marca / Logo en la esquina superior */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 60,
          display: "flex",
          alignItems: "center",
          gap: 16,
          backgroundColor: "rgba(0,0,0,0.75)",
          padding: "12px 24px",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        {clientLogoUrl && (
          <Img src={clientLogoUrl} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }} />
        )}
        <span style={{ color: "#ffffff", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>
          {brandName || "NEXATIVA PUBLICIDAD"}
        </span>
      </div>

      {/* 4. Textos Publicitarios Animados (Centro / Abajo) */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Título Principal */}
        <div
          style={{
            transform: `scale(${Math.max(0, titleEntrance)})`,
            opacity: titleOpacity,
          }}
        >
          <span
            style={{
              backgroundColor: accentColor,
              color: "#000000",
              fontSize: 22,
              fontWeight: 900,
              textTransform: "uppercase",
              padding: "6px 16px",
              borderRadius: 8,
              letterSpacing: 1.5,
              display: "inline-block",
              marginBottom: 12,
            }}
          >
            🔥 SPOT EXCLUSIVO
          </span>
          <h1
            style={{
              color: "#ffffff",
              fontSize: width < height ? 56 : 48,
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
              textShadow: "0 8px 24px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                color: "#e2e8f0",
                fontSize: 28,
                fontWeight: 500,
                marginTop: 12,
                lineHeight: 1.3,
                textShadow: "0 4px 16px rgba(0,0,0,0.9)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Call To Action Botón (Aparece en frame 90) */}
        {ctaText && (
          <div
            style={{
              transform: `scale(${Math.max(0, ctaEntrance)}) translateY(${interpolate(ctaEntrance, [0, 1], [30, 0])}px)`,
              display: "flex",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <div
              style={{
                backgroundColor: "#22c55e",
                color: "#000000",
                fontSize: 28,
                fontWeight: 900,
                padding: "16px 36px",
                borderRadius: 100,
                boxShadow: "0 10px 30px rgba(34,197,94,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span>{ctaText}</span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
""",

    "src/engines/remotion/renderService.ts": """import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { CommercialSpotProps } from "./compositions/CommercialSpot";

let bundleCache: string | null = null;

export async function getOrCreateBundle(): Promise<string> {
  if (bundleCache && fs.existsSync(bundleCache)) {
    return bundleCache;
  }
  const rootEntry = path.join(__dirname, "Root.tsx");
  console.log("📦 Bundling Remotion Root:", rootEntry);
  bundleCache = await bundle({
    entryPoint: rootEntry,
    webpackOverride: (config) => config,
  });
  console.log("✅ Remotion Bundle listo:", bundleCache);
  return bundleCache;
}

export interface RenderOptions {
  compositionId?: "CommercialSpotVertical" | "CommercialSpotHorizontal";
  props: CommercialSpotProps;
  outputFileName?: string;
}

export async function renderCommercialVideo(options: RenderOptions): Promise<string> {
  const { compositionId = "CommercialSpotVertical", props, outputFileName } = options;
  const bundleLocation = await getOrCreateBundle();

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: props,
  });

  const outDir = path.join(process.cwd(), "public", "rendered");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const finalName = outputFileName || `spot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp4`;
  const outputPath = path.join(outDir, finalName);

  console.log(`🎬 Iniciando renderizado de ${compositionId} con Audio AAC -> ${outputPath}...`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    audioCodec: "aac",
    audioBitrate: "320k",
    outputLocation: outputPath,
    inputProps: props,
    onProgress: ({ progress }) => {
      console.log(`[Remotion Render Progress] ${(progress * 100).toFixed(1)}%`);
    },
  });

  console.log(`✅ Video renderizado con éxito con audio en: ${outputPath}`);
  return outputPath;
}
""",

    "src/api/server.ts": """import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import { renderCommercialVideo } from "../engines/remotion/renderService";

const fastify = Fastify({
  logger: true,
});

async function main() {
  await fastify.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  });

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  await fastify.register(fastifyStatic, {
    root: publicDir,
    prefix: "/public/",
  });

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", service: "Nexora Video Studio", time: new Date().toISOString() };
  });

  // Endpoint de Renderizado de Spots Publicitarios
  fastify.post("/api/v1/render-spot", async (request, reply) => {
    try {
      const body = request.body as any;
      const {
        imageUrl,
        title,
        subtitle,
        brandName,
        clientLogoUrl,
        accentColor = "#ec4899",
        ctaText = "¡Contáctanos por WhatsApp!",
        format = "vertical", // "vertical" (9:16) o "horizontal" (16:9)
      } = body;

      // Generar locución comercial automática en Base64 para carga instantánea
      let voiceoverUrl = "";
      const textToSpeak = subtitle || title;
      if (textToSpeak) {
        const audioDir = path.join(publicDir, "audio");
        if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
        
        const audioFileName = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.mp3`;
        const audioFilePath = path.join(audioDir, audioFileName);

        try {
          const { execSync } = require("child_process");
          const safeText = textToSpeak.replace(/"/g, "'").substring(0, 150);
          execSync(`edge-tts --text "${safeText}" --voice es-AR-TomasNeural --write-media "${audioFilePath}"`, { timeout: 15000 });
          
          if (fs.existsSync(audioFilePath)) {
            const audioBase64 = fs.readFileSync(audioFilePath).toString("base64");
            voiceoverUrl = `data:audio/mp3;base64,${audioBase64}`;
            console.log("🎙️ Locución convertida a Data URL Base64 para Chromium...");
          }
        } catch (ttsErr) {
          console.warn("[TTS] Aviso: No se pudo generar la pista de voz:", ttsErr);
        }
      }

      const compositionId = format === "horizontal" ? "CommercialSpotHorizontal" : "CommercialSpotVertical";

      const outputPath = await renderCommercialVideo({
        compositionId,
        props: {
          imageUrl,
          title,
          subtitle: subtitle || "",
          brandName: brandName || "Nexativa Spot",
          clientLogoUrl: clientLogoUrl || "",
          accentColor,
          ctaText,
          voiceoverUrl: voiceoverUrl || undefined,
        },
      });

      const fileName = path.basename(outputPath);
      const host = request.headers.host || "localhost:4000";
      const protocol = request.protocol || "http";
      const videoUrl = `${protocol}://${host}/public/rendered/${fileName}`;

      return {
        success: true,
        videoUrl,
        fileName,
        format,
        compositionId,
        hasVoiceover: Boolean(voiceoverUrl),
        message: "¡Spot publicitario renderizado con éxito en MP4 1080p con audio AAC!",
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || "Error al renderizar video comercial." });
    }
  });

  const PORT = Number(process.env.PORT) || 4000;
  const HOST = "0.0.0.0";

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Nexora Video Studio corriendo en http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
""",

    "Dockerfile": """FROM node:20-bookworm-slim

# Instalar Chromium y dependencias de FFmpeg para Remotion
RUN apt-get update && apt-get install -y \\
    chromium \\
    ffmpeg \\
    fonts-liberation \\
    libasound2 \\
    libnss3 \\
    libxss1 \\
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
"""
}

def scaffold():
    print(f"🚀 Creando archivos en {STUDIO_DIR}...")
    for rel_path, content in FILES.items():
        full_path = os.path.join(STUDIO_DIR, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ Creado: {rel_path}")

    print("\n🎉 ¡Estructura de Nexora Video Studio creada con éxito!")

if __name__ == "__main__":
    scaffold()
