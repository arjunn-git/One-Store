import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";
import { OneStoreLogo } from "@/components/brand/OneStoreLogo";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#243447] bg-[#080B10] text-[#CBD5E1] text-sm mt-auto">
      {/* Guarantees banner */}
      <div className="border-b border-[#243447] py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-[#FFFFFF] text-xs uppercase tracking-wider">
                100% Certified Authentic
              </div>
              <div className="text-xs text-[#94A3B8]">Vetted flagship inventory</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-[#FFFFFF] text-xs uppercase tracking-wider">
                All-India Air Express
              </div>
              <div className="text-xs text-[#94A3B8]">Blue Dart &amp; Delhivery tracked</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-[#FFFFFF] text-xs uppercase tracking-wider">
                14-Day Doorstep Returns
              </div>
              <div className="text-xs text-[#94A3B8]">Zero-hassle pickup across India</div>
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
              <div className="text-xs text-[#94A3B8]">Email, WhatsApp &amp; phone help</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-1 sm:col-span-2">
          <div className="mb-3">
            <OneStoreLogo variant="primary" size="sm" layout="horizontal" />
          </div>
          <p className="text-xs leading-relaxed max-w-sm mb-4 text-[#CBD5E1]">
            India&apos;s premier curated luxury store engineered for discerning creators, audiophiles, and professionals across the Republic of India.
          </p>
          <div className="text-xs text-[#CBD5E1]">
            Currency: <span className="text-[#FFFFFF] font-bold">Indian Rupee (₹ INR)</span> • Instant UPI, RuPay, EMI &amp; NetBanking
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

      <div className="border-t border-[#243447] py-6 px-4 md:px-8 text-center text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 One Store India. All rights reserved.</p>
          <p className="text-[11px] text-[#94A3B8]">
            Curated flagship commerce engineered exclusively for the Indian Market (INR ₹).
          </p>
        </div>
      </div>
    </footer>
  );
}
