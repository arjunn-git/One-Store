import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Saved Essentials — Wishlist | One Store",
  description: "View and manage your saved studio acoustics, everyday carry, and precision timepieces.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
