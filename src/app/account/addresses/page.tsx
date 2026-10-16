"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Home,
  Briefcase,
  Building,
  ArrowLeft,
  X,
  AlertCircle,
  Globe,
} from "lucide-react";
import { validatePostalCode, validatePhoneNumber } from "@/lib/services/profile-validation";
import { CustomDropdown } from "@/components/account/CustomDropdown";
import { RealTimeMapLocator, type ResolvedLocationData } from "@/components/account/RealTimeMapLocator";

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

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newAddr, setNewAddr] = useState({
    label: "Home",
    recipient_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state_or_province: "",
    postal_code: "",
    country_code: "IN" as "IN" | "GB",
    is_default: false,
  });

  const [addrCoordinates, setAddrCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  const handleLocationResolved = (data: ResolvedLocationData) => {
    setAddrCoordinates(data.coordinates);
    setNewAddr((prev) => ({
      ...prev,
      line1: data.street || (data.displayName ? data.displayName.split(",")[0] : prev.line1),
      line2: data.locality || prev.line2,
      city: data.city || prev.city,
      state_or_province: data.state || prev.state_or_province,
      postal_code: data.postalCode || prev.postal_code,
      country_code: data.country || prev.country_code,
    }));
  };

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/account/addresses");
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch("/api/account/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_default: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.id === id,
          }))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const country = newAddr.country_code;
    if (!validatePhoneNumber(newAddr.phone, country)) {
      setErrorMsg(
        country === "IN"
          ? "Please enter a valid 10-digit Indian mobile number."
          : "Please enter a valid UK mobile number."
      );
      return;
    }

    if (!validatePostalCode(newAddr.postal_code, country)) {
      setErrorMsg(
        country === "IN"
          ? "Please enter a valid 6-digit Indian PIN code."
          : "Please enter a valid UK postcode (e.g. SW1A 1AA)."
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddr),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save address");
      }

      setAddresses((prev) => {
        const updated = newAddr.is_default
          ? prev.map((a) => ({ ...a, is_default: false }))
          : prev;
        return [data.address, ...updated];
      });

      setShowAddForm(false);
      setNewAddr({
        label: "Home",
        recipient_name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state_or_province: "",
        postal_code: "",
        country_code: "IN",
        is_default: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving address";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-2 text-xs text-[#9CAFC3]">
          <Link href="/account" className="hover:text-[#FFFFFF] flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Account
          </Link>
          <span>/</span>
          <span className="text-[#FFFFFF]">Delivery Address Book</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#FFFFFF] tracking-tight">Saved Addresses</h1>
            <p className="text-xs text-[#9CAFC3] mt-1">
              Store multiple verified delivery addresses for express dual-market checkout in India &amp; the UK.
            </p>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all flex items-center gap-2 shadow-lg shadow-[#7DD3FC]/10"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Address</span>
            </button>
          )}
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#FFFFFF]">Add Delivery Address</h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[#9CAFC3] hover:text-[#FFFFFF] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Real-Time Map & GPS Locator */}
            <RealTimeMapLocator
              country={newAddr.country_code}
              activeCoordinates={addrCoordinates}
              onLocationResolved={handleLocationResolved}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <CustomDropdown
                id="new-addr-label"
                label="Address Label"
                value={newAddr.label}
                onChange={(val) => setNewAddr({ ...newAddr, label: val })}
                options={[
                  {
                    value: "Home",
                    label: "Home",
                    subtitle: "Primary residence / Personal",
                    icon: <Home className="h-3.5 w-3.5 text-[#7DD3FC]" />,
                  },
                  {
                    value: "Work",
                    label: "Work / Office",
                    subtitle: "Corporate / Business hours delivery",
                    icon: <Briefcase className="h-3.5 w-3.5 text-[#7DD3FC]" />,
                  },
                  {
                    value: "Other",
                    label: "Other",
                    subtitle: "Alternate location",
                    icon: <Building className="h-3.5 w-3.5 text-[#7DD3FC]" />,
                  },
                ]}
                placeholder="Select address label"
              />

              <CustomDropdown
                id="new-addr-country"
                label="Country / Market"
                value={newAddr.country_code}
                onChange={(val) =>
                  setNewAddr({ ...newAddr, country_code: val as "IN" | "GB" })
                }
                options={[
                  {
                    value: "IN",
                    label: "India",
                    subtitle: "₹ INR • Express domestic delivery",
                    badge: "₹ INR",
                    icon: <Globe className="h-3.5 w-3.5 text-[#7DD3FC]" />,
                  },
                  {
                    value: "GB",
                    label: "United Kingdom",
                    subtitle: "£ GBP • Royal Mail Tracked dispatch",
                    badge: "£ GBP",
                    icon: <Globe className="h-3.5 w-3.5 text-[#7DD3FC]" />,
                  },
                ]}
                placeholder="Select destination country"
              />

              <div>
                <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  value={newAddr.recipient_name}
                  onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })}
                  placeholder="Full recipient name"
                  className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div>
                <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  placeholder={newAddr.country_code === "IN" ? "+91 98765 43210" : "+44 7911 123456"}
                  className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                  Street Address (Line 1: Apartment, Flat, House No &amp; Street)
                </label>
                <input
                  type="text"
                  required
                  value={newAddr.line1}
                  onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                  placeholder="Flat 402, Skyline Residency, Bandra West"
                  className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                  Locality / Landmark (Line 2 - Optional)
                </label>
                <input
                  type="text"
                  value={newAddr.line2 || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                  placeholder="Near Linking Road / Landmark"
                  className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div>
                <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  required
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  placeholder={newAddr.country_code === "IN" ? "Mumbai" : "London"}
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
                  value={newAddr.state_or_province}
                  onChange={(e) => setNewAddr({ ...newAddr, state_or_province: e.target.value })}
                  placeholder={newAddr.country_code === "IN" ? "Maharashtra" : "Greater London"}
                  className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div>
                <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                  {newAddr.country_code === "IN" ? "PIN Code (6 Digits)" : "Postcode (UK format)"}
                </label>
                <input
                  type="text"
                  required
                  value={newAddr.postal_code}
                  onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                  placeholder={newAddr.country_code === "IN" ? "400050" : "SW1A 1AA"}
                  className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#9CAFC3]">
                  <input
                    type="checkbox"
                    checked={newAddr.is_default}
                    onChange={(e) => setNewAddr({ ...newAddr, is_default: e.target.checked })}
                    className="h-4 w-4 rounded border-[#243447] bg-[#080B10] text-[#7DD3FC]"
                  />
                  <span>Set as primary default address</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-[#080B10] text-[#9CAFC3] hover:text-[#FFFFFF] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] hover:bg-[#FFFFFF] text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Address"}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#9CAFC3]">Loading address book...</div>
        ) : addresses.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#102A43]/20 border border-dashed border-[#243447] text-center space-y-3">
            <MapPin className="h-10 w-10 text-[#9CAFC3] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#FFFFFF]">No saved addresses found</h3>
            <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto">
              You haven't saved any delivery addresses yet. Add one to enable 100% profile completion and express checkout.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-5 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs"
            >
              Add First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 relative ${
                  addr.is_default
                    ? "bg-[#102A43]/50 border-[#7DD3FC]/50 shadow-md shadow-[#7DD3FC]/5"
                    : "bg-[#102A43]/20 border-[#243447] hover:border-[#243447]/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#080B10] border border-[#243447] text-[#7DD3FC]">
                      {addr.label === "Work" ? (
                        <Briefcase className="h-3.5 w-3.5" />
                      ) : (
                        <Home className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span className="text-xs font-bold text-[#FFFFFF]">{addr.label || "Home"}</span>
                    {addr.is_default && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#7DD3FC]/20 text-[#7DD3FC] border border-[#7DD3FC]/40">
                        Default Address
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-red-400 hover:text-red-300 text-xs p-1"
                    title="Delete address"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-xs space-y-1 text-[#9CAFC3]">
                  <div className="font-semibold text-[#FFFFFF]">{addr.recipient_name}</div>
                  <div>{addr.line1}</div>
                  {addr.line2 && <div>{addr.line2}</div>}
                  <div>
                    {addr.city}, {addr.state_or_province} - {addr.postal_code}
                  </div>
                  <div className="text-[#FFFFFF] mt-1 font-mono">{addr.phone}</div>
                  <div className="text-[10px] text-[#7DD3FC]">
                    {addr.country_code === "GB" ? "United Kingdom (£)" : "India (₹)"}
                  </div>
                </div>

                {!addr.is_default && (
                  <div className="pt-2 border-t border-[#243447]/60">
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] text-[#7DD3FC] hover:text-[#FFFFFF] font-semibold"
                    >
                      Set as primary default address
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
