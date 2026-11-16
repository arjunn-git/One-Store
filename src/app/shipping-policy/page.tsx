import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Truck, ShieldCheck, Clock, MapPin, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Fulfillment Policy — All-India Express Delivery",
  description:
    "Official Indian shipping and logistics policy for One Store. Expedited air transit via Blue Dart and Delhivery Express across 19,000+ PIN codes.",
  alternates: {
    canonical: "https://one-store-gray.vercel.app/shipping-policy",
  },
  openGraph: {
    title: "Shipping & Fulfillment Policy — One Store India",
    description: "Insured express delivery terms across 19,000+ Indian PIN codes.",
    url: "https://one-store-gray.vercel.app/shipping-policy",
    type: "website",
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="border-b border-[#243447] pb-6 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              Logistics Framework
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              Shipping &amp; Fulfillment Policy
            </h1>
            <p className="text-xs md:text-sm text-[#CBD5E1]">
              National express air dispatch standards engineered exclusively for the Republic of India.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <Clock className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Processing Time</h3>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Orders undergo quality inspection and are dispatched within 24 business hours from our central Indian hubs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <Truck className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Blue Dart Air Express</h3>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                2 to 4 business days transit across metro &amp; tier 1/2 Indian PIN codes via air express.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <MapPin className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">19,000+ PIN Codes</h3>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Comprehensive pan-India coverage spanning Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, and beyond.
              </p>
            </div>
          </div>

          {/* Detailed Policy Text */}
          <div className="prose prose-invert max-w-none text-xs md:text-sm text-[#CBD5E1] space-y-6 leading-relaxed">
            <h2 className="text-lg font-bold text-[#FFFFFF]">1. Domestic Indian Logistics Operations</h2>
            <p>
              One Store operates specialized, dedicated fulfillment workflows for our customers across the Republic of India.
              All orders are dispatched in tamper-evident security packaging with live tracking. All prices shown on our store
              are strictly inclusive of 18% GST (CGST + SGST) — meaning zero surprise surcharges or octroi upon delivery.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">2. Shipping Rates &amp; Free Delivery Thresholds</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-[#FFFFFF]">Free Shipping:</strong> All orders over ₹1,999 qualify for complimentary Blue Dart / Delhivery Air Express delivery anywhere in India.
              </li>
              <li>
                <strong className="text-[#FFFFFF]">Standard Shipping:</strong> For orders below ₹1,999, a nominal flat rate of ₹149 is applied to cover insured domestic air cargo.
              </li>
            </ul>

            <h2 className="text-lg font-bold text-[#FFFFFF]">3. Real-Time Tracking &amp; SMS Dispatch Updates</h2>
            <p>
              Upon handover to our carrier partners (Blue Dart Express &amp; Delhivery), an automated dispatch confirmation
              containing your AWB tracking number will be sent via email and SMS. You can monitor transit milestones 24/7 on our{" "}
              <a href="/orders" className="text-[#7DD3FC] underline">
                Order Tracking Portal
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
