"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  ShieldCheck,
  Shield,
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
import { AddressAutocompleteInput } from "@/components/account/AddressAutocompleteInput";
import { PostalCodeLookupInput } from "@/components/account/PostalCodeLookupInput";
import { CustomDropdown } from "@/components/account/CustomDropdown";
import { RealTimeMapLocator, type ResolvedLocationData } from "@/components/account/RealTimeMapLocator";
import { type AddressSuggestion } from "@/app/api/address/autocomplete/route";

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

  // Intelligent Address & Autocomplete State
  const [selectedLocality, setSelectedLocality] = useState<string>("");
  const [manuallyEditedCity, setManuallyEditedCity] = useState(!!initialProfile.city);
  const [manuallyEditedState, setManuallyEditedState] = useState(!!initialProfile.state_or_province);
  const [marketSwitchNotice, setMarketSwitchNotice] = useState<string | null>(null);

  // Address modal lookup state
  const [addressFormLocality, setAddressFormLocality] = useState<string>("");
  const [manuallyEditedAddressCity, setManuallyEditedAddressCity] = useState(false);
  const [manuallyEditedAddressState, setManuallyEditedAddressState] = useState(false);

  // Real-time map telemetry coordinates
  const [profileCoordinates, setProfileCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [modalCoordinates, setModalCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const handleMarketChange = (newCountry: "IN" | "GB") => {
    if (newCountry === country) return;

    setCountry(newCountry);
    setPreferredCurrency(newCountry === "GB" ? "GBP" : "INR");
    setSelectedLocality("");

    // Validate if current postal code matches new country rules
    const isPostalValidForNew = validatePostalCode(postalCode, newCountry);
    if (!isPostalValidForNew && postalCode.trim()) {
      setPostalCode("");
      setCity("");
      setStateOrProvince("");
      setManuallyEditedCity(false);
      setManuallyEditedState(false);
      setMarketSwitchNotice(
        newCountry === "GB"
          ? "Market switched to United Kingdom (£ GBP). Incompatible Indian address details reset. Please enter your UK postcode."
          : "Market switched to India (₹ INR). Incompatible UK address details reset. Please enter your 6-digit Indian PIN code."
      );
    } else {
      setMarketSwitchNotice(
        newCountry === "GB"
          ? "Market switched to United Kingdom (£ GBP). Please verify your address and mobile phone for Royal Mail dispatch."
          : "Market switched to India (₹ INR). Please verify your address and mobile phone for domestic express dispatch."
      );
    }

    // Check phone compatibility
    const isPhoneValidForNew = validatePhoneNumber(phone, newCountry);
    if (!isPhoneValidForNew && phone.trim()) {
      setPhone("");
    }
  };

  const handlePostalResolved = (data: {
    city?: string;
    state?: string;
    district?: string;
    localities?: string[];
    selectedLocality?: string;
    postalCode?: string;
  }) => {
    if (data.city && (!manuallyEditedCity || !city)) {
      setCity(data.city);
    }
    if (data.state && (!manuallyEditedState || !stateOrProvince)) {
      setStateOrProvince(data.state);
    }
    if (data.selectedLocality) {
      setSelectedLocality(data.selectedLocality);
    }
    if (data.postalCode) {
      setPostalCode(data.postalCode);
    }
  };

  const handleSelectLocality = (loc: string) => {
    setSelectedLocality(loc);
    if (loc && !streetAddress.includes(loc)) {
      setStreetAddress((prev) => (prev.trim() ? `${prev.trim()}, ${loc}` : loc));
    }
  };

  const handleAutocompleteSelect = (suggestion: AddressSuggestion) => {
    if (suggestion.street) {
      setStreetAddress(suggestion.street);
    } else if (suggestion.label) {
      setStreetAddress(suggestion.label.split(",")[0]);
    }

    if (suggestion.locality) {
      setSelectedLocality(suggestion.locality);
    }

    if (suggestion.city && (!manuallyEditedCity || !city)) {
      setCity(suggestion.city);
    }

    if (suggestion.state && (!manuallyEditedState || !stateOrProvince)) {
      setStateOrProvince(suggestion.state);
    }

    if (
      suggestion.postalCode &&
      (!postalCode || !validatePostalCode(postalCode, country as "IN" | "GB"))
    ) {
      setPostalCode(suggestion.postalCode);
    }

    if (suggestion.coordinates) {
      setProfileCoordinates(suggestion.coordinates);
    }
  };

  const handleProfileLocationResolved = (data: ResolvedLocationData) => {
    setProfileCoordinates(data.coordinates);
    if (data.street) {
      setStreetAddress(data.street);
    }
    if (data.houseNumber && (!apartmentUnit || !apartmentUnit.trim())) {
      setApartmentUnit(data.houseNumber);
    }
    if (data.locality) {
      setSelectedLocality(data.locality);
    }
    if (data.city) {
      setCity(data.city);
      setManuallyEditedCity(true);
    }
    if (data.state) {
      setStateOrProvince(data.state);
      setManuallyEditedState(true);
    }
    if (data.postalCode) {
      setPostalCode(data.postalCode);
    }
    if (data.country && data.country !== country) {
      handleMarketChange(data.country);
    }
  };

  const handleModalLocationResolved = (data: ResolvedLocationData) => {
    setModalCoordinates(data.coordinates);
    setAddressForm((prev) => ({
      ...prev,
      line1: data.street || (data.displayName ? data.displayName.split(",")[0] : prev.line1),
      line2: data.locality || prev.line2,
      city: data.city || prev.city,
      state_or_province: data.state || prev.state_or_province,
      postal_code: data.postalCode || prev.postal_code,
      country_code: data.country || prev.country_code,
    }));
    if (data.locality) {
      setAddressFormLocality(data.locality);
    }
  };

  const handleAddressModalMarketChange = (newCountry: "IN" | "GB") => {
    const isPostalValid = validatePostalCode(addressForm.postal_code, newCountry);
    const isPhoneValid = validatePhoneNumber(addressForm.phone, newCountry);

    setAddressForm({
      ...addressForm,
      country_code: newCountry,
      postal_code: isPostalValid ? addressForm.postal_code : "",
      city: isPostalValid ? addressForm.city : "",
      state_or_province: isPostalValid ? addressForm.state_or_province : "",
      phone: isPhoneValid ? addressForm.phone : "",
    });
    setAddressFormLocality("");
    setManuallyEditedAddressCity(false);
    setManuallyEditedAddressState(false);
  };

  const handleAddressModalPostalResolved = (data: {
    city?: string;
    state?: string;
    district?: string;
    localities?: string[];
    selectedLocality?: string;
    postalCode?: string;
  }) => {
    setAddressForm((prev) => ({
      ...prev,
      city: data.city && (!manuallyEditedAddressCity || !prev.city) ? data.city : prev.city,
      state_or_province:
        data.state && (!manuallyEditedAddressState || !prev.state_or_province)
          ? data.state
          : prev.state_or_province,
      postal_code: data.postalCode || prev.postal_code,
    }));
    if (data.selectedLocality) {
      setAddressFormLocality(data.selectedLocality);
    }
  };

  const handleAddressModalAutocompleteSelect = (suggestion: AddressSuggestion) => {
    setAddressForm((prev) => ({
      ...prev,
      line1: suggestion.street || (suggestion.label ? suggestion.label.split(",")[0] : prev.line1),
      line2: suggestion.locality || prev.line2,
      city: suggestion.city && (!manuallyEditedAddressCity || !prev.city) ? suggestion.city : prev.city,
      state_or_province:
        suggestion.state && (!manuallyEditedAddressState || !prev.state_or_province)
          ? suggestion.state
          : prev.state_or_province,
      postal_code:
        suggestion.postalCode &&
        (!prev.postal_code ||
          !validatePostalCode(prev.postal_code, prev.country_code as "IN" | "GB"))
          ? suggestion.postalCode
          : prev.postal_code,
    }));
    if (suggestion.coordinates) {
      setModalCoordinates(suggestion.coordinates);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      try {
        localStorage.setItem("one_store_user_name", "Store Admin");
        window.dispatchEvent(
          new CustomEvent("user_profile_updated", { detail: { full_name: "Store Admin" } })
        );
      } catch {
        // Ignore
      }
      return;
    }
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
  }, [initialProfile?.full_name, isAdmin]);

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
      if (!isAdmin && data.profile?.full_name) {
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

  const nameOrEmail = isAdmin ? "Store Administrator" : (fullName || profile.email?.split("@")[0] || "Shopper");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 1. Welcoming Hero Banner */}
      <div className="relative overflow-hidden p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#102A43]/70 via-[#102A43]/40 to-[#080B10] border border-[#243447] shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div
              className={`h-16 w-16 rounded-2xl ${
                isAdmin
                  ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                  : "bg-[#102A43] border-[#7DD3FC]/50 text-[#7DD3FC]"
              } border flex items-center justify-center font-bold text-2xl shadow-inner shrink-0`}
            >
              {isAdmin ? <Shield className="h-8 w-8 text-amber-400" /> : nameOrEmail.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs text-[#7DD3FC] font-semibold uppercase tracking-wider">
                  {displayGreeting()},
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700 shadow-sm">
                    <Shield className="h-3.5 w-3.5 text-amber-400" /> Store Administrator
                  </span>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                {isAdmin ? "Store Administrator" : (fullName || profile.email)}
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
            {isAdmin && (
              <Link
                href="/admin-portal/dashboard"
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/15"
              >
                <Shield className="h-4 w-4" />
                <span>Open Admin Portal</span>
              </Link>
            )}
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
      <div className="flex items-center gap-2 border-b border-[#243447] pb-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("orders")}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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

              {/* Real-Time Map & GPS Locator */}
              <RealTimeMapLocator
                country={addressForm.country_code === "GB" ? "GB" : "IN"}
                activeCoordinates={modalCoordinates}
                onLocationResolved={handleModalLocationResolved}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Address Label */}
                <CustomDropdown
                  id="modal-address-label"
                  label="Address Label"
                  value={addressForm.label}
                  onChange={(val) => setAddressForm({ ...addressForm, label: val })}
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

                {/* Country */}
                <CustomDropdown
                  id="modal-address-country"
                  label="Country / Market"
                  value={addressForm.country_code}
                  onChange={(val) =>
                    handleAddressModalMarketChange(val as "IN" | "GB")
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
                  <AddressAutocompleteInput
                    id="address-modal-line1"
                    label="Street Address (Line 1: Apartment, House No & Street)"
                    value={addressForm.line1}
                    onChange={(val) => setAddressForm({ ...addressForm, line1: val })}
                    onSelectSuggestion={handleAddressModalAutocompleteSelect}
                    country={addressForm.country_code === "GB" ? "GB" : "IN"}
                    placeholder={
                      addressForm.country_code === "IN"
                        ? "e.g. Flat 402, Skyline Residency, Bandra West"
                        : "e.g. 10 Downing Street, Westminster"
                    }
                    required={true}
                    helperText="Type 3 or more characters to see instant address suggestions."
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
                  <PostalCodeLookupInput
                    id="address-modal-postal"
                    value={addressForm.postal_code}
                    onChange={(val) => setAddressForm({ ...addressForm, postal_code: val })}
                    onResolved={handleAddressModalPostalResolved}
                    country={addressForm.country_code === "GB" ? "GB" : "IN"}
                    selectedLocality={addressFormLocality}
                    onSelectLocality={(loc) => {
                      setAddressFormLocality(loc);
                      setAddressForm((prev) => ({
                        ...prev,
                        line2: prev.line2 ? `${prev.line2}, ${loc}` : loc,
                      }));
                    }}
                    required={true}
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
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, city: e.target.value });
                      setManuallyEditedAddressCity(true);
                    }}
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
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, state_or_province: e.target.value });
                      setManuallyEditedAddressState(true);
                    }}
                    placeholder={addressForm.country_code === "IN" ? "Maharashtra" : "Greater London"}
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
            <CustomDropdown
              id="shopping-country-market"
              label="Shopping Country / Market"
              required
              value={country}
              onChange={(val) => handleMarketChange(val as "IN" | "GB")}
              options={[
                {
                  value: "IN",
                  label: "India",
                  subtitle: "₹ INR • Razorpay & Express Domestic Dispatch",
                  badge: "₹ INR",
                  icon: <Globe className="h-4 w-4 text-[#7DD3FC]" />,
                },
                {
                  value: "GB",
                  label: "United Kingdom",
                  subtitle: "£ GBP • Stripe & Royal Mail Tracked",
                  badge: "£ GBP",
                  icon: <Globe className="h-4 w-4 text-[#7DD3FC]" />,
                },
              ]}
              leftIcon={<Globe className="h-4 w-4" />}
            />

            {/* Market Switching Notification */}
            {marketSwitchNotice && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-[#102A43]/60 border border-[#7DD3FC]/40 text-xs text-[#7DD3FC] flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 shrink-0 text-[#7DD3FC]" />
                  <span>{marketSwitchNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMarketSwitchNotice(null)}
                  className="text-[#9CAFC3] hover:text-[#FFFFFF] p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

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

            {/* Real-Time Map Data & GPS Locator */}
            <div className="sm:col-span-2">
              <RealTimeMapLocator
                country={country as "IN" | "GB"}
                activeCoordinates={profileCoordinates}
                onLocationResolved={handleProfileLocationResolved}
              />
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

            {/* Street Address and Locality (With Intelligent Autocomplete) */}
            <div className="space-y-1.5 sm:col-span-2">
              <AddressAutocompleteInput
                id="profile-street-address"
                label="Street Address and Locality"
                value={streetAddress}
                onChange={(val) => setStreetAddress(val)}
                onSelectSuggestion={handleAutocompleteSelect}
                country={country === "GB" ? "GB" : "IN"}
                placeholder={
                  country === "IN"
                    ? "e.g. Skyline Residency, Bandra West, Mumbai"
                    : "e.g. 10 Downing Street, Westminster, London"
                }
                required={true}
                helperText="Type 3 or more characters to see instant address & locality suggestions from OpenStreetMap."
              />
            </div>

            {/* Postal or PIN Code (With Intelligent Auto-Lookup & Locality Selector) */}
            <div className="space-y-1.5">
              <PostalCodeLookupInput
                id="profile-postal-code"
                value={postalCode}
                onChange={(val) => setPostalCode(val)}
                onResolved={handlePostalResolved}
                country={country === "GB" ? "GB" : "IN"}
                selectedLocality={selectedLocality}
                onSelectLocality={handleSelectLocality}
                required={true}
              />
            </div>

            {/* City or Town */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                  City or Town *
                </label>
                {city && (
                  <span className="text-[10px] text-[#7DD3FC]">
                    {manuallyEditedCity ? "Customized" : "Auto-filled"}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setManuallyEditedCity(true);
                }}
                placeholder={country === "IN" ? "e.g. Mumbai" : "e.g. London"}
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            {/* State, Province, or Region */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]">
                  State, Province, or Region *
                </label>
                {stateOrProvince && (
                  <span className="text-[10px] text-[#7DD3FC]">
                    {manuallyEditedState ? "Customized" : "Auto-filled"}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={stateOrProvince}
                onChange={(e) => {
                  setStateOrProvince(e.target.value);
                  setManuallyEditedState(true);
                }}
                placeholder={country === "IN" ? "e.g. Maharashtra" : "e.g. Greater London"}
                className="w-full h-11 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
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
