"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart, getCartItemImage } from "@/lib/context/CartContext";
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
  Check,
  MapPin,
  Plus,
  Home,
  Briefcase,
  User,
  ExternalLink,
} from "lucide-react";
import {
  validatePostalCode,
  validatePhoneNumber,
  type ProfileValidationResult,
} from "@/lib/services/profile-validation";

interface SavedAddress {
  id: string;
  label?: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state_or_province: string;
  postal_code: string;
  country_code: "IN" | "GB";
  is_default: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, subtotal, shippingFee, formattedSubtotal, formattedShippingFee, clearCart } =
    useCart();
  const { market } = useMarket();

  // Authentication & Profile States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [profileCompletion, setProfileCompletion] = useState<ProfileValidationResult | null>(null);

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
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<
    "upi" | "card" | "netbanking" | "applepay" | "klarna"
  >(market === "IN" ? "upi" : "card");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingTestOrder, setPendingTestOrder] = useState<{
    orderNumber: string;
    accessToken?: string;
    message?: string;
  } | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Fetch authentication status, profile & saved addresses on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAccountData() {
      setIsAuthChecking(true);
      try {
        const res = await fetch("/api/account/profile");
        if (res.status === 401) {
          if (isMounted) {
            setIsAuthenticated(false);
            setIsAuthChecking(false);
          }
          return;
        }

        const data = await res.json();
        if (isMounted && data.success && data.profile) {
          setIsAuthenticated(true);
          setUserProfile(data.profile);
          const addrs: SavedAddress[] = data.addresses || [];
          setSavedAddresses(addrs);
          setProfileCompletion(data.completion || null);

          // Find default address or first address
          const defAddr = addrs.find((a) => a.is_default) || addrs[0];

          if (defAddr) {
            setSelectedAddressId(defAddr.id);
            setFormData({
              recipientName: defAddr.recipient_name,
              email: data.profile.email || "",
              phone: defAddr.phone,
              line1: defAddr.line1,
              line2: defAddr.line2 || "",
              city: defAddr.city,
              stateOrProvince: defAddr.state_or_province,
              postalCode: defAddr.postal_code,
              countryCode: defAddr.country_code || market,
            });
          } else {
            // Fill from profile direct fields if present
            setSelectedAddressId("new");
            setFormData({
              recipientName: data.profile.full_name || "",
              email: data.profile.email || "",
              phone: data.profile.phone || "",
              line1: data.profile.street_address
                ? data.profile.apartment_unit
                  ? `${data.profile.apartment_unit}, ${data.profile.street_address}`
                  : data.profile.street_address
                : "",
              line2: "",
              city: data.profile.city || "",
              stateOrProvince: data.profile.state_or_province || "",
              postalCode: data.profile.postal_code || "",
              countryCode: data.profile.country || market,
            });
          }
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    }

    loadAccountData();

    return () => {
      isMounted = false;
    };
  }, [market]);

  // Handle switching between saved addresses
  const handleSelectSavedAddress = (id: string | "new") => {
    setSelectedAddressId(id);
    if (id === "new") {
      setFormData({
        recipientName: userProfile?.full_name || "",
        email: userProfile?.email || "",
        phone: userProfile?.phone || "",
        line1: "",
        line2: "",
        city: "",
        stateOrProvince: "",
        postalCode: "",
        countryCode: market,
      });
    } else {
      const selected = savedAddresses.find((a) => a.id === id);
      if (selected) {
        setFormData({
          recipientName: selected.recipient_name,
          email: userProfile?.email || formData.email,
          phone: selected.phone,
          line1: selected.line1,
          line2: selected.line2 || "",
          city: selected.city,
          stateOrProvince: selected.state_or_province,
          postalCode: selected.postal_code,
          countryCode: selected.country_code || market,
        });
      }
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const clean = promoCode.trim().toUpperCase();
    if (clean === "LAUNCH10") {
      setAppliedPromo({ code: "LAUNCH10", discountPercent: 10 });
    } else {
      setPromoError("Invalid code. Try LAUNCH10 for 10% off.");
    }
  };

  // Dynamically keep payment provider aligned with active market
  useEffect(() => {
    if (market === "IN") {
      setPaymentProvider("razorpay");
      setSelectedPaymentTab("upi");
    } else {
      setPaymentProvider("stripe");
      setSelectedPaymentTab("card");
    }
  }, [market]);

  const handleCompleteSandboxPayment = async () => {
    if (!pendingTestOrder) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/payments/sandbox-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: pendingTestOrder.orderNumber,
          accessToken: pendingTestOrder.accessToken,
        }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (data.success) {
        const cleanOrderNumber = String(pendingTestOrder.orderNumber).replace(/\s+/g, "").toUpperCase();
        const backupOrder = {
          order_number: cleanOrderNumber,
          orderNumber: cleanOrderNumber,
          subtotal,
          discount_amount: discountAmount,
          shipping_fee: shippingFee,
          total_amount: checkoutGrandTotal,
          currency: market === "IN" ? "INR" : "GBP",
          payment_status: "succeeded",
          status: "processing",
          created_at: new Date().toISOString(),
          items: items.map((i) => ({
            product_name: i.productName,
            variant_name: i.variantName,
            quantity: i.quantity,
            unit_price: market === "IN" ? i.priceInr : i.priceGbp,
            total_price: (market === "IN" ? i.priceInr : i.priceGbp) * i.quantity,
            image_url: getCartItemImage(i),
          })),
          shipping_address: {
            recipientName: formData.recipientName,
            phone: formData.phone,
            line1: formData.line1,
            city: formData.city,
            stateOrProvince: formData.stateOrProvince,
            postalCode: formData.postalCode,
            countryCode: market,
          },
        };
        try {
          localStorage.setItem(`one_store_order_${cleanOrderNumber}`, JSON.stringify(backupOrder));
          localStorage.setItem("one_store_last_order", JSON.stringify(backupOrder));
        } catch {
          // Ignore
        }

        clearCart();
        const safeOrderNum = encodeURIComponent(cleanOrderNumber);
        const safeToken = encodeURIComponent(pendingTestOrder.accessToken || "");
        router.push(`/checkout/success?orderNumber=${safeOrderNum}&token=${safeToken}`);
      } else {
        setErrorMessage(data.error || "Sandbox completion failed.");
      }
    } catch {
      setIsLoading(false);
      setErrorMessage("Network error during sandbox completion.");
    }
  };

  const total = subtotal + shippingFee;
  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.discountPercent) / 100) : 0;
  const checkoutGrandTotal = Math.max(0, total - discountAmount);

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

    // 1. Mandatory Profile 100% check
    if (profileCompletion && !profileCompletion.isComplete) {
      setErrorMessage(
        `Profile is ${profileCompletion.percentage}% complete. 100% profile completion is mandatory before checkout. Missing: ${profileCompletion.missingFields.join(", ")}.`
      );
      return;
    }

    // 2. Validate Address Fields
    if (!formData.recipientName?.trim()) {
      setErrorMessage("Recipient name is required.");
      return;
    }
    if (!formData.line1?.trim()) {
      setErrorMessage("Delivery street address is required.");
      return;
    }
    if (!formData.city?.trim()) {
      setErrorMessage("City or town is required.");
      return;
    }
    if (!validatePhoneNumber(formData.phone, market)) {
      setErrorMessage(
        market === "IN"
          ? "Please provide a valid 10-digit Indian mobile number."
          : "Please provide a valid UK mobile number."
      );
      return;
    }
    if (!validatePostalCode(formData.postalCode, market)) {
      setErrorMessage(
        market === "IN"
          ? "Please provide a valid 6-digit Indian PIN code."
          : "Please provide a valid UK postcode (e.g. SW1A 1AA)."
      );
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
          promoCode: appliedPromo?.code || undefined,
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.status === 401 || data.requireLogin) {
        setErrorMessage("Authentication required. Redirecting to login without losing your cart...");
        setTimeout(() => {
          router.push("/login?next=/checkout");
        }, 1500);
        return;
      }

      if (response.status === 403 && data.profileIncomplete) {
        setErrorMessage(data.error);
        setProfileCompletion({
          isComplete: false,
          percentage: data.percentage || 0,
          missingFields: data.missingFields || [],
          fieldErrors: data.fieldErrors || {},
          checklist: [],
        });
        return;
      }

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Order placement failed. Please verify your details.");
        return;
      }

      // 1. If Stripe checkout session URL is provided, redirect to Stripe
      if (data.stripeCheckoutUrl) {
        clearCart();
        window.location.href = data.stripeCheckoutUrl;
        return;
      }

      // 2. If Razorpay order is initialized with keys, open Razorpay Standard Checkout
      if (data.razorpayOrderId && data.razorpayKeyId) {
        if (!("Razorpay" in window)) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => (script.onload = resolve));
        }

        const options = {
          key: data.razorpayKeyId,
          amount: Math.round(total * 100),
          currency: "INR",
          name: "One Store",
          description: `Order ${data.orderNumber}`,
          order_id: data.razorpayOrderId,
          prefill: {
            name: formData.recipientName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#080B10",
          },
          handler: async function (paymentResponse: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            setIsLoading(true);
            try {
              const verifyRes = await fetch("/api/payments/verify/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderNumber: data.orderNumber,
                  accessToken: data.accessToken,
                  razorpayOrderId: paymentResponse.razorpay_order_id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              setIsLoading(false);

              if (verifyRes.ok && verifyData.success) {
                const cleanOrderNumber = String(data.orderNumber).replace(/\s+/g, "").toUpperCase();
                const backupOrder = {
                  order_number: cleanOrderNumber,
                  orderNumber: cleanOrderNumber,
                  subtotal,
                  discount_amount: discountAmount,
                  shipping_fee: shippingFee,
                  total_amount: checkoutGrandTotal,
                  currency: market === "IN" ? "INR" : "GBP",
                  payment_status: "succeeded",
                  status: "processing",
                  created_at: new Date().toISOString(),
                  items: items.map((i) => ({
                    product_name: i.productName,
                    variant_name: i.variantName,
                    quantity: i.quantity,
                    unit_price: market === "IN" ? i.priceInr : i.priceGbp,
                    total_price: (market === "IN" ? i.priceInr : i.priceGbp) * i.quantity,
                    image_url: getCartItemImage(i),
                  })),
                  shipping_address: {
                    recipientName: formData.recipientName,
                    phone: formData.phone,
                    line1: formData.line1,
                    city: formData.city,
                    stateOrProvince: formData.stateOrProvince,
                    postalCode: formData.postalCode,
                    countryCode: market,
                  },
                };
                try {
                  localStorage.setItem(`one_store_order_${cleanOrderNumber}`, JSON.stringify(backupOrder));
                  localStorage.setItem("one_store_last_order", JSON.stringify(backupOrder));
                } catch {
                  // Ignore
                }

                clearCart();
                const safeOrderNum = encodeURIComponent(cleanOrderNumber);
                const safeToken = encodeURIComponent(data.accessToken || "");
                router.push(`/checkout/success?orderNumber=${safeOrderNum}&token=${safeToken}`);
              } else {
                setErrorMessage(
                  verifyData.error || "Payment verification failed. Invalid cryptographic signature."
                );
              }
            } catch {
              setIsLoading(false);
              setErrorMessage("Network error during payment verification. Please check your connection.");
            }
          },
          modal: {
            ondismiss: async function () {
              try {
                await fetch("/api/payments/fail", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderNumber: data.orderNumber,
                    accessToken: data.accessToken,
                    reason: "Customer dismissed checkout modal",
                  }),
                });
              } catch {
                // Ignore
              }
              setErrorMessage(
                "Payment was not completed. Your order has been preserved in pending payment state."
              );
            },
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

      // 3. Sandbox Gateway Mode
      if (data.requiresCredentials) {
        setPendingTestOrder({
          orderNumber: data.orderNumber,
          accessToken: data.accessToken,
          message: data.message,
        });
        return;
      }

      setErrorMessage("Payment provider could not be initialized. Please try again.");
    } catch {
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
                <span>Secure 256-Bit Encrypted Express Checkout</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Order Finalization
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#9CAFC3]">
                Market:{" "}
                <strong className="text-[#FFFFFF]">
                  {market === "IN" ? "India (₹ INR)" : "United Kingdom (£ GBP)"}
                </strong>
              </span>
              {isAuthenticated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Authenticated
                </span>
              )}
            </div>
          </div>

          {/* Authentication Barrier for Guests */}
          {isAuthChecking ? (
            <div className="p-12 text-center rounded-2xl bg-[#102A43]/20 border border-[#243447] text-xs text-[#9CAFC3]">
              Verifying customer authentication and profile completion...
            </div>
          ) : !isAuthenticated ? (
            <div className="p-10 text-center rounded-2xl bg-[#102A43]/30 border border-[#7DD3FC]/40 shadow-2xl space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-[#080B10] border border-[#243447] flex items-center justify-center text-[#7DD3FC]">
                <Lock className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-bold text-[#FFFFFF]">Sign in Required for Checkout</h2>
                <p className="text-xs text-[#9CAFC3] leading-relaxed">
                  To protect your orders and guarantee verified delivery across India and the UK, you must be signed in with a 100% complete profile before completing purchase.
                </p>
                <p className="text-[11px] text-emerald-400 font-medium">
                  Your cart items ({itemCount}) are safely preserved.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login?next=/checkout"
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all shadow-lg shadow-[#7DD3FC]/10"
                >
                  Sign In to Continue &rarr;
                </Link>
                <Link
                  href="/signup?next=/checkout"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold hover:border-[#7DD3FC]"
                >
                  Create Customer Account
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
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
                {/* 100% Profile Completion Requirement Card */}
                {profileCompletion && !profileCompletion.isComplete && (
                  <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-800/80 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            100% Profile Completion Mandatory Before Order Placement
                          </div>
                          <div className="text-xs text-[#9CAFC3]">
                            Current profile progress:{" "}
                            <strong className="text-[#FFFFFF]">{profileCompletion.percentage}%</strong>. Checkout is paused until all mandatory dispatch fields are verified.
                          </div>
                        </div>
                      </div>

                      <Link
                        href="/account?complete=1"
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#080B10] font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <span>Complete Profile Now</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[#080B10] border border-[#243447] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-[#7DD3FC] transition-all duration-500"
                        style={{ width: `${profileCompletion.percentage}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-[#9CAFC3]">
                      Missing fields:{" "}
                      <span className="text-amber-300 font-semibold">
                        {profileCompletion.missingFields.join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dynamic Regional Payment Modal (Razorpay for India vs Stripe for UK) */}
                {pendingTestOrder && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="max-w-md w-full rounded-2xl bg-[#0c141e] border border-[#243447] overflow-hidden shadow-2xl space-y-0">
                      {/* Regional Gateway Brand Header */}
                      <div className="bg-[#102A43] p-5 border-b border-[#243447] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#080B10] border border-[#243447] flex items-center justify-center text-[#7DD3FC] font-black text-lg">
                            {market === "IN" ? "₹" : "£"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#FFFFFF]">
                              {market === "IN" ? "Razorpay India Checkout" : "Stripe UK & Global Checkout"}
                            </div>
                            <div className="text-[11px] font-mono text-[#7DD3FC]">
                              Order {pendingTestOrder.orderNumber}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[#9CAFC3] uppercase tracking-wider">Amount Due</div>
                          <div className="text-base font-extrabold text-[#FFFFFF] font-mono">
                            {formatCurrency(total)}
                          </div>
                        </div>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 space-y-5">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/80 text-[11px] text-blue-200">
                          <ShieldCheck className="h-4 w-4 text-[#7DD3FC] shrink-0" />
                          <span>
                            {market === "IN"
                              ? "Razorpay Sandbox Gateway: RBI 2FA Verified Test Mode"
                              : "Stripe Sandbox Gateway: UK FCA & 3DS2 Verified Test Mode"}
                          </span>
                        </div>

                        {/* Selected Method Details */}
                        <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs space-y-3">
                          {market === "IN" ? (
                            <>
                              {selectedPaymentTab === "upi" && (
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#FFFFFF]">Unified Payments Interface (UPI)</div>
                                  <div className="text-[11px] font-mono text-emerald-400">
                                    onestore.auth@okhdfcbank
                                  </div>
                                  <div className="text-[10px] text-[#9CAFC3]">
                                    Instant UPI intent or dynamic QR settlement
                                  </div>
                                </div>
                              )}
                              {selectedPaymentTab === "card" && (
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#FFFFFF]">Indian Debit / Credit Card (RuPay, Visa, MC)</div>
                                  <div className="text-[11px] font-mono text-[#7DD3FC]">4111 •••• •••• 4242 (Expires 12/28 • CVV 123)</div>
                                  <div className="text-[10px] text-[#9CAFC3]">RBI 2FA OTP verification simulation</div>
                                </div>
                              )}
                              {selectedPaymentTab === "netbanking" && (
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#FFFFFF]">NetBanking (HDFC, ICICI, SBI, Axis)</div>
                                  <div className="text-[11px] text-[#9CAFC3]">Instant direct Indian bank settlement</div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {selectedPaymentTab === "card" && (
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#FFFFFF]">UK &amp; Global Card (Visa, Mastercard, Amex)</div>
                                  <div className="text-[11px] font-mono text-[#7DD3FC]">4242 •••• •••• 4242 (Expires 12/28 • CVC 888)</div>
                                  <div className="text-[10px] text-[#9CAFC3]">UK FCA &amp; 3D-Secure 2 authentication verified</div>
                                </div>
                              )}
                              {selectedPaymentTab === "applepay" && (
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#FFFFFF]">Apple Pay / Google Pay (1-Touch Express)</div>
                                  <div className="text-[11px] text-[#7DD3FC]">Biometric TouchID / FaceID Authorization</div>
                                  <div className="text-[10px] text-[#9CAFC3]">Direct GBP debit linked to UK bank account</div>
                                </div>
                              )}
                              {selectedPaymentTab === "klarna" && (
                                <div className="space-y-1">
                                  <div className="font-semibold text-[#FFFFFF]">Klarna — Pay in 3 (0% Interest)</div>
                                  <div className="text-[11px] font-mono text-[#7DD3FC]">
                                    3 monthly instalments of £{(total / 3).toFixed(2)}
                                  </div>
                                  <div className="text-[10px] text-[#9CAFC3]">
                                    £{(total / 3).toFixed(2)} charged today, rest in 30 and 60 days
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-2">
                          <button
                            type="button"
                            onClick={handleCompleteSandboxPayment}
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#080B10] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>
                                  Simulate Successful {market === "IN" ? "Razorpay" : "Stripe"} Payment: Pay {formatCurrency(total)}
                                </span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setPendingTestOrder(null)}
                            className="w-full h-10 rounded-xl bg-[#080B10] hover:bg-[#102A43] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] text-xs font-semibold transition-all"
                          >
                            Cancel Payment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                        disabled
                        value={formData.email}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#080B10]/60 border border-[#243447] text-sm text-[#9CAFC3] cursor-not-allowed"
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

                {/* Section 2: Saved Delivery Address Picker */}
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center text-xs font-mono">
                        2
                      </span>
                      <span>Delivery Destination ({market === "IN" ? "India" : "United Kingdom"})</span>
                    </h2>

                    <Link
                      href="/account?tab=addresses"
                      className="text-xs text-[#7DD3FC] hover:text-[#FFFFFF] flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      <span>Manage Address Book</span>
                    </Link>
                  </div>

                  {/* Saved addresses selector */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#9CAFC3] block">
                        Select from your saved addresses:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr.id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 text-xs relative ${
                                isSelected
                                  ? "bg-[#102A43] border-[#7DD3FC] shadow-md shadow-[#7DD3FC]/10"
                                  : "bg-[#080B10] border-[#243447] hover:border-[#243447]/90"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-bold text-[#FFFFFF]">
                                  {addr.label === "Work" ? (
                                    <Briefcase className="h-3.5 w-3.5 text-[#7DD3FC]" />
                                  ) : (
                                    <Home className="h-3.5 w-3.5 text-[#7DD3FC]" />
                                  )}
                                  <span>{addr.label || "Home"}</span>
                                  {addr.is_default && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#7DD3FC]/20 text-[#7DD3FC]">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected
                                      ? "border-[#7DD3FC] bg-[#7DD3FC] text-[#080B10]"
                                      : "border-[#243447]"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </div>
                              <div className="font-semibold text-[#FFFFFF]">{addr.recipient_name}</div>
                              <div className="text-[#9CAFC3] truncate">{addr.line1}</div>
                              <div className="text-[#9CAFC3]">
                                {addr.city}, {addr.state_or_province} - {addr.postal_code}
                              </div>
                            </div>
                          );
                        })}

                        <div
                          onClick={() => handleSelectSavedAddress("new")}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-semibold ${
                            selectedAddressId === "new"
                              ? "bg-[#102A43] border-[#7DD3FC] text-[#FFFFFF]"
                              : "bg-[#080B10] border-dashed border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Deliver to a New Address</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address input fields */}
                  {(selectedAddressId === "new" || savedAddresses.length === 0) && (
                    <div className="space-y-4 text-xs pt-2">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-[#FFFFFF]">Recipient Full Name *</label>
                        <input
                          type="text"
                          name="recipientName"
                          required
                          value={formData.recipientName}
                          onChange={handleInputChange}
                          placeholder="Full legal recipient name"
                          className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-[#FFFFFF]">
                          Street Address (Line 1: Apartment, House No &amp; Street) *
                        </label>
                        <input
                          type="text"
                          name="line1"
                          required
                          value={formData.line1}
                          onChange={handleInputChange}
                          placeholder="Flat 402, Skyline Residency, Bandra West"
                          className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-[#FFFFFF]">
                          Locality / Landmark (Line 2 - Optional)
                        </label>
                        <input
                          type="text"
                          name="line2"
                          value={formData.line2}
                          onChange={handleInputChange}
                          placeholder="Near Linking Road / Landmark"
                          className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-[#FFFFFF]">City / Town *</label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder={market === "IN" ? "Mumbai" : "London"}
                            className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-[#FFFFFF]">State / Region *</label>
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
                            {market === "IN" ? "PIN Code (6 Digits) *" : "Postcode (UK format) *"}
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            required
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            placeholder={market === "IN" ? "400050" : "SW1A 1AA"}
                            className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] font-mono focus:outline-none focus:border-[#7DD3FC]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Payment Gateway Selector */}
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
                  <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center text-xs font-mono">
                      3
                    </span>
                    <span>Payment Gateway</span>
                  </h2>

                  {market === "IN" ? (
                    <div className="p-5 rounded-xl border border-[#7DD3FC] bg-[#102A43]/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm text-[#FFFFFF]">Razorpay India Gateway</span>
                          <span className="text-[10px] font-bold text-[#7DD3FC] bg-[#7DD3FC]/10 px-2 py-0.5 rounded border border-[#7DD3FC]/30">
                            Active for India (₹ INR)
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#7DD3FC]">INR (₹)</span>
                      </div>
                      <p className="text-xs text-[#9CAFC3] leading-relaxed">
                        Authorized Indian payment gateway supporting UPI (Google Pay, PhonePe, Paytm, BHIM, QR code), Debit/Credit Cards (RuPay, Visa, Mastercard), NetBanking (HDFC, ICICI, SBI, Axis), and 0-Cost EMI.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#7DD3FC]">
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">UPI / QR</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">RuPay &amp; Cards</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">NetBanking</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">0% EMI</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-[#7DD3FC] bg-[#102A43]/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm text-[#FFFFFF]">Stripe UK &amp; Global Gateway</span>
                          <span className="text-[10px] font-bold text-[#7DD3FC] bg-[#7DD3FC]/10 px-2 py-0.5 rounded border border-[#7DD3FC]/30">
                            Active for United Kingdom (£ GBP)
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#7DD3FC]">GBP (£)</span>
                      </div>
                      <p className="text-xs text-[#9CAFC3] leading-relaxed">
                        Authorized UK payment gateway supporting Visa, Mastercard, American Express, Maestro, 1-Touch Apple Pay &amp; Google Pay, and Klarna Pay in 3 (0% interest).
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#7DD3FC]">
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">Cards (Visa, MC, Amex)</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">Apple Pay</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">Google Pay</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#243447]">Klarna Pay in 3</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Order Summary (1 col) */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
                  <h3 className="text-base font-bold text-[#FFFFFF] border-b border-[#243447] pb-3">
                    Items in Cart ({itemCount})
                  </h3>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {items.map((item) => {
                      const itemImage = getCartItemImage(item);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-xs gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-[#080B10] border border-[#243447] flex items-center justify-center shrink-0 overflow-hidden">
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-mono text-xs text-[#7DD3FC] font-bold">1</span>
                              )}
                            </div>
                            <div className="truncate max-w-[140px] sm:max-w-[170px]">
                              <span className="font-bold text-[#FFFFFF] block truncate">{item.productName}</span>
                              {item.variantName && (
                                <span className="text-[11px] text-[#7DD3FC] block truncate">
                                  {item.variantName} × {item.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-mono text-[#FFFFFF] shrink-0">
                            {formatCurrency((market === "IN" ? item.priceInr : item.priceGbp) * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Promo Code Form */}
                  <div className="pt-3 border-t border-[#243447] space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo Code (e.g. LAUNCH10)"
                        className="flex-1 h-10 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono uppercase text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-3.5 h-10 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] text-xs font-semibold hover:border-[#7DD3FC] hover:text-[#FFFFFF] transition-all"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedPromo && (
                      <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="h-3.5 w-3.5" /> Code {appliedPromo.code} applied ({appliedPromo.discountPercent}% off)
                      </div>
                    )}
                    {promoError && (
                      <div className="text-xs text-red-400">{promoError}</div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-[#9CAFC3] pt-4 border-t border-[#243447]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-[#FFFFFF] font-semibold">{formattedSubtotal}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Campaign Discount</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Logistics</span>
                      <span className="text-[#7DD3FC] font-semibold">{formattedShippingFee}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-[#FFFFFF] pt-3 border-t border-[#243447]">
                      <span>Grand Total</span>
                      <span className="text-[#7DD3FC]">{formatCurrency(checkoutGrandTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || (profileCompletion ? !profileCompletion.isComplete : false)}
                    className="w-full h-12 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : profileCompletion && !profileCompletion.isComplete ? (
                      <span>Complete Profile (100%) to Enable Checkout</span>
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
