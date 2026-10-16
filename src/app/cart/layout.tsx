import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart — One Store",
  description: "Review items in your bag, apply promotional discounts, and proceed to dual-market checkout.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
