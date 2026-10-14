"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  LogOut,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import { signOutUser } from "@/lib/services/auth";

export interface ProfileData {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string | null;
  is_email_verified: boolean;
  phone: string | null;
  country: string | null;
  preferred_currency: string | null;
  role: string | null;
  marketing_consent: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  currency: string;
  total_amount: number;
  created_at: string;
}

export interface AddressItem {
  id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state_or_province: string;
  postal_code: string;
  country_code: string;
  is_default: boolean;
}

interface UserProfileClientProps {
  initialProfile: ProfileData;
  initialOrders: OrderItem[];
  initialAddresses: AddressItem[];
  isAdmin: boolean;
}

export function UserProfileClient({
  initialProfile,
  initialOrders,
  initialAddresses,
  isAdmin,
}: UserProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "settings">("orders");

  // Profile Form State
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [preferredCurrency, setPreferredCurrency] = useState(initialProfile.preferred_currency || "INR");
  const [marketingConsent, setMarketingConsent] = useState(initialProfile.marketing_consent || false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Address State
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressErrorMsg, setAddressErrorMsg] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    recipient_name: initialProfile.full_name || "",
    phone: initialProfile.phone || "",
    line1: "",
    line2: "",
    city: "",
    state_or_province: "",
    postal_code: "",
    country_code: preferredCurrency === "GBP" ? "GB" : "IN",
    is_default: addresses.length === 0,
  });

  const handleSignOut = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          preferred_currency: preferredCurrency,
          country: preferredCurrency === "GBP" ? "GB" : "IN",
          marketing_consent: marketingConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileSuccessMsg("Your profile has been updated successfully!");
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving profile";
      setProfileErrorMsg(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setAddressErrorMsg(null);

    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to save address");
      }

      setAddresses((prev) => [data.address, ...prev]);
      setIsAddingAddress(false);
      setNewAddress({
        recipient_name: fullName,
        phone: phone,
        line1: "",
        line2: "",
        city: "",
        state_or_province: "",
        postal_code: "",
        country_code: preferredCurrency === "GBP" ? "GB" : "IN",
        is_default: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving address";
      setAddressErrorMsg(msg);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // Ignore network hiccup
    }
  };

  const displayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const nameOrEmail = fullName || initialProfile.email?.split("@")[0] || "Shopper";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 1. Welcoming Hero Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-[#102A43]/70 via-[#102A43]/40 to-[#080B10] border border-[#243447] shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
              {nameOrEmail.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs text-[#7DD3FC] font-semibold uppercase tracking-wider">
                  {displayGreeting()},
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#7DD3FC] text-[#080B10] shadow-sm">
                    <Sparkles className="h-3 w-3" /> System Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Verified Member
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                {fullName || initialProfile.email}
              </h1>
              <p className="text-xs text-[#9CAFC3] flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[#FFFFFF]">
                  <Mail className="h-3.5 w-3.5 text-[#7DD3FC]" /> {initialProfile.email}
                </span>
                <span>•</span>
                <span>Dual-Market Member: India (₹) &amp; UK (£)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#7DD3FC]/10"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#080B10] hover:bg-red-950/50 text-[#9CAFC3] hover:text-red-300 border border-[#243447] hover:border-red-800/60 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#102A43]/30 border border-[#243447] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#9CAFC3]">Total Orders</div>
            <div className="text-2xl font-bold text-[#FFFFFF] mt-1">{initialOrders.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#102A43]/30 border border-[#243447] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#9CAFC3]">Saved Addresses</div>
            <div className="text-2xl font-bold text-[#FFFFFF] mt-1">{addresses.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#102A43]/30 border border-[#243447] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#9CAFC3]">Preferred Market</div>
            <div className="text-sm font-bold text-[#7DD3FC] mt-1">
              {preferredCurrency === "GBP" ? "United Kingdom (£ GBP)" : "India (₹ INR)"}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Tabbed Navigation */}
      <div className="flex items-center gap-2 border-b border-[#243447] pb-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-[#7DD3FC] text-[#080B10] shadow-sm"
              : "text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>My Orders ({initialOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("addresses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "addresses"
              ? "bg-[#7DD3FC] text-[#080B10] shadow-sm"
              : "text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]"
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Saved Addresses ({addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "settings"
              ? "bg-[#7DD3FC] text-[#080B10] shadow-sm"
              : "text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile &amp; Preferences</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {/* TAB 1: Orders */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {initialOrders.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#102A43]/20 border border-[#243447] text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center">
                <Package className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-[#FFFFFF]">No orders placed yet</h3>
                <p className="text-xs text-[#9CAFC3] leading-relaxed">
                  You haven't made any purchases yet. Explore our curated selection of flagship audio gear, everyday carry, and chronographs designed for dual-market delivery in India &amp; the UK.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all shadow-lg shadow-[#7DD3FC]/10"
                >
                  <span>Explore Catalogue</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#243447] bg-[#102A43]/30">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#243447] text-[#9CAFC3] uppercase tracking-wider font-semibold">
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243447]/60">
                  {initialOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#102A43]/40">
                      <td className="p-4 font-mono font-bold text-[#7DD3FC]">
                        {order.order_number}
                      </td>
                      <td className="p-4 text-[#9CAFC3]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-emerald-400 font-semibold">
                        {order.payment_status}
                      </td>
                      <td className="p-4 font-bold text-[#FFFFFF]">
                        {order.currency === "GBP" ? "£" : "₹"}
                        {order.total_amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Addresses */}
      {activeTab === "addresses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#FFFFFF]">Saved Shipping Addresses</h2>
              <p className="text-xs text-[#9CAFC3]">
                Manage dispatch destinations for seamless India &amp; UK checkout.
              </p>
            </div>
            {!isAddingAddress && (
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {isAddingAddress && (
            <form
              onSubmit={handleAddAddress}
              className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4"
            >
              <h3 className="text-sm font-bold text-[#FFFFFF]">Add New Delivery Address</h3>

              {addressErrorMsg && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
                  {addressErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.recipient_name}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, recipient_name: e.target.value })
                    }
                    placeholder="Full recipient name"
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    placeholder="+91 or +44 number"
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Street Address (Line 1)
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    placeholder="Flat / Building / Street"
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="e.g. Mumbai, London"
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.state_or_province}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, state_or_province: e.target.value })
                    }
                    placeholder="e.g. Maharashtra, Greater London"
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Postal Code (PIN / Postcode)
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.postal_code}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, postal_code: e.target.value })
                    }
                    placeholder="e.g. 400001 or SW1A 1AA"
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Country
                  </label>
                  <select
                    value={newAddress.country_code}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, country_code: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  >
                    <option value="IN">India (₹ INR)</option>
                    <option value="GB">United Kingdom (£ GBP)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9CAFC3] hover:text-[#FFFFFF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-4 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all disabled:opacity-50"
                >
                  {isSavingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 && !isAddingAddress ? (
            <div className="p-8 rounded-2xl bg-[#102A43]/20 border border-[#243447] text-center space-y-3">
              <MapPin className="h-8 w-8 mx-auto text-[#7DD3FC]" />
              <p className="text-xs text-[#9CAFC3]">No shipping addresses registered yet.</p>
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="text-xs font-semibold text-[#7DD3FC] hover:underline"
              >
                + Add your primary delivery address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-5 rounded-2xl bg-[#102A43]/30 border border-[#243447] flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-[#FFFFFF]">{addr.recipient_name}</div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
                        {addr.country_code === "GB" ? "United Kingdom" : "India"}
                      </span>
                    </div>
                    <div className="text-xs text-[#9CAFC3] mt-2 space-y-0.5">
                      <div>{addr.line1}</div>
                      {addr.line2 && <div>{addr.line2}</div>}
                      <div>
                        {addr.city}, {addr.state_or_province} - {addr.postal_code}
                      </div>
                      <div className="text-[#FFFFFF] mt-1 font-mono">{addr.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#243447]/60 text-xs">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ready for dispatch
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Profile Settings */}
      {activeTab === "settings" && (
        <form
          onSubmit={handleSaveProfile}
          className="p-8 rounded-2xl bg-[#102A43]/30 border border-[#243447] space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold text-[#FFFFFF]">Account Profile &amp; Preferences</h2>
            <p className="text-xs text-[#9CAFC3]">
              Update your canonical contact details and preferred checkout market.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Full Legal Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arjun Taneja"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Email Address (Verified)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={initialProfile.email || ""}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10]/60 border border-[#243447] text-[#9CAFC3] cursor-not-allowed"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Contact Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or +44 7911 123456"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>

            {/* Preferred Currency */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Default Shopping Market
              </label>
              <div className="relative">
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                >
                  <option value="INR">India (₹ INR - Razorpay &amp; UPI Checkout)</option>
                  <option value="GBP">United Kingdom (£ GBP - Stripe Checkout)</option>
                </select>
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>
          </div>

          {/* Marketing consent */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#9CAFC3]">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#243447] bg-[#080B10] text-[#7DD3FC] focus:ring-0"
              />
              <span>
                Receive notifications regarding exclusive flagship releases and dual-market promotions.
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#243447]/60">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all disabled:opacity-50 shadow-md shadow-[#7DD3FC]/10"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingProfile ? "Saving changes..." : "Save Profile Details"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
