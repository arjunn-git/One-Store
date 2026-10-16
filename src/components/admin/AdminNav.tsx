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
  AlertTriangle,
} from "lucide-react";
import { signOutUser } from "@/lib/services/auth";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Operations Command", icon: Activity, exact: true },
    { href: "/admin/products", label: "Products", icon: Package, exact: false },
    { href: "/admin/products/new", label: "New Product", icon: PlusCircle, exact: true },
    { href: "/admin/inventory", label: "Inventory", icon: Layers, exact: false },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  ];

  const handleSignOut = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  return (
    <div className="border-b border-[#243447] bg-[#0c131c]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm font-semibold"
                    : "text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]/50 border border-transparent hover:border-[#243447]/60 font-medium"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#7DD3FC]" : "text-[#9CAFC3]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Global Storefront / Logout actions */}
        <div className="flex items-center gap-2.5 text-xs">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC] text-[#FFFFFF] font-medium transition-all"
          >
            <Store className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span>Storefront</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-medium transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
