import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[#243447] py-20 md:py-32 px-4 md:px-8">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Market badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#102A43] border border-[#243447] text-xs font-medium text-[#7DD3FC] mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Engineered for India &amp; the United Kingdom</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#FFFFFF] max-w-4xl leading-[1.1]">
              Custom-Crafted Commerce. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#7DD3FC] to-[#FFFFFF]">
                Zero Compromise.
              </span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-[#9CAFC3] max-w-2xl leading-relaxed">
              Experience One Store — a high-performance, custom-built e-commerce platform.
              Dual-currency checkout in INR (₹) and GBP (£), passwordless OTP authentication, and
              curated quality.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#7DD3FC] text-[#080B10] font-semibold text-sm hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10"
              >
                Explore Catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#102A43] text-[#F4F8FC] border border-[#243447] font-semibold text-sm hover:border-[#7DD3FC] hover:text-[#7DD3FC] transition-all flex items-center justify-center"
              >
                Create Account (Email OTP)
              </Link>
            </div>

            {/* Feature points */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full max-w-3xl border-t border-[#243447]/60 pt-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#FFFFFF]">Direct Database Sync</h3>
                  <p className="text-xs text-[#9CAFC3] mt-0.5">
                    Live inventory tracking with PostgreSQL Row Level Security.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#FFFFFF]">Passwordless Security</h3>
                  <p className="text-xs text-[#9CAFC3] mt-0.5">
                    Fast, secure 6-digit email OTP login powered by Supabase Auth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#FFFFFF]">Dual Currency Engine</h3>
                  <p className="text-xs text-[#9CAFC3] mt-0.5">
                    Unified checkout supporting Razorpay (INR) and Stripe (GBP).
                  </p>
                </div>
              </div>
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
                  className="group relative p-8 rounded-xl bg-[#102A43]/40 border border-[#243447] hover:border-[#7DD3FC] transition-all flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <h3 className="text-xl font-bold text-[#FFFFFF] group-hover:text-[#7DD3FC] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#9CAFC3] mt-2 leading-relaxed">{cat.desc}</p>
                  </div>
                  <div className="text-xs font-semibold text-[#7DD3FC] flex items-center gap-1.5 mt-6">
                    Browse Selection <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
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
