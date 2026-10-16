import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlertTriangle, Home, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The requested page could not be located in the One Store catalogue.",
  icons: {
    icon: "/favicons/error.svg",
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10] text-[#FFFFFF]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#102A43]/50 border border-[#243447] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="text-4xl font-black text-[#FFFFFF] tracking-tight">404</div>
            <h1 className="text-lg font-bold text-[#FFFFFF]">Page Not Found</h1>
            <p className="text-xs text-[#9CAFC3] leading-relaxed">
              The page or resource you are looking for does not exist or may have been relocated.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-md shadow-[#7DD3FC]/10 flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#7DD3FC] border border-[#243447] font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
