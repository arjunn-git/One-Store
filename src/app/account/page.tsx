import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import {
  resolveServerSession,
  getOrCreateCustomerProfile,
  getCustomerAddresses,
} from "@/lib/services/server-auth";
import { UserProfileClient, ProfileData, OrderItem, AddressItem } from "@/components/account/UserProfileClient";

export default async function AccountPage() {
  const session = await resolveServerSession();

  // If unauthenticated, redirect to login
  if (!session) {
    redirect("/login?next=/account");
  }

  const profile = await getOrCreateCustomerProfile(session);
  const addresses = await getCustomerAddresses(profile.id);

  let orders: OrderItem[] = [];
  if (isLiveSupabaseConfigured() && profile?.id) {
    try {
      const admin = createAdminClient();
      const { data: orderData } = await admin
        .from("orders")
        .select("id, order_number, status, payment_status, currency, total_amount, created_at")
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false });

      if (orderData) {
        orders = orderData as OrderItem[];
      }
    } catch {
      orders = [];
    }
  }

  const effectiveProfile: ProfileData = {
    id: profile.id,
    auth_user_id: profile.auth_user_id || session.authUserId || profile.id,
    full_name: profile.full_name || session.name || null,
    email: session.email,
    is_email_verified: profile.is_email_verified ?? true,
    phone: profile.phone || null,
    country: profile.country || "IN",
    preferred_currency: profile.preferred_currency || (profile.country === "GB" ? "GBP" : "INR"),
    role: session.isAdmin ? "owner" : (profile.role || session.role || "customer"),
    apartment_unit: profile.apartment_unit || null,
    street_address: profile.street_address || null,
    city: profile.city || null,
    state_or_province: profile.state_or_province || null,
    postal_code: profile.postal_code || null,
    delivery_instructions: profile.delivery_instructions || null,
    is_profile_complete: profile.is_profile_complete,
    profile_completion_percentage: profile.profile_completion_percentage,
    marketing_consent: !!profile.marketing_consent,
    created_at: profile.created_at || new Date().toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <Suspense fallback={<div className="text-center text-xs text-[#9CAFC3] py-20">Loading account profile...</div>}>
          <UserProfileClient
            initialProfile={effectiveProfile}
            initialOrders={orders}
            initialAddresses={addresses as AddressItem[]}
            isAdmin={session.isAdmin}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
