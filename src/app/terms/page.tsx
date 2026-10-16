import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — One Store",
  description:
    "Legal terms and commercial conditions governing orders, guarantees, returns, and digital services across India and the United Kingdom.",
  alternates: {
    canonical: "https://one-store-gray.vercel.app/terms",
  },
  openGraph: {
    title: "Terms & Conditions — One Store",
    description: "Terms of service and digital sales agreements for One Store.",
    url: "https://one-store-gray.vercel.app/terms",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="border-b border-[#243447] pb-6 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              Legal Agreement
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3]">
              Terms governing the purchase of goods and use of the One Store digital platform.
            </p>
          </div>

          <div className="prose prose-invert max-w-none text-xs md:text-sm text-[#9CAFC3] space-y-6 leading-relaxed">
            <h2 className="text-lg font-bold text-[#FFFFFF]">1. Agreement to Terms</h2>
            <p>
              By accessing or using One Store, creating an account, or placing an order, you agree to
              be bound by these Terms and Conditions and our Privacy Policy.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">2. Dual Market Pricing &amp; Currency</h2>
            <p>
              Prices displayed in Indian Rupees (INR ₹) apply to domestic deliveries in India. Prices
              displayed in British Pounds (GBP £) apply to domestic deliveries in the United Kingdom.
              One Store reserves the right to adjust catalogue pricing to reflect changes in
              manufacturing, supplier costs, or currency fluctuations prior to order confirmation.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">3. Order Acceptance &amp; Inventory</h2>
            <p>
              Receipt of an order confirmation does not signify our final acceptance of your order.
              One Store reserves the right at any time after receipt of your order to accept or
              decline your order for reasonable operational causes, including inventory stockouts or
              suspected fraudulent transactions.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">4. Governing Law</h2>
            <p>
              For transactions in India, these terms are governed by the laws of India. For
              transactions in the United Kingdom, these terms are governed by the laws of England and
              Wales.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
