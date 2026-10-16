import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Truck, ShieldCheck, Clock, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Fulfillment Policy — India & UK Express Delivery",
  description:
    "Comprehensive dual-market shipping policy for One Store. Expedited air transit via Blue Dart in India and Royal Mail / DPD in the United Kingdom.",
  alternates: {
    canonical: "https://one-store-gray.vercel.app/shipping-policy",
  },
  openGraph: {
    title: "Shipping & Fulfillment Policy — One Store",
    description: "Insured express delivery terms across India and the United Kingdom.",
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
            <p className="text-xs md:text-sm text-[#9CAFC3]">
              Dual-market dispatch standards engineered for India and the United Kingdom.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <Clock className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Processing Time</h3>
              <p className="text-xs text-[#9CAFC3] leading-relaxed">
                Orders undergo quality inspection and are dispatched within 24 business hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <Truck className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">India Express Air</h3>
              <p className="text-xs text-[#9CAFC3] leading-relaxed">
                3 to 5 business days transit across metro &amp; tier 1/2 Indian PIN codes via air
                express.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2">
              <Globe className="h-6 w-6 text-[#7DD3FC]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">UK Domestic Delivery</h3>
              <p className="text-xs text-[#9CAFC3] leading-relaxed">
                2 to 4 business days transit across the UK via Royal Mail Tracked 24/48 and DPD.
              </p>
            </div>
          </div>

          {/* Detailed Policy Text */}
          <div className="prose prose-invert max-w-none text-xs md:text-sm text-[#9CAFC3] space-y-6 leading-relaxed">
            <h2 className="text-lg font-bold text-[#FFFFFF]">1. Dual Market Logistics Operations</h2>
            <p>
              One Store operates specialized, dedicated fulfillment workflows for our customers in
              both the Republic of India and the United Kingdom. All customs clearance, import duties,
              and local VAT / GST are included in the checkout price — meaning zero unexpected fees
              upon parcel delivery.
            </p>

            <h2 className="text-lg font-bold text-[#FFFFFF]">2. Shipping Rates &amp; Free Delivery Thresholds</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-[#FFFFFF]">India (INR):</strong> Orders over ₹5,000 qualify
                for complimentary Air Express delivery. Standard delivery is ₹250 for orders below
                the threshold.
              </li>
              <li>
                <strong className="text-[#FFFFFF]">United Kingdom (GBP):</strong> Orders over £50
                qualify for complimentary Royal Mail Tracked delivery. Standard delivery is £5.00 for
                orders below the threshold.
              </li>
            </ul>

            <h2 className="text-lg font-bold text-[#FFFFFF]">3. Real-Time Tracking &amp; SMS Dispatch Updates</h2>
            <p>
              Upon handover to our carrier partners (Blue Dart, Delhivery, Royal Mail, DPD), an
              automated dispatch confirmation containing your live tracking number will be sent via
              email and SMS. You can monitor progress anytime on our{" "}
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
