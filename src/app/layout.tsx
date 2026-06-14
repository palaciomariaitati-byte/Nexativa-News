/*
 * Intellectual Property Rule:
 * All code, designs, assets, and algorithms in this project must be original or
 * fully open-source. It is strictly prohibited to use patented designs, commercial
 * trademarks, registered logos, or closed-source algorithms.
 */

import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ExternalNewsCarousel from "@/components/ExternalNewsCarousel";
import FloatingShortcuts from "@/components/FloatingShortcuts";
import MobileBottomNav from "@/components/Navbar/MobileBottomNav";
import GlobalRealtimeListener from "@/components/GlobalRealtimeListener";
import Providers from "@/components/Providers";
import CartButton from "@/components/CartButton";
import NoraAgent from "@/components/Nora/NoraAgent";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0B0F19",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nexativanews.com.ar"),
  title: {
    default: "Nexativa - Lo nuestro para el mundo",
    template: "%s | Nexativa",
  },
  description: "Portal de noticias, Marketplace PyME, Turismo y Espacio Cultural Regional.",
  keywords: ["noticias", "marketplace", "turismo", "cultura", "regional", "nexativa"],
  authors: [{ name: "Nexativa" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://www.nexativanews.com.ar",
    siteName: "Nexativa",
    title: "Nexativa - Lo nuestro para el mundo",
    description: "Portal de noticias, Marketplace PyME, Turismo y Espacio Cultural Regional.",
    images: [
      {
        url: "/banner-nexativa.jpg",
        width: 1200,
        height: 630,
        alt: "Nexativa Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexativa - Lo nuestro para el mundo",
    description: "Portal de noticias, Marketplace PyME, Turismo y Espacio Cultural Regional.",
    images: ["/banner-nexativa.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/main-icon.png",
    apple: "/icons/main-icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexativa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans text-gray-200 text-lg">
        <Providers>
          <GlobalRealtimeListener />
          <Navbar />
          <ExternalNewsCarousel />
          <main className="flex-grow pb-16 sm:pb-0">{children}</main>
          <Footer />
          <FloatingShortcuts />
          <MobileBottomNav />
          <CartButton />
          <NoraAgent />
        </Providers>
      </body>
    </html>
  );
}
