import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#243447] bg-[#080B10] text-[#9CAFC3] text-sm mt-auto">
      {/* Guarantees banner */}
      <div className="border-b border-[#243447] py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-[#FFFFFF] text-xs uppercase tracking-wider">
                Authentic Quality
              </div>
              <div className="text-xs text-[#9CAFC3]">Vetted supplier inventory</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-[#FFFFFF] text-xs uppercase tracking-wider">
                India &amp; UK Logistics
              </div>
              <div className="text-xs text-[#9CAFC3]">Real-time tracked dispatch</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-[#FFFFFF] text-xs uppercase tracking-wider">
                Protected Returns
              </div>
              <div className="text-xs text-[#9CAFC3]">Hassle-free 14-day policy</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-[#FFFFFF] text-xs uppercase tracking-wider">
                Dedicated Support
              </div>
              <div className="text-xs text-[#9CAFC3]">Prompt customer assistance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-1 sm:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#102A43] text-[#7DD3FC] font-bold text-sm">
              1
            </div>
            <span className="text-lg font-bold text-[#FFFFFF]">ONE STORE</span>
          </div>
          <p className="text-xs leading-relaxed max-w-sm mb-4">
            A bespoke, high-performance commerce platform engineered for selective shoppers in India
            and the United Kingdom. Powered by modern Next.js and Supabase architecture.
          </p>
          <div className="text-xs text-[#9CAFC3]">
            Currencies supported: <span className="text-[#FFFFFF]">INR (₹)</span> and{" "}
            <span className="text-[#FFFFFF]">GBP (£)</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider mb-3">
            Catalog
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/products" className="hover:text-[#7DD3FC] transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-[#7DD3FC] transition-colors">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-[#7DD3FC] transition-colors">
                Promotions
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider mb-3">
            Customer Area
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/account" className="hover:text-[#7DD3FC] transition-colors">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-[#7DD3FC] transition-colors">
                Order Tracking
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-[#7DD3FC] transition-colors">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-[#7DD3FC] transition-colors">
                Support &amp; FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider mb-3">
            Policies
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/shipping-policy" className="hover:text-[#7DD3FC] transition-colors">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/returns-policy" className="hover:text-[#7DD3FC] transition-colors">
                Returns &amp; Refunds
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-[#7DD3FC] transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[#7DD3FC] transition-colors">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#243447] py-6 px-4 md:px-8 text-center text-xs text-[#9CAFC3]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 One Store. All rights reserved.</p>
          <p className="text-[11px] text-[#9CAFC3]">
            Designed with dark `#080B10`, `#102A43`, and `#7DD3FC`. Strictly zero purple/magenta.
          </p>
        </div>
      </div>
    </footer>
  );
}
