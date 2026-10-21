import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Hero3DStage } from "@/components/storefront/Hero3DStage";
import { getProducts } from "@/lib/services/products";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "One Store — Curated Commerce for India & the UK",
  description:
    "Engineered lifestyle, studio acoustics, minimalist carry, and precision chronographs. Dual-market checkout in INR (₹) and GBP (£) with fully insured express delivery.",
  alternates: {
    canonical: "https://one-store-gray.vercel.app",
    languages: {
      "en-IN": "https://one-store-gray.vercel.app/?country=IN",
      "en-GB": "https://one-store-gray.vercel.app/?country=UK",
    },
  },
};

export default async function Home() {
  const cookieStore = await cookies();
  const rawMarket = cookieStore.get("one_store_market")?.value;
  const market = (rawMarket === "GB" ? "GB" : "IN") as "IN" | "GB";

  const featuredProducts = await getProducts({ featuredOnly: true, market });

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[#243447] py-10 sm:py-16 md:py-24 px-3 sm:px-4 md:px-8">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Promotional launch ribbon */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl sm:rounded-full bg-[#102A43] border border-[#7DD3FC]/40 text-xs font-medium text-[#FFFFFF] mb-6 shadow-md text-center">
              <span className="flex h-2 w-2 rounded-full bg-[#7DD3FC] animate-ping" />
              <span className="text-[#7DD3FC] font-semibold">Special Launch Offer:</span>
              <span>Use code <strong className="font-mono text-[#FFFFFF] bg-[#080B10] px-2 py-0.5 rounded border border-[#7DD3FC]/30">LAUNCH10</strong> for 10% off</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#FFFFFF] max-w-4xl leading-[1.12] [text-wrap:balance]">
              Everyday Luxury, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#7DD3FC] to-[#FFFFFF]">
                Engineered to Perfection.
              </span>
            </h1>

            <p className="mt-6 text-sm sm:text-base md:text-lg text-[#9CAFC3] max-w-2xl leading-relaxed [text-wrap:balance]">
              Curated studio acoustics, engineered minimalist carry, and precision chronographs.
              Seamless dual-market checkout in INR (₹) and GBP (£) with fully insured express delivery.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-sm hover:bg-[#FFFFFF] hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#7DD3FC]/20"
              >
                <span>Shop Flagship Catalogue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/offers"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#102A43] text-[#F4F8FC] border border-[#243447] font-semibold text-sm hover:border-[#7DD3FC] hover:text-[#7DD3FC] hover:scale-105 transition-all flex items-center justify-center shadow-md"
              >
                <span>View Active Perks &amp; Offers</span>
              </Link>
            </div>

            {/* 3D Interactive Floating Dual-Market Stage */}
            <Hero3DStage />

            {/* Customer Value Propositions (Marketing Features) */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full max-w-4xl border-t border-[#243447]/60 pt-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">100% Certified Authentic</h3>
                  <p className="text-xs text-[#9CAFC3] mt-0.5 leading-relaxed">
                    Individually hand-inspected, serialized, and backed by a comprehensive 1-year warranty.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">14-Day Risk-Free Returns</h3>
                  <p className="text-xs text-[#9CAFC3] mt-0.5 leading-relaxed">
                    Try your flagship gear at home. Enjoy zero-hassle doorstep pickup and prompt refund.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Zero Hidden Import Duties</h3>
                  <p className="text-xs text-[#9CAFC3] mt-0.5 leading-relaxed">
                    All taxes, customs clearance, and insured express delivery are included at checkout.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof & Customer Trust Bar */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-[#9CAFC3] bg-[#102A43]/30 px-4 sm:px-6 py-2.5 rounded-2xl sm:rounded-full border border-[#243447] text-center max-w-full">
              <span className="text-amber-400 font-bold tracking-wider">★★★★★</span>
              <span className="text-[#FFFFFF] font-semibold">4.9/5 Customer Satisfaction</span>
              <span className="hidden sm:inline">•</span>
              <span>Trusted by 2,400+ creators across India &amp; the UK</span>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-20 px-4 md:px-8 border-b border-[#243447]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
                  Flagship Releases
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] mt-1">
                  Featured Products
                </h2>
              </div>
              <Link
                href="/products"
                className="mt-4 md:mt-0 text-sm font-medium text-[#7DD3FC] hover:text-[#FFFFFF] flex items-center gap-1 transition-colors"
              >
                View complete catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Categories Preview */}
        <section className="py-20 px-4 md:px-8 border-b border-[#243447]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
                  Curated Categories
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] mt-1">
                  Engineered Essentials
                </h2>
              </div>
              <Link
                href="/categories"
                className="mt-4 md:mt-0 text-sm font-medium text-[#7DD3FC] hover:text-[#FFFFFF] flex items-center gap-1 transition-colors"
              >
                View all categories <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Precision Audio",
                  desc: "Studio-calibrated wireless acoustics and monitors.",
                  slug: "audio-gear",
                },
                {
                  title: "Minimalist Carry",
                  desc: "Weatherproof engineered packs and everyday carry.",
                  slug: "travel-carry",
                },
                {
                  title: "Horology",
                  desc: "Contemporary mechanical & chronograph timepieces.",
                  slug: "timepieces",
                },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="group relative p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] hover:border-[#7DD3FC] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#7DD3FC]/15 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <h3 className="text-xl font-bold text-[#FFFFFF] group-hover:text-[#7DD3FC] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#9CAFC3] mt-2 leading-relaxed">{cat.desc}</p>
                  </div>
                  <div className="text-xs font-semibold text-[#7DD3FC] flex items-center gap-1.5 mt-6">
                    Browse Selection <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
