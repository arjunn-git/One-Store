"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Search, User, Globe, Shield, LogOut } from "lucide-react";
import { useMarket } from "@/lib/context/MarketContext";
import { useCart } from "@/lib/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { signOutUser } from "@/lib/services/auth";

export function Header() {
  const { market, setMarket } = useMarket();
  const { itemCount, setIsOpen } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (typeof window === "undefined") return;

      const emailCookie = document.cookie.includes("one_store_user_email");
      const session = localStorage.getItem("one_store_session");
      const hasAdminCookie =
        document.cookie.includes("arjuntaneja204%40gmail.com") ||
        document.cookie.includes("arjuntaneja204@gmail.com") ||
        (session && session.includes("arjuntaneja204@gmail.com"));

      if (emailCookie || session) {
        if (isMounted) {
          setIsLoggedIn(true);
          setIsAdmin(!!hasAdminCookie);
          if (hasAdminCookie) {
            setUserName("Arjun Taneja");
          } else {
            const match = document.cookie.match(/one_store_user_email=([^;]+)/);
            if (match && match[1]) {
              setUserName(decodeURIComponent(match[1]).split("@")[0]);
            }
          }
        }
      }

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data?.user?.email && isMounted) {
          setIsLoggedIn(true);
          const email = data.user.email.toLowerCase().trim();
          const adminCheck = email === "arjuntaneja204@gmail.com";
          setIsAdmin(adminCheck);
          const name =
            data.user.user_metadata?.full_name ||
            (adminCheck ? "Arjun Taneja" : email.split("@")[0]);
          setUserName(name);
        } else if (!emailCookie && !session && isMounted) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setUserName(null);
        }
      } catch {
        // Fallback to cookie check
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#243447] bg-[#080B10]/90 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs text-[#9CAFC3] border-b border-[#243447]/60 md:px-8">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#7DD3FC] animate-pulse"></span>
          <span>Dual Market Operations: India (INR ₹) &amp; United Kingdom (GBP £)</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMarket(market === "IN" ? "GB" : "IN")}
            className="flex items-center gap-1.5 hover:text-[#7DD3FC] transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Market: {market === "IN" ? "India (₹ INR)" : "UK (£ GBP)"}</span>
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#102A43] border border-[#243447] text-[#7DD3FC] font-bold text-lg group-hover:border-[#7DD3FC] transition-colors">
            1
          </div>
          <span className="text-xl font-bold tracking-tight text-[#FFFFFF]">
            ONE <span className="text-[#7DD3FC]">STORE</span>
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9CAFC3]">
          <Link href="/products" className="hover:text-[#FFFFFF] transition-colors">
            All Products
          </Link>
          <Link href="/categories" className="hover:text-[#FFFFFF] transition-colors">
            Categories
          </Link>
          <Link href="/offers" className="hover:text-[#FFFFFF] transition-colors">
            Offers
          </Link>
          <Link href="/about" className="hover:text-[#FFFFFF] transition-colors">
            About
          </Link>
          <Link href="/support" className="hover:text-[#FFFFFF] transition-colors">
            Support
          </Link>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447] transition-all"
          >
            <Search className="h-5 w-5" />
          </Link>
          {/* Admin Command Link (Strictly restricted to Arjun) */}
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/50 text-xs font-semibold hover:bg-[#7DD3FC] hover:text-[#080B10] transition-all"
              title="Admin Command Dashboard (Arjun Taneja Only)"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}

          {/* User Account or Sign In */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                aria-label="My Account"
                title="My Profile & Orders"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40 hover:bg-[#7DD3FC] hover:text-[#080B10] text-xs font-semibold transition-all"
              >
                <div className="h-5 w-5 rounded-full bg-[#7DD3FC]/20 text-[#7DD3FC] flex items-center justify-center text-[10px] font-bold">
                  {(userName || "U").charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline font-medium max-w-[110px] truncate">
                  {userName || "Account"}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign Out"
                title="Sign Out (Browse as guest shopper)"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#080B10] hover:bg-red-950/50 text-[#9CAFC3] hover:text-red-300 border border-[#243447] hover:border-red-800/60 text-xs font-medium transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Sign In"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102A43] text-[#FFFFFF] border border-[#243447] hover:border-[#7DD3FC] hover:text-[#7DD3FC] text-xs font-semibold transition-all"
            >
              <User className="h-3.5 w-3.5 text-[#7DD3FC]" />
              <span>Sign In</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Shopping Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC] transition-all"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#7DD3FC] text-[10px] font-bold text-[#080B10]">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <CartDrawer />
    </header>
  );
}
