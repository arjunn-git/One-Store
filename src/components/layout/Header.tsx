"use client";

import Link from "next/link";
import { ShoppingBag, Search, User, Globe } from "lucide-react";
import { useMarket } from "@/lib/context/MarketContext";
import { useCart } from "@/lib/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Header() {
  const { market, setMarket } = useMarket();
  const { itemCount, setIsOpen } = useCart();

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
          <Link
            href="/login"
            aria-label="Account"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447] transition-all"
          >
            <User className="h-5 w-5" />
          </Link>
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
