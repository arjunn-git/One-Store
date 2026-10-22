import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";
import { calculateProfileCompletion } from "@/lib/services/profile-validation";

export interface ServerSessionUser {
  authUserId: string | null;
  email: string;
  role: string;
  isAdmin: boolean;
  name: string | null;
  isEmailVerified: boolean;
  source: "supabase" | "cookie";
}

export interface CustomerProfileRecord {
  id: string;
  auth_user_id?: string | null;
  email: string;
  full_name?: string | null;
  is_email_verified?: boolean;
  phone?: string | null;
  country?: string | null;
  preferred_currency?: string | null;
  role?: string | null;
  apartment_unit?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  delivery_instructions?: string | null;
  is_profile_complete?: boolean;
  profile_completion_percentage?: number;
  marketing_consent?: boolean;
  marketing_consent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AddressRecord {
  id: string;
  customer_id: string;
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
  created_at?: string;
  updated_at?: string;
}

// Resilient local file storage paths
const ACCOUNTS_FILE = path.join(process.cwd(), ".system_customer_accounts.json");
const ADDRESSES_FILE = path.join(process.cwd(), ".system_customer_addresses.json");

export function getStoredProfiles(): CustomerProfileRecord[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
      return JSON.parse(data) || [];
    }
  } catch {}
  return [];
}

export function saveStoredProfiles(profiles: CustomerProfileRecord[]) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch {}
}

export function getStoredAddresses(): AddressRecord[] {
  try {
    if (fs.existsSync(ADDRESSES_FILE)) {
      const data = fs.readFileSync(ADDRESSES_FILE, "utf-8");
      return JSON.parse(data) || [];
    }
  } catch {}
  return [];
}

export function saveStoredAddresses(addresses: AddressRecord[]) {
  try {
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2), "utf-8");
  } catch {}
}

/**
 * Resolves current user session via Supabase GoTrue Auth OR verified HTTP session cookies.
 */
export async function resolveServerSession(): Promise<ServerSessionUser | null> {
  // 1. Check Supabase GoTrue Auth session
  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.email) {
        const email = data.user.email.toLowerCase().trim();
        const isAdmin = isAdminEmail(email);
        return {
          authUserId: data.user.id,
          email,
          role: isAdmin ? "owner" : (data.user.user_metadata?.role || "customer"),
          isAdmin,
          name: data.user.user_metadata?.full_name || null,
          isEmailVerified: !!data.user.email_confirmed_at,
          source: "supabase",
        };
      }
    } catch {
      // Non-blocking fallback
    }
  }

  // 2. Fallback to Verified Session Cookie (OTP signin)
  try {
    const cookieStore = await cookies();
    const cookieEmail = cookieStore.get("one_store_user_email")?.value?.trim().toLowerCase();
    if (cookieEmail && cookieEmail.includes("@")) {
      const isAdmin = isAdminEmail(cookieEmail);
      const cookieRole = cookieStore.get("one_store_user_role")?.value || (isAdmin ? "owner" : "customer");
      const cookieName = cookieStore.get("one_store_user_name")?.value?.trim() || null;
      return {
        authUserId: null,
        email: cookieEmail,
        role: isAdmin ? "owner" : cookieRole,
        isAdmin,
        name: cookieName,
        isEmailVerified: true,
        source: "cookie",
      };
    }
  } catch {
    // Non-blocking fallback
  }

  return null;
}

/**
 * Fetches or idempotently initializes the customer profile for an authenticated session.
 */
export async function getOrCreateCustomerProfile(
  session: ServerSessionUser
): Promise<CustomerProfileRecord> {
  const normalizedEmail = session.email.toLowerCase().trim();

  // 1. Try Live Supabase
  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      let profile: CustomerProfileRecord | null = null;

      if (session.authUserId) {
        const { data } = await admin
          .from("customer_profiles")
          .select("*")
          .eq("auth_user_id", session.authUserId)
          .maybeSingle();
        if (data) profile = data as CustomerProfileRecord;
      }

      if (!profile) {
        const { data } = await admin
          .from("customer_profiles")
          .select("*")
          .eq("email", normalizedEmail)
          .maybeSingle();
        if (data) profile = data as CustomerProfileRecord;
      }

      if (profile) {
        // Ensure auth_user_id is linked if available
        if (session.authUserId && !profile.auth_user_id) {
          try {
            await admin
              .from("customer_profiles")
              .update({ auth_user_id: session.authUserId })
              .eq("id", profile.id);
            profile.auth_user_id = session.authUserId;
          } catch {}
        }
        return profile;
      }

      // Profile does not exist yet; find or create an auth user if needed
      let authUserIdToUse = session.authUserId;
      if (!authUserIdToUse) {
        try {
          const { data: authUsers } = await admin.auth.admin.listUsers();
          const existingUser = authUsers?.users?.find(
            (u) => u.email?.toLowerCase() === normalizedEmail
          );
          if (existingUser) {
            authUserIdToUse = existingUser.id;
          }
        } catch {}
      }

      const initialPayload: Partial<CustomerProfileRecord> = {
        auth_user_id: authUserIdToUse || null,
        email: normalizedEmail,
        full_name: session.name || null,
        is_email_verified: session.isEmailVerified,
        role: session.role,
        country: "IN",
        preferred_currency: "INR",
        marketing_consent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: created, error } = await admin
        .from("customer_profiles")
        .insert(initialPayload)
        .select()
        .single();

      if (!error && created) {
        return created as CustomerProfileRecord;
      }

      // If insert failed because auth_user_id is missing or required, try with a deterministic/random UUID
      if (error && !authUserIdToUse) {
        const fallbackUserId = crypto.randomUUID();
        const { data: retryCreated } = await admin
          .from("customer_profiles")
          .insert({ ...initialPayload, auth_user_id: fallbackUserId })
          .select()
          .single();
        if (retryCreated) {
          return retryCreated as CustomerProfileRecord;
        }
      }
    } catch (err) {
      console.warn("Supabase profile getOrCreate fallback:", err);
    }
  }

  // 2. Resilient Local File Store Fallback
  const storedProfiles = getStoredProfiles();
  const existing = storedProfiles.find((p) => p.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return existing;
  }

  const newProfile: CustomerProfileRecord = {
    id: `prof_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    auth_user_id: session.authUserId || null,
    email: normalizedEmail,
    full_name: session.name || null,
    is_email_verified: session.isEmailVerified,
    phone: null,
    country: "IN",
    preferred_currency: "INR",
    role: session.role,
    is_profile_complete: false,
    profile_completion_percentage: 0,
    marketing_consent: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  storedProfiles.push(newProfile);
  saveStoredProfiles(storedProfiles);
  return newProfile;
}

/**
 * Fetches addresses for a customer profile with fallback.
 */
export async function getCustomerAddresses(customerId: string): Promise<AddressRecord[]> {
  if (isLiveSupabaseConfigured() && customerId) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("addresses")
        .select("*")
        .eq("customer_id", customerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as AddressRecord[];
      }
    } catch {}
  }

  // Local file store fallback
  const stored = getStoredAddresses();
  return stored
    .filter((a) => a.customer_id === customerId)
    .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
}

/**
 * Updates a customer profile and recalculates completion score.
 */
export async function updateCustomerProfile(
  session: ServerSessionUser,
  profileUpdates: Partial<CustomerProfileRecord>
): Promise<{ profile: CustomerProfileRecord; completion: any }> {
  const currentProfile = await getOrCreateCustomerProfile(session);
  const addresses = await getCustomerAddresses(currentProfile.id);

  const mergedCandidate = {
    ...currentProfile,
    ...profileUpdates,
    email: session.email,
  };

  const completion = calculateProfileCompletion(mergedCandidate, addresses);

  const payload: Partial<CustomerProfileRecord> = {
    ...profileUpdates,
    email: session.email,
    is_email_verified: true,
    is_profile_complete: completion.isComplete,
    profile_completion_percentage: completion.percentage,
    updated_at: new Date().toISOString(),
  };

  let updatedProfile: CustomerProfileRecord = {
    ...currentProfile,
    ...payload,
  };

  // 1. Update in Supabase
  if (isLiveSupabaseConfigured() && currentProfile.id) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("customer_profiles")
        .update(payload)
        .eq("id", currentProfile.id)
        .select()
        .single();

      if (!error && data) {
        updatedProfile = data as CustomerProfileRecord;
      }
    } catch (err) {
      console.warn("Supabase profile update warning:", err);
    }
  }

  // 2. Sync to local storage
  const storedProfiles = getStoredProfiles();
  const idx = storedProfiles.findIndex((p) => p.email.toLowerCase() === session.email.toLowerCase());
  if (idx >= 0) {
    storedProfiles[idx] = { ...storedProfiles[idx], ...updatedProfile };
  } else {
    storedProfiles.push(updatedProfile);
  }
  saveStoredProfiles(storedProfiles);

  return { profile: updatedProfile, completion };
}

/**
 * Creates or saves a new customer address.
 */
export async function saveCustomerAddress(
  session: ServerSessionUser,
  addressData: Omit<AddressRecord, "id" | "customer_id">
): Promise<{ address: AddressRecord; completion: any }> {
  const profile = await getOrCreateCustomerProfile(session);
  const existingAddresses = await getCustomerAddresses(profile.id);

  const makeDefault = addressData.is_default || existingAddresses.length === 0;
  const addressId = crypto.randomUUID();

  const payload: AddressRecord = {
    ...addressData,
    id: addressId,
    customer_id: profile.id,
    is_default: makeDefault,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let savedAddress: AddressRecord = payload;

  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (makeDefault) {
        await admin
          .from("addresses")
          .update({ is_default: false })
          .eq("customer_id", profile.id);
      }

      const { data, error } = await admin
        .from("addresses")
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        savedAddress = data as AddressRecord;
      }
    } catch (err) {
      console.warn("Supabase save address warning:", err);
    }
  }

  // Local storage sync
  const stored = getStoredAddresses();
  if (makeDefault) {
    stored.forEach((a) => {
      if (a.customer_id === profile.id) a.is_default = false;
    });
  }
  stored.push(savedAddress);
  saveStoredAddresses(stored);

  // Recalculate profile completion
  const allAddresses = await getCustomerAddresses(profile.id);
  const completion = calculateProfileCompletion(profile, allAddresses);

  if (isLiveSupabaseConfigured()) {
    try {
      await createAdminClient()
        .from("customer_profiles")
        .update({
          is_profile_complete: completion.isComplete,
          profile_completion_percentage: completion.percentage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    } catch {}
  }

  return { address: savedAddress, completion };
}

/**
 * Updates an existing customer address.
 */
export async function updateCustomerAddress(
  session: ServerSessionUser,
  addressId: string,
  updates: Partial<AddressRecord>
): Promise<{ address: AddressRecord; completion: any } | null> {
  const profile = await getOrCreateCustomerProfile(session);
  const existingAddresses = await getCustomerAddresses(profile.id);
  const target = existingAddresses.find((a) => a.id === addressId);

  if (!target) {
    return null;
  }

  const makeDefault = updates.is_default ?? target.is_default;

  let updatedAddress: AddressRecord = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (makeDefault) {
        await admin
          .from("addresses")
          .update({ is_default: false })
          .eq("customer_id", profile.id);
      }

      const { data, error } = await admin
        .from("addresses")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", addressId)
        .eq("customer_id", profile.id)
        .select()
        .single();

      if (!error && data) {
        updatedAddress = data as AddressRecord;
      }
    } catch (err) {
      console.warn("Supabase update address warning:", err);
    }
  }

  // Local storage sync
  const stored = getStoredAddresses();
  const idx = stored.findIndex((a) => a.id === addressId && a.customer_id === profile.id);
  if (idx >= 0) {
    if (makeDefault) {
      stored.forEach((a) => {
        if (a.customer_id === profile.id) a.is_default = false;
      });
    }
    stored[idx] = updatedAddress;
    saveStoredAddresses(stored);
  }

  // Recalculate profile completion
  const allAddresses = await getCustomerAddresses(profile.id);
  const completion = calculateProfileCompletion(profile, allAddresses);

  if (isLiveSupabaseConfigured()) {
    try {
      await createAdminClient()
        .from("customer_profiles")
        .update({
          is_profile_complete: completion.isComplete,
          profile_completion_percentage: completion.percentage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    } catch {}
  }

  return { address: updatedAddress, completion };
}

/**
 * Deletes a customer address.
 */
export async function deleteCustomerAddress(
  session: ServerSessionUser,
  addressId: string
): Promise<{ success: boolean; completion: any }> {
  const profile = await getOrCreateCustomerProfile(session);
  const existingAddresses = await getCustomerAddresses(profile.id);
  const target = existingAddresses.find((a) => a.id === addressId);

  if (!target) {
    return { success: false, completion: calculateProfileCompletion(profile, existingAddresses) };
  }

  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      await admin
        .from("addresses")
        .delete()
        .eq("id", addressId)
        .eq("customer_id", profile.id);

      // If deleted was default, make another one default
      const remaining = existingAddresses.filter((a) => a.id !== addressId);
      if (target.is_default && remaining.length > 0) {
        await admin
          .from("addresses")
          .update({ is_default: true })
          .eq("id", remaining[0].id);
      }
    } catch (err) {
      console.warn("Supabase delete address warning:", err);
    }
  }

  // Local storage sync
  let stored = getStoredAddresses();
  const wasDefault = target.is_default;
  stored = stored.filter((a) => !(a.id === addressId && a.customer_id === profile.id));

  if (wasDefault) {
    const nextForCust = stored.find((a) => a.customer_id === profile.id);
    if (nextForCust) nextForCust.is_default = true;
  }
  saveStoredAddresses(stored);

  // Recalculate profile completion
  const remainingAddresses = await getCustomerAddresses(profile.id);
  const completion = calculateProfileCompletion(profile, remainingAddresses);

  if (isLiveSupabaseConfigured()) {
    try {
      await createAdminClient()
        .from("customer_profiles")
        .update({
          is_profile_complete: completion.isComplete,
          profile_completion_percentage: completion.percentage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    } catch {}
  }

  return { success: true, completion };
}
