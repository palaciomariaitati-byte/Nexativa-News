/*
 * Intellectual Property Rule:
 * All code, designs, assets, and algorithms in this project must be original or
 * fully open-source. It is strictly prohibited to use patented designs, commercial
 * trademarks, registered logos, or closed-source algorithms.
 */

import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import ExternalNewsCarousel from "@/components/ExternalNewsCarousel";
import FloatingShortcuts from "@/components/FloatingShortcuts";

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

export const metadata: Metadata = {
  title: "Nexativa News",
  description: "Portal de noticias modernista",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
      <body className="min-h-full flex flex-col font-sans bg-[#0B0F19] text-gray-200 text-lg">
        <Navbar />
        <ExternalNewsCarousel />
        <main className="flex-grow">{children}</main>
        <Footer />
        <FloatingShortcuts />
        <WhatsAppWidget />
      </body>
    </html>
  );
}
