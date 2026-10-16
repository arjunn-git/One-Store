"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

export function AdminPortalHeader() {
  const pathname = usePathname();

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
  ];

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin-portal/logout", { method: "POST" });
    } catch {
      // Continue navigation
    }
    window.location.href = "/admin-portal/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#243447] bg-[#080B10]/95 backdrop-blur-md">
      {/* Top Administrative Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-[#243447]/60 text-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin-portal/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-bold text-xs shadow-inner">
              1
            </div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-[#FFFFFF]">
              <span>ONE STORE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#7DD3FC]/15 text-[#7DD3FC] border border-[#7DD3FC]/30 text-[10px] font-extrabold uppercase tracking-wider">
                ADMIN PORTAL
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#243447] text-[#9CAFC3]">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span className="text-[11px]">System Status: All Engines Operational</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#102A43] border border-[#243447] text-[11px] text-[#7DD3FC]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-semibold">onestore.auth@gmail.com</span>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open customer storefront in a new tab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080B10] hover:bg-[#102A43] border border-[#243447] hover:border-[#7DD3FC] text-xs font-semibold text-[#FFFFFF] transition-all"
          >
            <Store className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="hidden xs:inline">Storefront</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            title="Securely terminate administrative session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-semibold transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#0C131C] overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#7DD3FC] text-[#080B10] shadow-sm font-bold"
                    : "text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
