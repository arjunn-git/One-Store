"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Edit2,
  Save,
  ArrowRight,
  AlertCircle,
  Clock,
  Home,
  Briefcase,
  Building,
  Check,
  X,
} from "lucide-react";
import { signOutUser } from "@/lib/services/auth";
import {
  calculateProfileCompletion,
  validatePostalCode,
  validatePhoneNumber,
  type ProfileValidationResult,
} from "@/lib/services/profile-validation";

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
  apartment_unit?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  delivery_instructions?: string | null;
  is_profile_complete?: boolean;
  profile_completion_percentage?: number;
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
  label?: string | null;
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
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get("tab") === "settings" || searchParams.get("complete") === "1"
    ? "settings"
    : searchParams.get("tab") === "addresses"
    ? "addresses"
    : "orders";

  const nextCheckout = searchParams.get("next") || (searchParams.get("complete") === "1" ? "/checkout" : null);

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "settings">(initialTab);

  // Profile Form State
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [country, setCountry] = useState(initialProfile.country || "IN");
  const [preferredCurrency, setPreferredCurrency] = useState(initialProfile.preferred_currency || "INR");
  const [apartmentUnit, setApartmentUnit] = useState(initialProfile.apartment_unit || "");
  const [streetAddress, setStreetAddress] = useState(initialProfile.street_address || "");
  const [city, setCity] = useState(initialProfile.city || "");
  const [stateOrProvince, setStateOrProvince] = useState(initialProfile.state_or_province || "");
  const [postalCode, setPostalCode] = useState(initialProfile.postal_code || "");
  const [deliveryInstructions, setDeliveryInstructions] = useState(initialProfile.delivery_instructions || "");
  const [marketingConsent, setMarketingConsent] = useState(initialProfile.marketing_consent || false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile?.full_name) {
      try {
        localStorage.setItem("one_store_user_name", initialProfile.full_name);
        window.dispatchEvent(
          new CustomEvent("user_profile_updated", { detail: { full_name: initialProfile.full_name } })
        );
      } catch {
        // Ignore
      }
    }
  }, [initialProfile?.full_name]);

  // Address State
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressErrorMsg, setAddressErrorMsg] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState({
    label: "Home",
    recipient_name: initialProfile.full_name || "",
    phone: initialProfile.phone || "",
    line1: "",
    line2: "",
    city: "",
    state_or_province: "",
    postal_code: "",
    country_code: country === "GB" ? "GB" : "IN",
    is_default: addresses.length === 0,
  });

  // Dynamic Profile Completion Calculation
  const completion: ProfileValidationResult = useMemo(() => {
    return calculateProfileCompletion(
      {
        full_name: fullName,
        email: profile.email,
        is_email_verified: profile.is_email_verified,
        phone,
        country,
        apartment_unit: apartmentUnit,
        street_address: streetAddress,
        city,
        state_or_province: stateOrProvince,
        postal_code: postalCode,
      },
      addresses
    );
  }, [
    fullName,
    profile.email,
    profile.is_email_verified,
    phone,
    country,
    apartmentUnit,
    streetAddress,
    city,
    stateOrProvince,
    postalCode,
    addresses,
  ]);

  const handleSignOut = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const targetCountry: "IN" | "GB" = country === "GB" ? "GB" : "IN";

    // Country-specific validations
    if (phone && !validatePhoneNumber(phone, targetCountry)) {
      setIsSavingProfile(false);
      setProfileErrorMsg(
        targetCountry === "IN"
          ? "Please enter a valid 10-digit Indian mobile number."
          : "Please enter a valid UK mobile number."
      );
      return;
    }

    if (postalCode && !validatePostalCode(postalCode, targetCountry)) {
      setIsSavingProfile(false);
      setProfileErrorMsg(
        targetCountry === "IN"
          ? "Please enter a valid 6-digit Indian PIN code."
          : "Please enter a valid UK postcode (e.g. SW1A 1AA)."
      );
      return;
    }

    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          preferred_currency: preferredCurrency,
          country: targetCountry,
          apartment_unit: apartmentUnit.trim(),
          street_address: streetAddress.trim(),
          city: city.trim(),
          state_or_province: stateOrProvince.trim(),
          postal_code: postalCode.trim().toUpperCase(),
          delivery_instructions: deliveryInstructions.trim(),
          marketing_consent: marketingConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfile(data.profile);
      if (data.profile?.full_name) {
        try {
          localStorage.setItem("one_store_user_name", data.profile.full_name);
          window.dispatchEvent(
            new CustomEvent("user_profile_updated", { detail: { full_name: data.profile.full_name } })
          );
        } catch {
          // Ignore
        }
      }
      setProfileSuccessMsg("Your complete profile has been permanently saved!");

      // If came from checkout and profile is now 100%, offer immediate redirect
      if (nextCheckout && data.completion?.isComplete) {
        setTimeout(() => {
          router.push(nextCheckout);
        }, 1200);
      } else {
        setTimeout(() => setProfileSuccessMsg(null), 5000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving profile";
      setProfileErrorMsg(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: "Home",
      recipient_name: fullName || "",
      phone: phone || "",
      line1: apartmentUnit ? `${apartmentUnit}, ${streetAddress}` : streetAddress || "",
      line2: "",
      city: city || "",
      state_or_province: stateOrProvince || "",
      postal_code: postalCode || "",
      country_code: country === "GB" ? "GB" : "IN",
      is_default: addresses.length === 0,
    });
    setIsAddingAddress(true);
  };

  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || "Home",
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      state_or_province: addr.state_or_province,
      postal_code: addr.postal_code,
      country_code: addr.country_code,
      is_default: addr.is_default,
    });
    setIsAddingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setAddressErrorMsg(null);

    const isEdit = !!editingAddressId;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch("/api/account/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: editingAddressId } : {}),
          ...addressForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to save address");
      }

      if (isEdit) {
        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingAddressId) return data.address;
            if (addressForm.is_default) return { ...a, is_default: false };
            return a;
          })
        );
      } else {
        setAddresses((prev) => {
          const updated = addressForm.is_default
            ? prev.map((a) => ({ ...a, is_default: false }))
            : prev;
          return [data.address, ...updated];
        });
      }

      setIsAddingAddress(false);
      setEditingAddressId(null);
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

  const handleSetDefaultAddress = async (id: string) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;
    try {
      const res = await fetch("/api/account/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          is_default: true,
        }),
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

  const displayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const nameOrEmail = fullName || profile.email?.split("@")[0] || "Shopper";

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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Verified Member
                </span>
                {completion.isComplete ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30">
                    <ShieldCheck className="h-3 w-3" /> Profile 100% Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                    <AlertCircle className="h-3 w-3 text-amber-400" /> Profile {completion.percentage}% Complete
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                {fullName || profile.email}
              </h1>
              <p className="text-xs text-[#9CAFC3] flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[#FFFFFF]">
                  <Mail className="h-3.5 w-3.5 text-[#7DD3FC]" /> {profile.email}
                </span>
                <span>•</span>
                <span>Dual-Market Member: India (₹) &amp; UK (£)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {nextCheckout && (
              <Link
                href={nextCheckout}
                className="px-4 py-2.5 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#7DD3FC]/10"
              >
                <span>Continue to Checkout</span>
                <ArrowRight className="h-4 w-4" />
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

      {/* 2. Mandatory Profile Completion Progress Widget */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          completion.isComplete
            ? "bg-emerald-950/20 border-emerald-800/60"
            : "bg-amber-950/20 border-amber-800/60"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
                Profile Completion Status
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  completion.isComplete
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {completion.percentage}% Complete
              </span>
            </div>
            <p className="text-xs text-[#9CAFC3]">
              {completion.isComplete
                ? "Your customer profile is 100% verified. You have full access to express checkout, dual-market shipping, and saved orders."
                : `100% complete profile is mandatory before placing orders or initiating payments. Missing: ${completion.missingFields.join(", ")}.`}
            </p>
          </div>

          {!completion.isComplete && activeTab !== "settings" && (
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#080B10] text-xs font-bold flex items-center gap-2 transition-all shrink-0"
            >
              <span>Complete Your Profile</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full h-2 rounded-full bg-[#080B10] border border-[#243447] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completion.isComplete ? "bg-emerald-400" : "bg-gradient-to-r from-amber-500 to-[#7DD3FC]"
            }`}
            style={{ width: `${completion.percentage}%` }}
          />
        </div>

        {/* Missing / Required Fields Checklist */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#243447]/60">
          {completion.checklist.map((item) => (
            <div
              key={item.id}
              className={`p-2 rounded-lg text-[11px] flex items-center gap-2 border ${
                item.completed
                  ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-300"
                  : "bg-[#080B10] border-[#243447] text-[#9CAFC3]"
              }`}
            >
              {item.completed ? (
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Key Metrics Overview */}
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
              {country === "GB" ? "United Kingdom (£ GBP)" : "India (₹ INR)"}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 4. Tabbed Navigation */}
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
          <span>Profile &amp; Delivery Details</span>
          {!completion.isComplete && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* 5. Tab Content */}
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
                  You haven't made any purchases yet. Complete your profile to enable express checkout across India and the UK.
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
                  <tr className="border-b border-[#243447] text-[#9CAFC3] bg-[#080B10]/40 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243447]">
                  {initialOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#102A43]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#FFFFFF]">
                        {ord.order_number}
                      </td>
                      <td className="py-3.5 px-4 text-[#9CAFC3]">
                        {new Date(ord.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#7DD3FC]">
                        {ord.currency === "GBP" ? "£" : "₹"}
                        {Number(ord.total_amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            ord.payment_status === "succeeded" || ord.payment_status === "paid"
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                              : "bg-amber-950/80 text-amber-300 border border-amber-800"
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
                          {ord.status}
                        </span>
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
              <h2 className="text-lg font-bold text-[#FFFFFF]">Address Book</h2>
              <p className="text-xs text-[#9CAFC3]">
                Manage saved dispatch addresses for instant pre-fill during checkout.
              </p>
            </div>
            {!isAddingAddress && (
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {isAddingAddress && (
            <form
              onSubmit={handleSaveAddress}
              className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#FFFFFF]">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="text-[#9CAFC3] hover:text-[#FFFFFF] p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {addressErrorMsg && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
                  {addressErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Address Label */}
                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Address Label
                  </label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work / Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Country
                  </label>
                  <select
                    value={addressForm.country_code}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        country_code: e.target.value as "IN" | "GB",
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  >
                    <option value="IN">India (₹ INR)</option>
                    <option value="GB">United Kingdom (£ GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipient_name}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, recipient_name: e.target.value })
                    }
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
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder={
                      addressForm.country_code === "IN" ? "+91 98765 43210" : "+44 7911 123456"
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    Street Address (Line 1: Apartment, Flat, Unit, House No &amp; Street)
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
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
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
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
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder={addressForm.country_code === "IN" ? "Mumbai" : "London"}
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    State / Province / Region
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state_or_province}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state_or_province: e.target.value })
                    }
                    placeholder={addressForm.country_code === "IN" ? "Maharashtra" : "Greater London"}
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div>
                  <label className="text-[#9CAFC3] uppercase font-semibold text-[10px] block mb-1">
                    {addressForm.country_code === "IN" ? "PIN Code (6 Digits)" : "Postcode (UK format)"}
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.postal_code}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, postal_code: e.target.value })
                    }
                    placeholder={addressForm.country_code === "IN" ? "400050" : "SW1A 1AA"}
                    className="w-full h-10 px-3 rounded-lg bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#9CAFC3]">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, is_default: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-[#243447] bg-[#080B10] text-[#7DD3FC]"
                    />
                    <span>Set as primary default address</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2 rounded-xl bg-[#080B10] text-[#9CAFC3] hover:text-[#FFFFFF] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] hover:bg-[#FFFFFF] text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSavingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#102A43]/20 border border-dashed border-[#243447] text-center space-y-3">
              <MapPin className="h-10 w-10 text-[#9CAFC3] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#FFFFFF]">No saved addresses found</h3>
              <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto">
                Save your home or work delivery address for automatic prefill during checkout.
              </p>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="px-4 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs"
              >
                Add Your First Address
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
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAddress(addr)}
                        className="text-[#9CAFC3] hover:text-[#7DD3FC] text-xs p-1"
                        title="Edit address"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-400 hover:text-red-300 text-xs p-1"
                        title="Delete address"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[11px] text-[#7DD3FC] hover:text-[#FFFFFF] font-semibold"
                      >
                        Set as default delivery address
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Profile Settings & Mandatory Completion */}
      {activeTab === "settings" && (
        <form
          onSubmit={handleSaveProfile}
          className="p-8 rounded-2xl bg-[#102A43]/30 border border-[#243447] space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#FFFFFF]">Mandatory Customer Profile Details</h2>
              <p className="text-xs text-[#9CAFC3]">
                Your profile information is permanently linked to your verified account and pre-filled during checkout.
              </p>
            </div>
            <div className="font-mono text-xs text-[#7DD3FC] px-3 py-1 rounded-lg bg-[#080B10] border border-[#243447]">
              Completion: {completion.percentage}%
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{profileSuccessMsg}</span>
              </div>
              {nextCheckout && (
                <Link
                  href={nextCheckout}
                  className="px-3 py-1 rounded-lg bg-emerald-400 text-[#080B10] font-bold text-xs"
                >
                  Return to Checkout &rarr;
                </Link>
              )}
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Full Legal Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                  Full Legal Name *
                </label>
                {fullName.trim().length >= 3 && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Valid
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Sharma"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                  Email Address (Verified) *
                </label>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <Check className="h-3 w-3" /> Confirmed
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={profile.email || ""}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10]/60 border border-[#243447] text-[#9CAFC3] cursor-not-allowed"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>

            {/* Country / Market */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Shopping Country / Market *
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCountry(c);
                    setPreferredCurrency(c === "GB" ? "GBP" : "INR");
                  }}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                >
                  <option value="IN">India (₹ INR - Razorpay &amp; Express Domestic Dispatch)</option>
                  <option value="GB">United Kingdom (£ GBP - Stripe &amp; Royal Mail Tracked)</option>
                </select>
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>

            {/* Contact Mobile Phone Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                  Mobile Phone Number *
                </label>
                {validatePhoneNumber(phone, country === "GB" ? "GB" : "IN") && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Valid format
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={country === "IN" ? "+91 98765 43210" : "+44 7911 123456"}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
              </div>
            </div>

            {/* Apartment / Flat / Unit / House */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Apartment, Flat, Unit, or House No.
              </label>
              <input
                type="text"
                value={apartmentUnit}
                onChange={(e) => setApartmentUnit(e.target.value)}
                placeholder="e.g. Flat 402, Building 3"
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            {/* Street and Locality */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Street Address and Locality *
              </label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. Skyline Residency, Bandra West"
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            {/* City or Town */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                City or Town *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={country === "IN" ? "e.g. Mumbai" : "e.g. London"}
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            {/* State, Province, or Region */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                State, Province, or Region *
              </label>
              <input
                type="text"
                required
                value={stateOrProvince}
                onChange={(e) => setStateOrProvince(e.target.value)}
                placeholder={country === "IN" ? "e.g. Maharashtra" : "e.g. Greater London"}
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            {/* Postal or PIN Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                  {country === "IN" ? "PIN Code (6 digits) *" : "UK Postcode *"}
                </label>
                {validatePostalCode(postalCode, country === "GB" ? "GB" : "IN") && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Valid format
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder={country === "IN" ? "e.g. 400050" : "e.g. SW1A 1AA"}
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] font-mono focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-1.5">
              <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Leave with building security if unavailable"
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#243447]/60">
            <span className="text-xs text-[#9CAFC3]">
              * All marked fields are mandatory for express shipping compliance.
            </span>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all disabled:opacity-50 shadow-md shadow-[#7DD3FC]/10"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingProfile ? "Saving Profile..." : "Permanently Save Profile"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
