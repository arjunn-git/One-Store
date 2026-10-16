"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Headphones, Mail, HelpCircle, Send, CheckCircle2, AlertCircle, RefreshCw, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "Order Tracking",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<{
    ticketId: string;
    deliveredTo: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Unable to dispatch inquiry. Please try again or email us directly.");
        return;
      }

      setTicketInfo({
        ticketId: data.ticketId || `TKT-${Date.now().toString(36).toUpperCase()}`,
        deliveredTo: data.deliveredTo || "onestore.auth@gmail.com",
      });
      setSubmitted(true);
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Network error while submitting. Please verify your connection or email onestore.auth@gmail.com directly.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-3 border-b border-[#243447] pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102A43] border border-[#7DD3FC]/40 text-xs font-semibold text-[#7DD3FC]">
              <Headphones className="h-3.5 w-3.5" />
              <span>Direct Concierge Assistance</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              One Store Customer Support
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3] max-w-xl mx-auto leading-relaxed">
              Our concierge team in India &amp; the United Kingdom is active to assist with
              orders, tracking, delivery status, and warranty requests.
            </p>

            {/* Direct Email Channel Banner */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs">
              <span className="text-[#9CAFC3]">Dedicated Email Inbox:</span>
              <a
                href="mailto:onestore.auth@gmail.com"
                className="font-mono font-bold text-[#7DD3FC] hover:underline flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>onestore.auth@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#243447]/60 pb-3">
                <h2 className="text-lg font-bold text-[#FFFFFF]">Send an Inquiry</h2>
                <span className="text-[10px] font-mono text-[#7DD3FC] bg-[#102A43] px-2 py-0.5 rounded border border-[#243447]">
                  Active Inbox: onestore.auth@gmail.com
                </span>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-[#0c141e] border border-emerald-500/50 text-center space-y-4 shadow-2xl animate-in fade-in duration-200">
                  <div className="h-14 w-14 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                      Dispatched Successfully
                    </span>
                    <h3 className="text-lg font-black text-[#FFFFFF] mt-0.5">
                      Support Ticket {ticketInfo?.ticketId}
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#9CAFC3] space-y-2 text-left">
                    <div className="flex justify-between">
                      <span>Recipient Inbox:</span>
                      <strong className="font-mono text-[#7DD3FC]">{ticketInfo?.deliveredTo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sender:</span>
                      <span className="text-[#FFFFFF]">{form.name} ({form.email})</span>
                    </div>
                    {form.orderNumber && (
                      <div className="flex justify-between">
                        <span>Order Reference:</span>
                        <span className="font-mono text-[#7DD3FC]">{form.orderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Inquiry Category:</span>
                      <span className="text-[#FFFFFF] font-medium">{form.subject}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#9CAFC3] leading-relaxed">
                    Thank you, <strong className="text-[#FFFFFF]">{form.name}</strong>. Your inquiry has been routed directly to{" "}
                    <strong className="font-mono text-[#7DD3FC]">{ticketInfo?.deliveredTo}</strong>. A support specialist will review your details and respond to{" "}
                    <strong className="text-[#FFFFFF]">{form.email}</strong> within 12 business hours.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setForm({
                          name: "",
                          email: "",
                          orderNumber: "",
                          subject: "Order Tracking",
                          message: "",
                        });
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC] text-xs font-semibold transition-all"
                    >
                      Send Another Inquiry
                    </button>
                    <Link
                      href="/orders"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#7DD3FC] text-[#080B10] text-xs font-bold hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Track an Order</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Alex Sharma"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Order Number (Optional)</label>
                    <input
                      type="text"
                      value={form.orderNumber}
                      onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                      placeholder="e.g. OS-2026-IN-XXXX"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Inquiry Subject *</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                    >
                      <option value="Order Tracking">Order Tracking &amp; Delivery</option>
                      <option value="Return / Refund">Return or Refund Request</option>
                      <option value="Warranty Claim">1-Year Warranty Claim</option>
                      <option value="Product Technical Question">Product Technical Question</option>
                      <option value="Payment / Billing Inquiry">Payment / Billing Inquiry</option>
                      <option value="General Concierge Assistance">Other Inquiry</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Your Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your inquiry in detail..."
                      className="w-full p-3 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Dispatching to onestore.auth@gmail.com...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Dispatch Inquiry to Support</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#9CAFC3] text-center pt-1">
                    <Clock className="h-3.5 w-3.5 text-[#7DD3FC]" />
                    <span>Average reply time: Under 12 business hours</span>
                  </div>
                </form>
              )}
            </div>

            {/* Frequently Asked Questions */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-[#FFFFFF]">Frequently Asked Questions</h2>

              <div className="space-y-4">
                {[
                  {
                    q: "How do I track my delivery in India or the UK?",
                    a: "Once dispatched, you will receive an SMS and email notification with your tracking number (Blue Dart / Delhivery in India, Royal Mail / DPD in the UK). You can also track your shipment live on our Order Tracking portal with your OS-2026 reference.",
                  },
                  {
                    q: "Where does my support inquiry go?",
                    a: "Every customer support message is delivered directly to our active support mailbox at onestore.auth@gmail.com and logged in our real-time concierge dashboard.",
                  },
                  {
                    q: "Are customs duties and taxes included in my payment?",
                    a: "Yes. All prices displayed in INR (₹) and GBP (£) are fully inclusive of all applicable VAT, GST, and import duties. You will never be asked to pay additional charges upon delivery.",
                  },
                  {
                    q: "How does the 14-day return process work?",
                    a: "Simply request a return through your account or order history page within 14 days of delivery. We will issue a prepaid return shipping label and credit your original payment method upon receipt.",
                  },
                  {
                    q: "What does the 1-year warranty cover?",
                    a: "Our warranty covers all manufacturing defects, internal component failures, and hardware performance issues. It does not cover accidental water damage or severe physical abuse.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-[#102A43]/20 border border-[#243447] space-y-1.5">
                    <h3 className="text-sm font-bold text-[#FFFFFF]">{item.q}</h3>
                    <p className="text-xs text-[#9CAFC3] leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>

              {/* Direct Support Contact Card */}
              <div className="p-5 rounded-2xl bg-[#080B10] border border-[#243447] space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-[#FFFFFF]">
                  <Mail className="h-4 w-4 text-[#7DD3FC]" />
                  <span>Direct Escalations</span>
                </div>
                <p className="text-xs text-[#9CAFC3] leading-relaxed">
                  For urgent warranty claims or bulk corporate inquiries, you can also email us directly at:
                </p>
                <a
                  href="mailto:onestore.auth@gmail.com?subject=Customer%20Support%20Urgent%20Inquiry"
                  className="inline-block px-4 py-2 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40 text-xs font-mono font-bold hover:bg-[#7DD3FC] hover:text-[#080B10] transition-all"
                >
                  onestore.auth@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
