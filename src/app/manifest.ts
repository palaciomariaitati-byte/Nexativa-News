import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NoraItu AI - Asistente Autónomo',
    short_name: 'NoraItu',
    description: 'Inteligencia Artificial Libre, Analítica y Multidispositivo a Costo $0.',
    start_url: '/noraitu',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/main-icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/main-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  };
}
