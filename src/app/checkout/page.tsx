"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/context/CartContext";
import { useMarket } from "@/lib/context/MarketContext";
import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, subtotal, shippingFee, formattedSubtotal, formattedShippingFee, clearCart } =
    useCart();
  const { market } = useMarket();

  // Form states
  const [formData, setFormData] = useState({
    recipientName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    stateOrProvince: "",
    postalCode: "",
    countryCode: market,
  });

  const [paymentProvider, setPaymentProvider] = useState<"razorpay" | "stripe">(
    market === "IN" ? "razorpay" : "stripe"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const total = subtotal + shippingFee;

  const formatCurrency = (amount: number) => {
    if (market === "IN") {
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (!formData.recipientName || !formData.email || !formData.line1 || !formData.postalCode) {
      setErrorMessage("Please fill in all mandatory shipping address fields.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          market,
          currency: market === "IN" ? "INR" : "GBP",
          customerEmail: formData.email,
          recipientName: formData.recipientName,
          phone: formData.phone,
          line1: formData.line1,
          line2: formData.line2,
          city: formData.city,
          stateOrProvince: formData.stateOrProvince,
          postalCode: formData.postalCode,
          countryCode: market,
          paymentProvider,
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Order placement failed. Please verify your details.");
        return;
      }

      // Clear client cart and navigate to success confirmation
      clearCart();
      router.push(
        `/checkout/success?orderNumber=${data.orderNumber}&amount=${total}&currency=${market === "IN" ? "INR" : "GBP"}`
      );
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage("Network error during checkout. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Checkout Header */}
          <div className="border-b border-[#243447] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-semibold uppercase tracking-wider">
                <Lock className="h-3.5 w-3.5" />
                <span>Secure 256-Bit Encrypted Checkout</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Order Finalization
              </h1>
            </div>

            <div className="text-xs text-[#9CAFC3]">
              Active Market:{" "}
              <strong className="text-[#FFFFFF]">
                {market === "IN" ? "India (₹ INR)" : "United Kingdom (£ GBP)"}
              </strong>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#102A43]/20 border border-[#243447]">
              <h2 className="text-lg font-bold text-[#FFFFFF]">Your cart is empty</h2>
              <p className="text-xs text-[#9CAFC3] mt-1">
                Add products to your cart before proceeding to checkout.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-[#7DD3FC] text-[#080B10] text-xs font-semibold"
              >
                Return to Catalogue
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Form inputs (2 cols) */}
              <div className="lg:col-span-2 space-y-8">
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Section 1: Customer Contact */}
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
                  <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center text-xs font-mono">
                      1
                    </span>
                    <span>Contact Details</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#FFFFFF]">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#FFFFFF]">
                        Mobile Phone ({market === "IN" ? "+91" : "+44"}) *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={market === "IN" ? "98765 43210" : "7911 123456"}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Shipping Address */}
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
                  <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center text-xs font-mono">
                      2
                    </span>
                    <span>Shipping Destination ({market === "IN" ? "India" : "United Kingdom"})</span>
                  </h2>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#FFFFFF]">Recipient Full Name *</label>
                      <input
                        type="text"
                        name="recipientName"
                        required
                        value={formData.recipientName}
                        onChange={handleInputChange}
                        placeholder="Recipient Name"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#FFFFFF]">Address Line 1 *</label>
                      <input
                        type="text"
                        name="line1"
                        required
                        value={formData.line1}
                        onChange={handleInputChange}
                        placeholder="House / Flat / Building & Street"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#FFFFFF]">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        name="line2"
                        value={formData.line2}
                        onChange={handleInputChange}
                        placeholder="Apartment, suite, unit, etc."
                        className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-[#FFFFFF]">City *</label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder={market === "IN" ? "Mumbai / Delhi" : "London / Manchester"}
                          className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-[#FFFFFF]">
                          {market === "IN" ? "State *" : "County / Region *"}
                        </label>
                        <input
                          type="text"
                          name="stateOrProvince"
                          required
                          value={formData.stateOrProvince}
                          onChange={handleInputChange}
                          placeholder={market === "IN" ? "Maharashtra" : "Greater London"}
                          className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-[#FFFFFF]">
                          {market === "IN" ? "PIN Code *" : "Postcode *"}
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          required
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          placeholder={market === "IN" ? "400001" : "SW1A 1AA"}
                          className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Dual Payment Integration */}
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
                  <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center text-xs font-mono">
                      3
                    </span>
                    <span>Payment Gateway</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Razorpay Option (India INR) */}
                    <div
                      onClick={() => setPaymentProvider("razorpay")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentProvider === "razorpay"
                          ? "bg-[#102A43] border-[#7DD3FC] text-[#FFFFFF]"
                          : "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:border-[#9CAFC3]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#FFFFFF]">Razorpay</span>
                        {market === "IN" && (
                          <span className="text-[10px] font-bold text-[#7DD3FC] bg-[#7DD3FC]/10 px-2 py-0.5 rounded border border-[#7DD3FC]/30">
                            Recommended for India (₹)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9CAFC3]">
                        UPI, NetBanking, RuPay, Visa, Mastercard, and Indian Wallets.
                      </p>
                    </div>

                    {/* Stripe Option (UK GBP) */}
                    <div
                      onClick={() => setPaymentProvider("stripe")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentProvider === "stripe"
                          ? "bg-[#102A43] border-[#7DD3FC] text-[#FFFFFF]"
                          : "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:border-[#9CAFC3]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#FFFFFF]">Stripe</span>
                        {market === "GB" && (
                          <span className="text-[10px] font-bold text-[#7DD3FC] bg-[#7DD3FC]/10 px-2 py-0.5 rounded border border-[#7DD3FC]/30">
                            Recommended for UK (£)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9CAFC3]">
                        Visa, Mastercard, American Express, Apple Pay &amp; Google Pay.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Order Summary (1 col) */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
                  <h3 className="text-base font-bold text-[#FFFFFF] border-b border-[#243447] pb-3">
                    Items in Cart ({itemCount})
                  </h3>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <div className="truncate max-w-[180px]">
                          <span className="font-bold text-[#FFFFFF]">{item.productName}</span>
                          {item.variantName && (
                            <span className="text-[11px] text-[#7DD3FC] block">
                              {item.variantName} × {item.quantity}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[#FFFFFF]">
                          {formatCurrency((market === "IN" ? item.priceInr : item.priceGbp) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-xs text-[#9CAFC3] pt-4 border-t border-[#243447]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-[#FFFFFF] font-semibold">{formattedSubtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Logistics</span>
                      <span className="text-[#7DD3FC] font-semibold">{formattedShippingFee}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-[#FFFFFF] pt-3 border-t border-[#243447]">
                      <span>Grand Total</span>
                      <span className="text-[#7DD3FC]">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Place Order &amp; Pay</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-[#9CAFC3] text-center pt-2 leading-relaxed">
                    By placing your order, you agree to One Store's Terms of Service and 14-day
                    protected return policy.
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
