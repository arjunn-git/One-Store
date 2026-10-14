import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";
import { UserProfileClient, ProfileData, OrderItem, AddressItem } from "@/components/account/UserProfileClient";
import { cookies } from "next/headers";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const fallbackEmail = cookieStore.get("one_store_user_email")?.value;

  let authUser = null;
  let profile: ProfileData | null = null;
  let orders: OrderItem[] = [];
  let addresses: AddressItem[] = [];

  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: authData } = await supabase.auth.getUser();
      authUser = authData.user;

      if (authUser) {
        // Fetch canonical profile
        const { data: profileData } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (profileData) {
          profile = profileData as ProfileData;
        } else {
          // Idempotently create canonical profile
          const { data: newProfile } = await supabase
            .from("customer_profiles")
            .upsert(
              {
                auth_user_id: authUser.id,
                email: authUser.email,
                is_email_verified: !!authUser.email_confirmed_at,
                full_name: authUser.user_metadata?.full_name || null,
                role: isAdminEmail(authUser.email) ? "owner" : "customer",
              },
              { onConflict: "auth_user_id" }
            )
            .select()
            .single();

          profile = newProfile as ProfileData;
        }

        if (profile?.id) {
          // Fetch orders
          const { data: orderData } = await supabase
            .from("orders")
            .select("id, order_number, status, payment_status, currency, total_amount, created_at")
            .eq("customer_id", profile.id)
            .order("created_at", { ascending: false });

          if (orderData) {
            orders = orderData as OrderItem[];
          }

          // Fetch addresses
          const { data: addressData } = await supabase
            .from("addresses")
            .select("*")
            .eq("customer_id", profile.id)
            .order("is_default", { ascending: false });

          if (addressData) {
            addresses = addressData as AddressItem[];
          }
        }
      }
    } catch {
      authUser = null;
    }
  }

  // If unauthenticated, redirect to login
  if (!authUser && !fallbackEmail) {
    redirect("/login?next=/account");
  }

  const activeEmail = authUser?.email || fallbackEmail || "";
  const isAdmin = isAdminEmail(activeEmail);

  // Fallback profile object if needed
  const userProfile: ProfileData = profile || {
    id: authUser?.id || "usr_default",
    auth_user_id: authUser?.id || "usr_default",
    full_name: authUser?.user_metadata?.full_name || (isAdmin ? "Arjun Taneja" : null),
    email: activeEmail,
    is_email_verified: true,
    phone: null,
    country: "IN",
    preferred_currency: "INR",
    role: isAdmin ? "owner" : "customer",
    marketing_consent: false,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <UserProfileClient
          initialProfile={userProfile}
          initialOrders={orders}
          initialAddresses={addresses}
          isAdmin={isAdmin}
        />
      </main>

      <Footer />
    </div>
  );
}
