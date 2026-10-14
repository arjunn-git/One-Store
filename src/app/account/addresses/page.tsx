"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { MapPin, Plus, Trash2, CheckCircle2, Home } from "lucide-react";

interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  countryCode: "IN" | "GB";
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: "addr_01",
      recipientName: "Arjun Taneja",
      phone: "+91 98765 43210",
      line1: "Flat 402, Skyline Residency, Bandra West",
      line2: "Near Linking Road",
      city: "Mumbai",
      stateOrProvince: "Maharashtra",
      postalCode: "400050",
      countryCode: "IN",
      isDefault: true,
    },
    {
      id: "addr_02",
      recipientName: "Arjun Taneja",
      phone: "+44 7911 123456",
      line1: "24 Kensington High Street",
      city: "London",
      stateOrProvince: "Greater London",
      postalCode: "W8 4PT",
      countryCode: "GB",
      isDefault: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    stateOrProvince: "",
    postalCode: "",
    countryCode: "IN" as "IN" | "GB",
  });

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.recipientName || !newAddr.line1 || !newAddr.postalCode) return;

    const created: SavedAddress = {
      id: `addr_${Date.now()}`,
      ...newAddr,
      isDefault: addresses.length === 0,
    };

    setAddresses([...addresses, created]);
    setShowAddForm(false);
    setNewAddr({
      recipientName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",
      countryCode: "IN",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="border-b border-[#243447] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-semibold uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5" />
                <span>Logistics Preferences</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Saved Address Book
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/account" className="text-xs text-[#9CAFC3] hover:text-[#FFFFFF]">
                ← Back to Account
              </Link>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all flex items-center gap-1.5 shadow-lg shadow-[#7DD3FC]/10"
              >
                <Plus className="h-4 w-4" /> Add Address
              </button>
            </div>
          </div>

          {/* Add Address Form Accordion */}
          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="p-6 rounded-2xl bg-[#102A43]/50 border border-[#7DD3FC]/60 space-y-4 shadow-xl"
            >
              <h3 className="text-sm font-bold text-[#FFFFFF]">New Shipping Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#9CAFC3]">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={newAddr.recipientName}
                    onChange={(e) => setNewAddr({ ...newAddr, recipientName: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#9CAFC3]">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[#9CAFC3]">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={newAddr.line1}
                    onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#9CAFC3]">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#9CAFC3]">State / Region *</label>
                  <input
                    type="text"
                    required
                    value={newAddr.stateOrProvince}
                    onChange={(e) => setNewAddr({ ...newAddr, stateOrProvince: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#9CAFC3]">PIN / Postcode *</label>
                  <input
                    type="text"
                    required
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#9CAFC3]">Country *</label>
                  <select
                    value={newAddr.countryCode}
                    onChange={(e) =>
                      setNewAddr({ ...newAddr, countryCode: e.target.value as "IN" | "GB" })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF]"
                  >
                    <option value="IN">🇮🇳 India (IN)</option>
                    <option value="GB">🇬🇧 United Kingdom (GB)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-[#102A43] text-[#9CAFC3] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] text-xs font-semibold hover:bg-[#FFFFFF]"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                  addr.isDefault
                    ? "bg-[#102A43]/50 border-[#7DD3FC]"
                    : "bg-[#102A43]/20 border-[#243447]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
                      {addr.countryCode === "IN" ? "🇮🇳 India Destination" : "🇬🇧 UK Destination"}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#080B10] bg-[#7DD3FC] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Default Shipping Address
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#FFFFFF]">{addr.recipientName}</h3>
                  <div className="text-xs text-[#9CAFC3] mt-2 space-y-0.5 leading-relaxed">
                    <div>{addr.line1}</div>
                    {addr.line2 && <div>{addr.line2}</div>}
                    <div>
                      {addr.city}, {addr.stateOrProvince} — {addr.postalCode}
                    </div>
                    <div className="font-mono text-[#FFFFFF] pt-1">Phone: {addr.phone}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#243447]/60 flex items-center justify-between text-xs">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[#7DD3FC] font-semibold hover:underline"
                    >
                      Make Default
                    </button>
                  ) : (
                    <span className="text-[#9CAFC3]">Primary Dispatch Target</span>
                  )}

                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-[#9CAFC3] hover:text-red-400 p-1 transition-colors"
                    title="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
