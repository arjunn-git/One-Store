import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { CheckCircle2, Truck, Package, ArrowRight, ShieldCheck } from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string;
    amount?: string;
    currency?: string;
  }>;
}

async function SuccessDetails({ searchParams }: SuccessPageProps) {
  const { orderNumber = "OS-2026-CONFIRMED", amount = "0", currency = "INR" } =
    await searchParams;

  const isIndia = currency === "INR";
  const formattedAmount =
    isIndia
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
          Number(amount)
        )
      : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
          Number(amount)
        );

  return (
    <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] text-center space-y-6 shadow-2xl">
      <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
          Payment Confirmed
        </span>
        <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto leading-relaxed">
          Your order has been recorded into the One Store fulfillment system and an official email
          confirmation has been queued.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs space-y-2 text-left">
        <div className="flex justify-between items-center">
          <span className="text-[#9CAFC3]">Order Reference</span>
          <span className="font-mono font-bold text-[#FFFFFF]">{orderNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9CAFC3]">Total Charged</span>
          <span className="font-bold text-[#7DD3FC]">{formattedAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9CAFC3]">Fulfillment Status</span>
          <span className="text-amber-300 font-medium">Awaiting Dispatch</span>
        </div>
      </div>

      {/* Logistics Dispatch Details */}
      <div className="p-4 rounded-xl bg-[#102A43]/50 border border-[#243447] text-xs text-left flex items-start gap-3">
        <Truck className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-[#FFFFFF]">
            {isIndia ? "India Express Air Dispatch" : "UK Domestic Tracked Fulfillment"}
          </div>
          <div className="text-[11px] text-[#9CAFC3]">
            {isIndia
              ? "Estimated delivery to your address: 3-5 business days (+91 SMS tracking link upon dispatch)."
              : "Estimated delivery: 2-4 business days (Royal Mail / DPD Tracked)."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/account"
          className="h-11 rounded-xl bg-[#102A43] text-[#FFFFFF] border border-[#243447] hover:border-[#7DD3FC] text-xs font-semibold flex items-center justify-center transition-all"
        >
          View in Account
        </Link>
        <Link
          href="/products"
          className="h-11 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] flex items-center justify-center gap-1.5 shadow-lg shadow-[#7DD3FC]/10 transition-all"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4 md:px-8">
        <Suspense
          fallback={
            <div className="p-8 rounded-2xl bg-[#102A43]/40 text-center text-xs text-[#9CAFC3] animate-pulse">
              Confirming order details...
            </div>
          }
        >
          <SuccessDetails searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
