import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "One Store — Curated Commerce for India & the UK",
  description:
    "Custom-engineered dropshipping e-commerce platform serving customers across India (INR) and the United Kingdom (GBP).",
};

import { MarketProvider } from "@/lib/context/MarketContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#080B10] text-[#F4F8FC] selection:bg-[#7DD3FC] selection:text-[#080B10]">
        <MarketProvider>{children}</MarketProvider>
      </body>
    </html>
  );
}
