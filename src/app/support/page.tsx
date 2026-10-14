"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Headphones, Mail, HelpCircle, Send, CheckCircle2 } from "lucide-react";

export default function SupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "Order Tracking",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-2 border-b border-[#243447] pb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              Concierge Assistance
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              One Store Customer Support
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3] max-w-lg mx-auto">
              Our dedicated support team in India &amp; the United Kingdom is here to assist with
              inquiries, orders, and warranty requests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-6 shadow-xl">
              <h2 className="text-lg font-bold text-[#FFFFFF]">Send an Inquiry</h2>

              {submitted ? (
                <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-[#FFFFFF]">Message Dispatched</h3>
                  <p className="text-xs text-[#9CAFC3]">
                    Thank you, {form.name}. A customer service representative will respond to{" "}
                    <strong className="text-[#FFFFFF]">{form.email}</strong> within 12 business
                    hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#102A43] text-[#7DD3FC] text-xs font-semibold"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Arjun Taneja"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
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
                      className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Order Number (Optional)</label>
                    <input
                      type="text"
                      value={form.orderNumber}
                      onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                      placeholder="e.g. OS-2026-IN-XXXX"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#FFFFFF] font-semibold">Inquiry Subject *</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                    >
                      <option value="Order Tracking">Order Tracking &amp; Delivery</option>
                      <option value="Return / Refund">Return or Refund Request</option>
                      <option value="Warranty Claim">1-Year Warranty Claim</option>
                      <option value="Product Specification">Product Technical Question</option>
                      <option value="General">Other Inquiry</option>
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
                      className="w-full p-3 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10"
                  >
                    <Send className="h-4 w-4" /> Dispatch Inquiry
                  </button>
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
                    a: "Once dispatched, you will receive an SMS and email notification with your tracking number (Blue Dart / Delhivery in India, Royal Mail / DPD in the UK). You can track it anytime on our Order Tracking portal.",
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
