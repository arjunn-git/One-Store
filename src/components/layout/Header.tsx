"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Search,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Compass,
  Tag,
  Info,
  HelpCircle,
  Package,
  ChevronRight,
  Heart,
} from "lucide-react";
import { useMarket } from "@/lib/context/MarketContext";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CountrySelector } from "@/components/layout/CountrySelector";
import { signOutUser, isAdminEmail } from "@/lib/services/auth";

export function Header() {
  const pathname = usePathname();
  const { market } = useMarket();
  const { itemCount, setIsOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Escape key closes mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (typeof window === "undefined") return;

      const emailCookie = document.cookie.includes("one_store_user_email");
      const session = localStorage.getItem("one_store_session");
      const match = document.cookie.match(/one_store_user_email=([^;]+)/);
      const userEmail = match && match[1] ? decodeURIComponent(match[1]).toLowerCase().trim() : "";
      const hasAdmin = isAdminEmail(userEmail) || (session ? isAdminEmail(session) : false);

      if (emailCookie || session) {
        if (isMounted) {
          setIsLoggedIn(true);
          setIsAdmin(hasAdmin);
          setUserName(hasAdmin ? "Store Admin" : (userEmail.split("@")[0] || "Customer"));
        }
      }

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data?.user?.email && isMounted) {
          setIsLoggedIn(true);
          const email = data.user.email.toLowerCase().trim();
          const adminCheck = isAdminEmail(email);
          setIsAdmin(adminCheck);
          const name =
            data.user.user_metadata?.full_name ||
            (adminCheck ? "Store Admin" : email.split("@")[0]);
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
    <header className="sticky top-0 z-50 w-full border-b border-[#243447] bg-[#080B10]/95 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 text-xs text-[#9CAFC3] border-b border-[#243447]/60 md:px-8">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#7DD3FC] animate-pulse"></span>
          <span className="text-[11px] sm:text-xs truncate">
            <span className="hidden sm:inline">Dual Market Operations: </span>
            <span>India (₹) &amp; United Kingdom (£)</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CountrySelector compact />
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-8">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC] transition-all focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Brand logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#102A43] border border-[#243447] text-[#7DD3FC] font-bold text-lg group-hover:border-[#7DD3FC] transition-colors">
              1
            </div>
            <span className="text-xl font-bold tracking-tight text-[#FFFFFF]">
              ONE <span className="text-[#7DD3FC]">STORE</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9CAFC3]">
          <Link
            href="/products"
            prefetch={true}
            className={`hover:text-[#FFFFFF] transition-colors ${
              pathname === "/products" ? "text-[#7DD3FC] font-semibold" : ""
            }`}
          >
            All Products
          </Link>
          <Link
            href="/categories"
            prefetch={true}
            className={`hover:text-[#FFFFFF] transition-colors ${
              pathname === "/categories" ? "text-[#7DD3FC] font-semibold" : ""
            }`}
          >
            Categories
          </Link>
          <Link
            href="/offers"
            prefetch={true}
            className={`hover:text-[#FFFFFF] transition-colors ${
              pathname === "/offers" ? "text-[#7DD3FC] font-semibold" : ""
            }`}
          >
            Offers
          </Link>
          <Link
            href="/about"
            prefetch={true}
            className={`hover:text-[#FFFFFF] transition-colors ${
              pathname === "/about" ? "text-[#7DD3FC] font-semibold" : ""
            }`}
          >
            About
          </Link>
          <Link
            href="/support"
            prefetch={true}
            className={`hover:text-[#FFFFFF] transition-colors ${
              pathname === "/support" ? "text-[#7DD3FC] font-semibold" : ""
            }`}
          >
            Support
          </Link>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            prefetch={true}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447] transition-all"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            prefetch={true}
            aria-label="Wishlist"
            title="Saved Essentials"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447] transition-all"
          >
            <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "text-red-400" : ""}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-[#FFFFFF]">
                {wishlistCount}
              </span>
            )}
          </Link>

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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#102A43] text-[#FFFFFF] border border-[#243447] hover:border-[#7DD3FC] hover:text-[#7DD3FC] text-xs font-semibold transition-all"
            >
              <User className="h-3.5 w-3.5 text-[#7DD3FC]" />
              <span className="hidden xs:inline sm:inline">Sign In</span>
            </Link>
          )}

          {/* Cart Drawer Trigger */}
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

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[105px] bottom-0 z-40 flex flex-col bg-[#080B10]/98 backdrop-blur-xl border-t border-[#243447] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Quick Search Bar */}
            <div>
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#102A43]/50 border border-[#243447] text-xs text-[#9CAFC3] hover:border-[#7DD3FC] hover:text-[#FFFFFF] transition-all"
              >
                <Search className="h-4 w-4 text-[#7DD3FC]" />
                <span>Search flagship products, audio, carry...</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CAFC3] px-3 mb-2">
                Navigation
              </div>

              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/products"
                    ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40"
                    : "text-[#FFFFFF] hover:bg-[#102A43]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-[#7DD3FC]" />
                  <span>All Products</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#9CAFC3]" />
              </Link>

              <Link
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/categories"
                    ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40"
                    : "text-[#FFFFFF] hover:bg-[#102A43]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="h-4 w-4 text-[#7DD3FC]" />
                  <span>Categories</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#9CAFC3]" />
              </Link>

              <Link
                href="/offers"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/offers"
                    ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40"
                    : "text-[#FFFFFF] hover:bg-[#102A43]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-[#7DD3FC]" />
                  <span>Offers &amp; Perks</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/30 text-[10px] font-bold">
                  10% OFF
                </span>
              </Link>

              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/wishlist"
                    ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40"
                    : "text-[#FFFFFF] hover:bg-[#102A43]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span>My Wishlist</span>
                </div>
                {wishlistCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800 text-[10px] font-bold">
                    {wishlistCount}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#9CAFC3]" />
                )}
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/about"
                    ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40"
                    : "text-[#FFFFFF] hover:bg-[#102A43]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Info className="h-4 w-4 text-[#7DD3FC]" />
                  <span>About One Store</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#9CAFC3]" />
              </Link>

              <Link
                href="/support"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/support"
                    ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40"
                    : "text-[#FFFFFF] hover:bg-[#102A43]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-[#7DD3FC]" />
                  <span>Customer Support &amp; FAQ</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#9CAFC3]" />
              </Link>
            </div>

            {/* Account & Profile Section */}
            <div className="space-y-2 pt-2 border-t border-[#243447]/60">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CAFC3] px-3">
                Account &amp; Security
              </div>

              {isLoggedIn ? (
                <div className="p-3.5 rounded-xl bg-[#102A43]/40 border border-[#243447] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#102A43] border border-[#7DD3FC] text-[#7DD3FC] flex items-center justify-center font-bold text-sm">
                      {(userName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#FFFFFF]">
                        {userName || "Valued Customer"}
                      </div>
                      <div className="text-[11px] text-[#9CAFC3]">
                        {isAdmin ? "Verified Store Administrator" : "Active Shopper Profile"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] text-xs font-semibold text-center hover:border-[#7DD3FC] transition-all"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="px-3 py-2 rounded-lg bg-[#080B10] text-red-400 border border-red-900/40 text-xs font-semibold text-center hover:bg-red-950/40 transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#102A43]/40 border border-[#243447] text-center space-y-3">
                  <p className="text-xs text-[#9CAFC3]">
                    Sign in to track orders, manage addresses, and access member perks.
                  </p>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#FFFFFF] transition-all"
                  >
                    <User className="h-4 w-4" />
                    <span>Sign In to One Store</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Market & Region Info for Mobile */}
            <div className="pt-2 border-t border-[#243447]/60 text-xs text-[#9CAFC3] flex items-center justify-between px-2">
              <span>Active Market:</span>
              <span className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                <span>{market === "IN" ? "🇮🇳 India (INR ₹)" : "🇬🇧 United Kingdom (GBP £)"}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </header>
  );
}
