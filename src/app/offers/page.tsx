import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Tag, Sparkles, ArrowRight, Truck, Percent, Gift } from "lucide-react";

export default function OffersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#102A43] border border-[#243447] text-xs font-semibold text-[#7DD3FC]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Active Seasonal Campaigns</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              Exclusive Offers &amp; Dual-Market Perks
            </h1>
            <p className="text-sm text-[#9CAFC3] leading-relaxed">
              Curated savings, introductory promotional codes, and complimentary express delivery
              across India (₹ INR) and the United Kingdom (£ GBP).
            </p>
          </div>

          {/* Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offer 1: Launch Code */}
            <div className="p-8 rounded-3xl bg-[#102A43]/40 border border-[#7DD3FC]/40 shadow-xl space-y-6 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#7DD3FC] text-[#080B10] flex items-center justify-center font-bold">
                    <Percent className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40 font-semibold">
                    Global Launch
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#FFFFFF]">10% Off Entire Catalogue</h3>
                  <p className="text-xs text-[#9CAFC3] mt-2 leading-relaxed">
                    Enjoy 10% instant discount across all flagship studio acoustics, engineered carry, and precision timepieces.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#243447] space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#080B10] border border-[#243447]">
                  <span className="text-xs text-[#9CAFC3]">Promo Code:</span>
                  <span className="font-mono text-sm font-bold text-[#7DD3FC] tracking-wider">
                    LAUNCH10
                  </span>
                </div>
                <Link
                  href="/products"
                  className="w-full py-3 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#7DD3FC]/10"
                >
                  <span>Shop Catalogue with LAUNCH10</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Offer 2: Complimentary Shipping */}
            <div className="p-8 rounded-3xl bg-[#102A43]/40 border border-[#243447] shadow-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center">
                    <Truck className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#102A43] text-emerald-400 border border-emerald-800 font-semibold">
                    Auto-Applied
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#FFFFFF]">Complimentary Express Shipping</h3>
                  <p className="text-xs text-[#9CAFC3] mt-2 leading-relaxed">
                    Free standard express dispatch on domestic India orders over{" "}
                    <strong className="text-[#FFFFFF]">₹4,999</strong> and UK mainland orders over{" "}
                    <strong className="text-[#FFFFFF]">£50.00</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#243447] space-y-3">
                <div className="p-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#9CAFC3]">
                  Blue Dart &amp; Delhivery in India • Royal Mail Tracked 24 in the UK.
                </div>
                <Link
                  href="/products"
                  className="w-full py-3 rounded-xl bg-[#080B10] hover:bg-[#102A43] border border-[#243447] hover:border-[#7DD3FC] text-[#FFFFFF] font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>Browse Eligible Items</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
