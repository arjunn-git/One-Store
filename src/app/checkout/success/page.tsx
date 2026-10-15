import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  CheckCircle2,
  Truck,
  Package,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  XCircle,
  Lock,
} from "lucide-react";
import { getSecureOrderDetails } from "@/lib/services/payments";
import { OrderSuccessFallback } from "@/components/storefront/OrderSuccessFallback";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string;
    order_number?: string;
    orderId?: string;
    order_id?: string;
    token?: string;
    access_token?: string;
  }>;
}

function formatCurrency(amount: number, currency: "INR" | "GBP") {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

async function SuccessDetails({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const rawOrderNumber =
    params.orderNumber ||
    params.order_number ||
    params.orderId ||
    params.order_id;
  const token = params.token || params.access_token;
  const orderNumber = rawOrderNumber
    ? String(rawOrderNumber).replace(/\s+/g, "").toUpperCase()
    : null;

  if (!orderNumber) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-[#FFFFFF]">Missing Order Reference</h1>
        <p className="text-xs text-[#9CAFC3]">
          No order identifier was found in your request. Please check your confirmation link or return to the storefront.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  // 1. Secure Server-Side Order Lookup (Authenticates user ownership or verification token)
  const result = await getSecureOrderDetails(orderNumber, token);

  // Unauthorized Access (Customer PII Isolation Protection)
  if (result.status === 403) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#102A43]/40 border border-red-800/80 text-center space-y-5 shadow-2xl">
        <div className="h-16 w-16 rounded-full bg-red-950/60 text-red-400 border border-red-800 flex items-center justify-center mx-auto">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
            Security &amp; Privacy Protection
          </span>
          <h1 className="text-2xl font-extrabold text-[#FFFFFF]">Access Restricted</h1>
          <p className="text-xs text-[#9CAFC3] max-w-md mx-auto leading-relaxed">
            You do not have permission to view order <span className="font-mono text-[#7DD3FC]">{orderNumber}</span>.
            Orders can only be inspected by the verified purchasing account or with a cryptographically valid access token.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/login?next=/checkout/success?orderNumber=${orderNumber}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs transition-all"
          >
            Sign In with Customer Account
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] text-xs font-semibold"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Order Not Found in Server Store — Check Client Storage & Show Fallback
  if (!result.order) {
    return <OrderSuccessFallback orderNumber={orderNumber} />;
  }

  const order = result.order;
  const isIndia = order.currency === "INR";
  const formattedAmount = formatCurrency(order.total_amount, order.currency);

  // ---------------------------------------------------------------------------
  // Case A: Payment Failed / Rejected
  // ---------------------------------------------------------------------------
  if (order.payment_status === "failed") {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#102A43]/40 border border-red-800/80 text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 rounded-full bg-red-950/60 text-red-400 border border-red-800 flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Payment Unsuccessful
          </span>
          <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            Payment Could Not Be Confirmed
          </h1>
          <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto leading-relaxed">
            Your transaction was declined, cancelled, or failed signature verification. No funds were captured for this order.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs space-y-2 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[#9CAFC3]">Order Reference</span>
            <span className="font-mono font-bold text-[#FFFFFF]">{order.order_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#9CAFC3]">Attempted Amount</span>
            <span className="font-mono font-bold text-red-400">{formattedAmount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#9CAFC3]">Payment Status</span>
            <span className="font-bold text-red-400 uppercase">Failed / Declined</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/checkout"
            className="h-11 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#7DD3FC]/10 transition-all hover:bg-[#FFFFFF]"
          >
            <span>Retry Payment</span>
            <RefreshCw className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/support"
            className="h-11 rounded-xl bg-[#102A43] text-[#FFFFFF] border border-[#243447] text-xs font-semibold flex items-center justify-center hover:border-[#7DD3FC] transition-all"
          >
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Case B: Payment Pending / Processing (Awaiting Webhook or Bank Settlement)
  // ---------------------------------------------------------------------------
  if (order.payment_status === "pending" || order.payment_status === "processing") {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#102A43]/40 border border-amber-600/60 text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Payment Processing
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            Confirming Payment with Gateway
          </h1>
          <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto leading-relaxed">
            Your transaction has been submitted. We are awaiting final confirmation from the banking network and Razorpay webhook callback.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs space-y-2 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[#9CAFC3]">Order Reference</span>
            <span className="font-mono font-bold text-[#FFFFFF]">{order.order_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#9CAFC3]">Total Due</span>
            <span className="font-mono font-bold text-[#7DD3FC]">{formattedAmount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#9CAFC3]">Gateway Verification</span>
            <span className="text-amber-300 font-semibold flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Awaiting capture confirmation</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href={`/checkout/success?orderNumber=${order.order_number}${token ? `&token=${token}` : ""}`}
            className="px-5 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs flex items-center gap-2 transition-all hover:bg-[#FFFFFF]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Payment Status</span>
          </Link>
          <Link
            href="/checkout"
            className="px-4 py-2.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] text-xs font-semibold"
          >
            Return to Checkout
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Case C: Payment Succeeded & Verified
  // ---------------------------------------------------------------------------
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
          Your payment has been cryptographically verified and recorded into the One Store fulfillment system.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs space-y-2.5 text-left">
        <div className="flex justify-between items-center">
          <span className="text-[#9CAFC3]">Order Reference</span>
          <span className="font-mono font-bold text-[#FFFFFF]">{order.order_number}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9CAFC3]">Verified Total Amount</span>
          <span className="font-bold text-[#7DD3FC] font-mono">{formattedAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9CAFC3]">Payment Status</span>
          <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            Paid &amp; Captured
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9CAFC3]">Fulfillment State</span>
          <span className="text-amber-300 font-medium">
            {order.status === "processing"
              ? "Preparing for Dispatch"
              : order.status === "shipped"
              ? "Dispatched & In Transit"
              : order.status === "delivered"
              ? "Delivered"
              : "Awaiting Dispatch"}
          </span>
        </div>
        {order.payment_reference && (
          <div className="flex justify-between items-center pt-1 border-t border-[#243447]/60">
            <span className="text-[#9CAFC3]">Gateway Reference</span>
            <span className="font-mono text-[11px] text-[#9CAFC3]">{order.payment_reference}</span>
          </div>
        )}
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
              Verifying payment and retrieving order status...
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
