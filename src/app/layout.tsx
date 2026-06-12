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
  title: "Nexativa News",
  description: "Portal de noticias modernista",
  manifest: "/manifest.json",
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
        <GlobalRealtimeListener />
        <Navbar />
        <ExternalNewsCarousel />
        <main className="flex-grow pb-16 sm:pb-0">{children}</main>
        <Footer />
        <FloatingShortcuts />
        <MobileBottomNav />
      </body>
    </html>
  );
}
