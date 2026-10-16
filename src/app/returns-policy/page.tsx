import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RotateCcw, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "14-Day Returns & Refund Policy — One Store",
  description:
    "Risk-free shopping with 14-day hassle-free returns across India and the United Kingdom. Simple prepaid returns and 1-year product warranty.",
  alternates: {
    canonical: "https://one-store-gray.vercel.app/returns-policy",
  },
  openGraph: {
    title: "14-Day Returns & Refund Policy — One Store",
    description: "Hassle-free return guarantees in India and the UK.",
    url: "https://one-store-gray.vercel.app/returns-policy",
    type: "website",
  },
};

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="border-b border-[#243447] pb-6 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              Customer Guarantee
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              Returns &amp; Refunds Policy
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3]">
              14-day hassle-free returns across all orders in India and the United Kingdom.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#FFFFFF]">14-Day Return Window</h2>
              <p className="text-xs text-[#9CAFC3] leading-relaxed">
                If you are not completely satisfied with your purchase, you may initiate a return
                within 14 calendar days of confirmed delivery for a full refund to your original
                payment method.
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs md:text-sm text-[#9CAFC3] space-y-6 leading-relaxed">
            <h2 className="text-lg font-bold text-[#FFFFFF]">Eligibility Requirements</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Item must be in original, unblemished condition with all packaging and accessories.</li>
              <li>Serial numbers, tags, and authenticity seals must remain intact.</li>
              <li>Proof of purchase with your One Store order number (e.g. OS-2026-...) is required.</li>
            </ul>

            <h2 className="text-lg font-bold text-[#FFFFFF]">How to Request a Return</h2>
            <p>
              Navigate to your{" "}
              <Link href="/orders" className="text-[#7DD3FC] underline">
                Order History
              </Link>{" "}
              page and click <strong>Request Return</strong> next to the applicable order. Our
              support team will provide a pre-paid return shipping label within 24 hours.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">Refund Processing Times</h2>
            <p>
              Once your returned item is received and inspected at our regional hub, your refund will
              be credited back via Razorpay (India: 3-5 banking days) or Stripe (UK: 2-4 business
              days).
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
