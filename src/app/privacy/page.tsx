import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, Lock, Eye } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Protection (GDPR / DPDP) — One Store",
  description:
    "Learn how One Store protects customer data across India (DPDP Act) and the UK (UK-GDPR). Zero telemetry tracking without consent, bank-grade encrypted checkout.",
  alternates: {
    canonical: "https://one-store-gray.vercel.app/privacy",
  },
  openGraph: {
    title: "Privacy Policy — One Store",
    description: "Data security and privacy commitments for India and the UK.",
    url: "https://one-store-gray.vercel.app/privacy",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="border-b border-[#243447] pb-6 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              Data Protection &amp; GDPR / DPDP
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3]">
              How One Store collects, safeguards, and handles your personal identity and order data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <Lock className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-sm font-bold text-[#FFFFFF]">Zero Raw Card Storage</h3>
              <p className="text-xs text-[#9CAFC3]">
                Payments are processed directly via PCI-DSS Level 1 compliant gateways (Razorpay &amp; Stripe).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <Eye className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-sm font-bold text-[#FFFFFF]">No Third-Party Ad Tracking</h3>
              <p className="text-xs text-[#9CAFC3]">
                Your personal details, email, and phone numbers are never rented, sold, or shared with advertisers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <ShieldCheck className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-sm font-bold text-[#FFFFFF]">Data Rights &amp; Deletion</h3>
              <p className="text-xs text-[#9CAFC3]">
                Full compliance with India DPDP Act and UK GDPR rights to access, rectify, or erase your account data.
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs md:text-sm text-[#9CAFC3] space-y-6 leading-relaxed">
            <h2 className="text-lg font-bold text-[#FFFFFF]">1. Information We Collect</h2>
            <p>
              We collect information provided directly by you when signing up or placing an order:
              your name, email address, shipping destination, and mobile phone number for logistics
              dispatch notifications.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">2. Explicit Marketing Consent</h2>
            <p>
              Marketing updates and release announcements are strictly opt-in and unchecked by
              default. You may withdraw consent at any moment via your account dashboard or by
              clicking the unsubscribe link in any marketing email.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">3. Contacting the Data Protection Officer</h2>
            <p>
              For privacy queries, GDPR requests, or data deletion requests, contact our Data
              Protection team at <span className="text-[#7DD3FC]">privacy@onestore.com</span>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
