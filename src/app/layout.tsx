import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = "https://one-store-gray.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "One Store — Curated Commerce for India & the UK",
    template: "%s | One Store",
  },
  description:
    "Curated studio acoustics, engineered minimalist carry, and precision chronographs. Dual-market checkout in INR (₹) and GBP (£) with fully insured express delivery.",
  keywords: [
    "One Store",
    "curated commerce",
    "studio audio",
    "minimalist carry",
    "precision timepieces",
    "desk studio gear",
    "wireless headphones UK",
    "dropshipping India",
    "UK dropshipping",
    "luxury everyday carry",
  ],
  authors: [{ name: "One Store Curated Commerce" }],
  creator: "One Store",
  publisher: "One Store",
  alternates: {
    canonical: baseUrl,
    languages: {
      "en-IN": `${baseUrl}/?country=IN`,
      "en-GB": `${baseUrl}/?country=UK`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_IN", "en_GB"],
    url: baseUrl,
    siteName: "One Store",
    title: "One Store — Curated Commerce for India & the UK",
    description:
      "Curated studio acoustics, engineered minimalist carry, and precision chronographs. Seamless dual-market checkout in INR (₹) and GBP (£).",
    images: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "One Store — Curated Commerce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "One Store — Curated Commerce for India & the UK",
    description:
      "Studio audio, minimalist carry, and precision chronographs curated for India and the UK.",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&q=80"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicons/home.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
};

const rootStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "One Store",
      url: baseUrl,
      logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&q=80",
      contactPoint: {
        "@type": "ContactPoint",
        email: "onestore.auth@gmail.com",
        contactType: "Customer Support",
        availableLanguage: ["English", "Hindi"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "One Store",
      publisher: { "@id": `${baseUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "OnlineStore",
      "@id": `${baseUrl}/#store`,
      name: "One Store Curated Commerce",
      url: baseUrl,
      currenciesAccepted: "INR, GBP",
      paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking, Apple Pay, Klarna",
      priceRange: "₹999 - ₹24,999 / £9.99 - £199.99",
      parentOrganization: { "@id": `${baseUrl}/#organization` },
    },
  ],
};

import { MarketProvider } from "@/lib/context/MarketContext";
import { CartProvider } from "@/lib/context/CartContext";
import { WishlistProvider } from "@/lib/context/WishlistContext";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { WelcomeScreen } from "@/components/storefront/WelcomeScreen";
import { DynamicFaviconManager } from "@/components/layout/DynamicFaviconManager";
import { AIAssistantWidget } from "@/components/ai/AIAssistantWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#080B10] text-[#F4F8FC] selection:bg-[#7DD3FC] selection:text-[#080B10]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootStructuredData) }}
        />
        <GoogleAnalytics />
        <DynamicFaviconManager />
        <MarketProvider>
          <CartProvider>
            <WishlistProvider>
              <WelcomeScreen />
              {children}
              <AIAssistantWidget />
            </WishlistProvider>
          </CartProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
