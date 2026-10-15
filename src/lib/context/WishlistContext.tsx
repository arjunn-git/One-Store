"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Product } from "@/lib/types/database";

interface WishlistContextType {
  wishlistIds: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: { id: string; name: string }) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "one_store_wishlist_ids";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }
    } catch {
      // Ignored
    }
    setMounted(true);
  }, []);

  // Save to localStorage whenever wishlist changes
  const saveWishlist = useCallback((ids: string[]) => {
    setWishlistIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (product: { id: string; name: string }) => {
      const exists = wishlistIds.includes(product.id);
      let updated: string[];

      if (exists) {
        updated = wishlistIds.filter((id) => id !== product.id);
        // Log telemetry
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "CART_REMOVE",
            action: `Removed from Wishlist: ${product.name}`,
            resourceType: "wishlist",
            resourceId: product.id,
          }),
        }).catch(() => {});
      } else {
        updated = [...wishlistIds, product.id];
        // Log telemetry
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "CART_ADD",
            action: `Saved to Wishlist: ${product.name}`,
            resourceType: "wishlist",
            resourceId: product.id,
          }),
        }).catch(() => {});
      }

      saveWishlist(updated);
      return !exists;
    },
    [wishlistIds, saveWishlist]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      const updated = wishlistIds.filter((id) => id !== productId);
      saveWishlist(updated);
    },
    [wishlistIds, saveWishlist]
  );

  const clearWishlist = useCallback(() => {
    saveWishlist([]);
  }, [saveWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: mounted ? wishlistIds.length : 0,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
