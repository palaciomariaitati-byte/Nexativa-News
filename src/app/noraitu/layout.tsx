import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NoraItu AI - Asistente Inteligente Universal de MyJNexoraVisual',
  description: 'NoraItu es una Inteligencia Artificial multimodal soberana desarrollada en Ituzaingó, Corrientes, por MyJNexoraVisual. Análisis de documentos, facturas, fotos, voz femenina y consultas en tiempo real.',
  manifest: '/noraitu-manifest.json',
  keywords: [
    'NoraItu',
    'NoraItu AI',
    'Nora Itu',
    'Inteligencia Artificial Ituzaingó',
    'MyJNexoraVisual',
    'IA Argentina',
    'Chatbot IA Corrientes',
    'Auditoría de facturas IA',
    'Asistente de voz multimodal'
  ],
  authors: [{ name: 'MyJNexoraVisual' }],
  creator: 'MyJNexoraVisual',
  publisher: 'MyJNexoraVisual',
  metadataBase: new URL('https://www.nexativanews.com.ar'),
  alternates: {
    canonical: '/noraitu',
  },
  icons: {
    icon: '/icons/main-icon.png',
    apple: '/icons/main-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NoraItu AI',
  },
  openGraph: {
    title: 'NoraItu AI - Inteligencia Artificial Multimodal Soberana',
    description: 'Asistente de IA multimodal desarrollado en Ituzaingó, Corrientes por MyJNexoraVisual. Visión, voz femenina, auditoría de documentos y más.',
    url: 'https://www.nexativanews.com.ar/noraitu',
    siteName: 'NoraItu AI',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/icons/main-icon.png',
        width: 512,
        height: 512,
        alt: 'NoraItu AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoraItu AI - MyJNexoraVisual',
    description: 'Inteligencia Artificial soberana desarrollada en Ituzaingó, Corrientes.',
    images: ['/icons/main-icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function NoraItuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <link rel="manifest" href="/noraitu-manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NoraItu AI" />
        <link rel="apple-touch-icon" href="/icons/main-icon.png" />
      </head>
      {children}
    </>
  );
}
