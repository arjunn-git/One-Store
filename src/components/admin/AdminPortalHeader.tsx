"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Package,
  Layers,
  ShoppingBag,
  PlusCircle,
  Store,
  LogOut,
  ShieldCheck,
  Radio,
  Users,
} from "lucide-react";
import { OneStoreLogo } from "@/components/brand/OneStoreLogo";

export function AdminPortalHeader() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/admin-portal/login") return;

    fetch("/api/admin-portal/session")
      .then((res) => {
        if (!res.ok) {
          router.replace("/admin-portal/login?next=" + encodeURIComponent(pathname));
        }
      })
      .catch(() => {
        // Fallback to middleware
      });
  }, [pathname, router]);

  // Do not render navigation on login screen
  if (pathname === "/admin-portal/login") {
    return null;
  }

  const navItems = [
    { href: "/admin-portal/dashboard", label: "Operations Command", icon: Activity, exact: true },
    { href: "/admin-portal/orders", label: "Orders Console", icon: ShoppingBag, exact: false },
    { href: "/admin-portal/products", label: "Product Catalog", icon: Package, exact: true },
    { href: "/admin-portal/products/new", label: "Add Product", icon: PlusCircle, exact: true },
    { href: "/admin-portal/inventory", label: "Inventory Levels", icon: Layers, exact: false },
    { href: "/admin-portal/customers", label: "Customers & Users", icon: Users, exact: false },
  ];

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin-portal/logout", { method: "POST" });
    } catch {
      // Continue navigation
    }
    // Delete cookie on client side with root path
    document.cookie = "one_store_admin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/admin-portal/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#243447] bg-[#080B10]/95 backdrop-blur-md">
      {/* Top Administrative Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5 border-b border-[#243447]/60 text-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin-portal/dashboard" className="group" title="Admin Operations Command">
            <OneStoreLogo
              variant="state"
              state="security"
              size="sm"
              badge="ADMIN PORTAL"
            />
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-3.5 border-l border-[#243447]/70 text-[#9CAFC3]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[11px] font-medium text-[#9CAFC3]">
              Systems Operational • Dual Market Telemetry (INR &amp; GBP)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#102A43]/30 border border-[#243447]/80 text-xs text-[#9CAFC3]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-medium text-[#FFFFFF]/90">onestore.auth@gmail.com</span>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open customer storefront in a new tab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080B10] hover:bg-[#102A43]/60 border border-[#243447] hover:border-[#7DD3FC]/40 text-xs font-medium text-[#FFFFFF] transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="hidden xs:inline">Storefront</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            title="Securely terminate administrative session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080B10] hover:bg-rose-950/30 text-[#9CAFC3] hover:text-rose-300 border border-[#243447] hover:border-rose-900/40 text-xs font-medium transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-2 bg-[#0C131C] border-b border-[#243447]/40 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 font-medium shadow-sm"
                    : "text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]/50 border border-transparent hover:border-[#243447]/60 font-medium"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#7DD3FC]" : "text-[#9CAFC3]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
