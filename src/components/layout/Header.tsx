"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  MapPin,
  Settings,
  Heart,
} from "lucide-react";
import { useMarket } from "@/lib/context/MarketContext";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CountrySelector } from "@/components/layout/CountrySelector";
import { signOutUser, isAdminEmail } from "@/lib/services/auth";
import { OneStoreLogo } from "@/components/brand/OneStoreLogo";

export function Header() {
  const pathname = usePathname();
  const { market } = useMarket();
  const { itemCount, setIsOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

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

  // Escape key closes menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, profileMenuOpen]);

  // Listen for client profile updates
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (isAdmin) return;
      if (e?.detail?.full_name) {
        setUserName(e.detail.full_name);
      }
    };
    window.addEventListener("user_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("user_profile_updated", handleProfileUpdate);
    };
  }, [isAdmin]);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (typeof window === "undefined") return;

      const emailCookie = document.cookie.includes("one_store_user_email");
      const session = localStorage.getItem("one_store_session");
      const match = document.cookie.match(/one_store_user_email=([^;]+)/);
      const userEmail = match && match[1] ? decodeURIComponent(match[1]).toLowerCase().trim() : "";
      const hasAdmin = isAdminEmail(userEmail) || (session ? isAdminEmail(session) : false);
      const savedName = localStorage.getItem("one_store_user_name");

      if (emailCookie || session) {
        if (isMounted) {
          setIsLoggedIn(true);
          setIsAdmin(hasAdmin);
          setUserName(hasAdmin ? "Store Admin" : (savedName || null));
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

          let name: string | null = null;
          if (adminCheck) {
            name = "Store Admin";
          } else {
            name = data.user.user_metadata?.full_name?.trim() || null;
            if (!name) {
              try {
                const { data: profile } = await supabase
                  .from("customer_profiles")
                  .select("full_name")
                  .eq("auth_user_id", data.user.id)
                  .maybeSingle();
                if (profile?.full_name?.trim()) {
                  name = profile.full_name.trim();
                }
              } catch {
                // Ignore profile fetch failure
              }
            }
            if (!name && savedName) {
              name = savedName.trim();
            }
          }

          setUserName(name || null);
          if (name) {
            localStorage.setItem("one_store_user_name", name);
          }
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
    try {
      localStorage.removeItem("one_store_user_name");
      localStorage.removeItem("one_store_session");
    } catch {
      // Ignore storage errors
    }
    await signOutUser();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#243447] bg-[#080B10]/95 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 text-xs text-[#9CAFC3] border-b border-[#243447]/60 md:px-8">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#7DD3FC] animate-pulse"></span>
          <span className="text-[10px] sm:text-xs truncate">
            <span className="hidden sm:inline">Dual Market Operations: </span>
            <span className="hidden xs:inline">India (₹) &amp; United Kingdom (£)</span>
            <span className="xs:hidden">IN (₹) &amp; UK (£)</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CountrySelector compact />
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            className="md:hidden flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC] transition-all focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
          >
            {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* Brand logo */}
          <Link href="/" className="group flex items-center shrink-0" title="One Store Home">
            <OneStoreLogo variant="primary" size="md" layout="horizontal" />
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/search"
            prefetch={true}
            aria-label="Search"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447] transition-all"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            prefetch={true}
            aria-label="Wishlist"
            title="Saved Essentials"
            className="hidden xs:flex relative h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447] transition-all"
          >
            <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${wishlistCount > 0 ? "text-red-400" : ""}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-[#FFFFFF]">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* User Account or Sign In */}
          {isLoggedIn ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-label="User account menu"
                className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 h-9 sm:h-10 rounded-xl bg-transparent hover:bg-[#102A43]/50 border border-transparent hover:border-[#243447]/80 text-[#FFFFFF] hover:text-[#7DD3FC] text-sm font-medium transition-all focus:outline-none focus:ring-1 focus:ring-[#7DD3FC]/50"
              >
                <User className="h-4 w-4 text-[#7DD3FC] sm:hidden" />
                <span className="hidden sm:inline max-w-[130px] sm:max-w-[160px] truncate text-sm font-medium text-[#FFFFFF] group-hover:text-[#7DD3FC] transition-colors">
                  {isAdmin ? "Store Admin" : (userName || "My Account")}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#9CAFC3] group-hover:text-[#7DD3FC] transition-transform duration-200 shrink-0 ${
                    profileMenuOpen ? "rotate-180 text-[#7DD3FC]" : ""
                  }`}
                />
              </button>

              {/* Premium Dropdown Menu */}
              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-[#080B10]/98 backdrop-blur-2xl border border-[#243447] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 focus:outline-none"
                >
                  {/* Account Header */}
                  <div className="px-3 py-2.5 mb-1.5 rounded-xl bg-[#102A43]/30 border border-[#243447]/60">
                    <p className="text-sm font-semibold text-[#FFFFFF] truncate">
                      {isAdmin ? "Store Admin" : (userName || "My Account")}
                    </p>
                    <Link
                      href="/account"
                      onClick={() => setProfileMenuOpen(false)}
                      className="text-xs text-[#7DD3FC] hover:text-[#FFFFFF] transition-colors inline-block mt-0.5"
                    >
                      {isAdmin ? "Store Administrator Account" : "View your profile"}
                    </Link>
                  </div>

                  {/* Navigation Menu Options */}
                  <div className="space-y-0.5" role="none">
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/60 transition-colors focus:outline-none focus:bg-[#102A43]/60 focus:text-[#7DD3FC]"
                    >
                      <User className="h-4 w-4 text-[#9CAFC3] group-hover:text-[#7DD3FC] transition-colors shrink-0" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/orders"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/60 transition-colors focus:outline-none focus:bg-[#102A43]/60 focus:text-[#7DD3FC]"
                    >
                      <Package className="h-4 w-4 text-[#9CAFC3] group-hover:text-[#7DD3FC] transition-colors shrink-0" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      href="/account/addresses"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/60 transition-colors focus:outline-none focus:bg-[#102A43]/60 focus:text-[#7DD3FC]"
                    >
                      <MapPin className="h-4 w-4 text-[#9CAFC3] group-hover:text-[#7DD3FC] transition-colors shrink-0" />
                      <span>Saved Addresses</span>
                    </Link>

                    <Link
                      href="/account?tab=settings"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/60 transition-colors focus:outline-none focus:bg-[#102A43]/60 focus:text-[#7DD3FC]"
                    >
                      <Settings className="h-4 w-4 text-[#9CAFC3] group-hover:text-[#7DD3FC] transition-colors shrink-0" />
                      <span>Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin-portal/dashboard"
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                        className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-950/20 transition-colors focus:outline-none focus:bg-amber-950/20"
                      >
                        <Shield className="h-4 w-4 text-amber-400 group-hover:text-amber-300 transition-colors shrink-0" />
                        <span>Admin Portal</span>
                      </Link>
                    )}
                  </div>

                  {/* Subtle Divider */}
                  <div className="my-1.5 border-t border-[#243447]/60" />

                  {/* Sign Out Action */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 transition-colors text-left focus:outline-none focus:bg-rose-950/30"
                  >
                    <LogOut className="h-4 w-4 text-rose-400 group-hover:text-rose-300 transition-colors shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Sign In"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 h-9 sm:h-10 rounded-xl bg-[#0c131c] hover:bg-[#102A43] text-[#FFFFFF] border border-[#243447] hover:border-[#7DD3FC] hover:text-[#7DD3FC] text-xs font-semibold transition-all shrink-0"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#7DD3FC]" />
              <span className="hidden xs:inline sm:inline">Sign In</span>
            </Link>
          )}

          {/* Cart Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Shopping Cart"
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC] transition-all shrink-0"
          >
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
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
        <div className="md:hidden absolute top-full left-0 right-0 w-full h-[calc(100dvh-100%)] max-h-[calc(100dvh-100%)] overflow-y-auto bg-[#080B10] border-t border-[#243447] shadow-2xl flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                <div className="p-3.5 rounded-xl bg-[#102A43]/30 border border-[#243447] space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-[#FFFFFF]">
                      {isAdmin ? "Store Admin" : (userName || "My Account")}
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs text-[#7DD3FC] hover:text-[#FFFFFF] transition-colors inline-block mt-0.5"
                    >
                      {isAdmin ? "Store Administrator Account" : "View your profile"}
                    </Link>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-[#243447]/60">
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/50 transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-[#7DD3FC] shrink-0" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/50 transition-colors"
                    >
                      <Package className="h-3.5 w-3.5 text-[#7DD3FC] shrink-0" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      href="/account/addresses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/50 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#7DD3FC] shrink-0" />
                      <span>Saved Addresses</span>
                    </Link>
                    <Link
                      href="/account?tab=settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#FFFFFF] hover:text-[#7DD3FC] hover:bg-[#102A43]/50 transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#7DD3FC] shrink-0" />
                      <span>Settings</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin-portal/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-950/20 transition-colors"
                      >
                        <Shield className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>Admin Portal</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-[#243447]/60">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-400 shrink-0" />
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
