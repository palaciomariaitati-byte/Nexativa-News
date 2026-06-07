/*
 * Intellectual Property Rule:
 * All code, designs, assets, and algorithms in this project must be original or
 * fully open-source. It is strictly prohibited to use patented designs, commercial
 * trademarks, registered logos, or closed-source algorithms.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar/Navbar";
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
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
              <WhatsAppWidget />
      </body>
    </html>
  );
}
