/*
 * Intellectual Property Rule:
 * All code, designs, assets, and algorithms in this project must be original or
 * fully open-source. It is strictly prohibited to use patented designs, commercial
 * trademarks, registered logos, or closed-source algorithms.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// import Navbar from "@/components/Navbar/Navbar"; // Removed in favor of custom premium nav
import Footer from "@/components/Footer/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexativa News",
  description: "Portal de noticias modernista",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Nexativa News</h1>
            <ul className="flex space-x-4">
              <li><a href="/" className="text-gray-700 hover:text-indigo-600 transition-colors">Inicio</a></li>
              <li><a href="/news" className="text-gray-700 hover:text-indigo-600 transition-colors">Noticias</a></li>
              <li><a href="/store" className="text-gray-700 hover:text-indigo-600 transition-colors">Tienda</a></li>
            </ul>
          </div>
        </nav>
        <main className="flex-grow">{children}</main>
        <Footer />
              <WhatsAppWidget />
      </body>
    </html>
  );
}
