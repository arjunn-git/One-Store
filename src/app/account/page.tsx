import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Package,
  MapPin,
  Heart,
  LogOut,
  Sparkles,
  CreditCard,
  Mail,
  CheckCircle2,
} from "lucide-react";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect("/login?next=/account");
  }

  // Fetch canonical profile
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  const displayName = profile?.full_name || user.user_metadata?.full_name || "One Store Customer";
  const email = user.email || "No email linked";
  const isEmailVerified = !!user.email_confirmed_at;

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Account Profile Header */}
          <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-bold text-2xl shadow-inner">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#FFFFFF]">{displayName}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30">
                    <Sparkles className="h-3 w-3" /> Canonical Member
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#9CAFC3] mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {email}
                  </span>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Email Verified
                    </span>
                  ) : (
                    <span className="text-amber-400">Pending Verification</span>
                  )}
                </div>
              </div>
            </div>

            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#080B10] text-[#9CAFC3] hover:text-[#FFFFFF] border border-[#243447] hover:border-red-500/50 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </form>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Orders Card */}
            <div className="p-6 rounded-2xl bg-[#102A43]/20 border border-[#243447] space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono text-[#9CAFC3]">0 Orders</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#FFFFFF]">Order History &amp; Tracking</h3>
                <p className="text-xs text-[#9CAFC3] mt-1">
                  Track dual-market deliveries across India (+91) and the UK (+44).
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/orders"
                  className="text-xs font-semibold text-[#7DD3FC] hover:underline"
                >
                  View Order Log →
                </Link>
              </div>
            </div>

            {/* Saved Addresses Card */}
            <div className="p-6 rounded-2xl bg-[#102A43]/20 border border-[#243447] space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono text-[#9CAFC3]">0 Saved</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#FFFFFF]">Address Book</h3>
                <p className="text-xs text-[#9CAFC3] mt-1">
                  Configure default dispatch addresses for INR &amp; GBP checkouts.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/account/addresses"
                  className="text-xs font-semibold text-[#7DD3FC] hover:underline"
                >
                  Manage Addresses →
                </Link>
              </div>
            </div>

            {/* Wishlist Card */}
            <div className="p-6 rounded-2xl bg-[#102A43]/20 border border-[#243447] space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono text-[#9CAFC3]">0 Items</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#FFFFFF]">Curated Wishlist</h3>
                <p className="text-xs text-[#9CAFC3] mt-1">
                  Saved flagship models and accessories for upcoming purchases.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/wishlist"
                  className="text-xs font-semibold text-[#7DD3FC] hover:underline"
                >
                  View Saved Models →
                </Link>
              </div>
            </div>
          </div>

          {/* Account Security & Canonical ID Details */}
          <div className="p-8 rounded-2xl bg-[#080B10] border border-[#243447] space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#FFFFFF]">
              <ShieldCheck className="h-4 w-4 text-[#7DD3FC]" />
              <span>Identity &amp; Security Metadata</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#102A43]/30 border border-[#243447]/60">
                <div className="text-[#9CAFC3]">Supabase Auth UID</div>
                <div className="font-mono text-[#FFFFFF] mt-1 truncate">{user.id}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#102A43]/30 border border-[#243447]/60">
                <div className="text-[#9CAFC3]">Canonical Customer ID</div>
                <div className="font-mono text-[#FFFFFF] mt-1 truncate">
                  {profile?.id || "Pending database sync"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
