import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Sparkles, Shield, Compass, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#102A43] border border-[#243447] text-xs font-medium text-[#7DD3FC]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>The One Store Philosophy</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#FFFFFF] tracking-tight">
              Engineered for Discerning Tastes.
            </h1>
            <p className="text-base text-[#9CAFC3] max-w-2xl mx-auto leading-relaxed">
              We started One Store with a singular thesis: everyday carry, wireless acoustics, and
              horology should be custom-engineered with zero superfluous ornament and manufactured to
              uncompromising specifications.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-3">
              <Compass className="h-8 w-8 text-[#7DD3FC]" />
              <h3 className="text-lg font-bold text-[#FFFFFF]">Direct Manufacturing</h3>
              <p className="text-xs text-[#9CAFC3] leading-relaxed">
                By maintaining direct supplier partnerships with ISO-certified production lines, we
                eliminate traditional distributor markups.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-3">
              <Shield className="h-8 w-8 text-[#7DD3FC]" />
              <h3 className="text-lg font-bold text-[#FFFFFF]">Authentic Quality</h3>
              <p className="text-xs text-[#9CAFC3] leading-relaxed">
                Every model in our catalogue undergoes 3-stage stress testing before dispatch, backed
                by a full 1-year replacement warranty.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-3">
              <Sparkles className="h-8 w-8 text-[#7DD3FC]" />
              <h3 className="text-lg font-bold text-[#FFFFFF]">Dual Market Logistics</h3>
              <p className="text-xs text-[#9CAFC3] leading-relaxed">
                Seamless fulfillment in INR (₹) across India and GBP (£) across the UK, with all
                duties and taxes completely prepaid.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="p-10 rounded-3xl bg-[#102A43] border border-[#243447] text-center space-y-4">
            <h2 className="text-2xl font-bold text-[#FFFFFF]">Ready to experience One Store?</h2>
            <p className="text-xs text-[#9CAFC3] max-w-md mx-auto">
              Explore our current releases or create your account for priority access to upcoming
              limited editions.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                href="/products"
                className="px-6 py-3 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all flex items-center gap-2"
              >
                <span>Browse Products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
