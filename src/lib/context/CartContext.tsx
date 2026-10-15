"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useMarket } from "./MarketContext";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";
import type { Product, ProductVariant } from "@/lib/types/database";

export interface CartLineItem {
  id: string; // unique item id (productId + variantId)
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  sku: string;
  priceInr: number;
  priceGbp: number;
  quantity: number;
  maxInventory: number;
  imageUrl?: string | null;
}

export function getCartItemImage(item: CartLineItem): string | null {
  if (item.imageUrl) return item.imageUrl;
  const match = FALLBACK_PRODUCTS.find(
    (p) => p.id === item.productId || p.name.toLowerCase() === item.productName.toLowerCase()
  );
  return match?.images?.[0] || null;
}

interface CartContextValue {
  items: CartLineItem[];
  itemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  shippingFee: number;
  total: number;
  formattedSubtotal: string;
  formattedShippingFee: string;
  formattedTotal: string;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { market } = useMarket();
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount and hydrate images for legacy items
  useEffect(() => {
    try {
      const saved = localStorage.getItem("one_store_cart");
      if (saved) {
        const parsed: CartLineItem[] = JSON.parse(saved);
        const hydrated = parsed.map((item) => {
          if (!item.imageUrl) {
            const match = FALLBACK_PRODUCTS.find(
              (p) => p.id === item.productId || p.name.toLowerCase() === item.productName.toLowerCase()
            );
            return {
              ...item,
              imageUrl: match?.images?.[0] || null,
            };
          }
          return item;
        });
        setItems(hydrated);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (newItems: CartLineItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("one_store_cart", JSON.stringify(newItems));
    } catch {
      // Ignore storage errors
    }
  };

  const addItem = (product: Product, variant?: ProductVariant | null, quantity = 1) => {
    const variantId = variant?.id || null;
    const itemId = `${product.id}-${variantId || "default"}`;
    const adjInr = variant?.price_inr_adjustment || 0;
    const adjGbp = variant?.price_gbp_adjustment || 0;
    const maxInv = variant?.inventory_count ?? 10;
    const primaryImage = product.images?.[0] || null;

    const existingIndex = items.findIndex((i) => i.id === itemId);

    if (existingIndex > -1) {
      const updated = [...items];
      const newQty = Math.min(maxInv, updated[existingIndex].quantity + quantity);
      updated[existingIndex].quantity = newQty;
      if (!updated[existingIndex].imageUrl && primaryImage) {
        updated[existingIndex].imageUrl = primaryImage;
      }
      saveCart(updated);
    } else {
      const newItem: CartLineItem = {
        id: itemId,
        productId: product.id,
        variantId,
        productName: product.name,
        variantName: variant?.name || null,
        sku: variant?.sku || product.sku,
        priceInr: product.price_inr + adjInr,
        priceGbp: product.price_gbp + adjGbp,
        quantity: Math.min(maxInv, quantity),
        maxInventory: maxInv,
        imageUrl: primaryImage,
      };
      saveCart([...items, newItem]);
    }

    // Report storefront activity to real-time admin telemetry
    try {
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CART_ADD",
          action: `Added to cart: ${product.name}`,
          market,
          currency: market === "GB" ? "GBP" : "INR",
          resourceType: "cart",
          resourceId: product.id,
          details: {
            productName: product.name,
            variantName: variant?.name || null,
            quantity,
            price: market === "GB" ? product.price_gbp + adjGbp : product.price_inr + adjInr,
          },
        }),
      }).catch(() => {});
    } catch {
      // Ignored
    }

    setIsOpen(true);
  };

  const removeItem = (itemId: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    saveCart(items.filter((i) => i.id !== itemId));

    if (targetItem) {
      try {
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "CART_REMOVE",
            action: `Removed from cart: ${targetItem.productName}`,
            market,
            currency: market === "GB" ? "GBP" : "INR",
            resourceType: "cart",
            resourceId: targetItem.productId,
            details: { productName: targetItem.productName },
          }),
        }).catch(() => {});
      } catch {
        // Ignored
      }
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const updated = items.map((i) => {
      if (i.id === itemId) {
        return { ...i, quantity: Math.min(i.maxInventory, quantity) };
      }
      return i;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Financial calculations in active market currency
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = market === "IN" ? item.priceInr : item.priceGbp;
    return sum + unitPrice * item.quantity;
  }, 0);

  // Free shipping thresholds: India orders > ₹5,000 free; UK orders > £50 free
  const freeShippingThreshold = market === "IN" ? 5000 : 50;
  const standardShipping = market === "IN" ? 250 : 5;
  const shippingFee = subtotal >= freeShippingThreshold || items.length === 0 ? 0 : standardShipping;
  const total = subtotal + shippingFee;

  const formatCurrency = (amount: number) => {
    if (market === "IN") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        shippingFee,
        total,
        formattedSubtotal: formatCurrency(subtotal),
        formattedShippingFee: shippingFee === 0 ? "Free" : formatCurrency(shippingFee),
        formattedTotal: formatCurrency(total),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
