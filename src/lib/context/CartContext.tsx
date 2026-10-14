"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useMarket } from "./MarketContext";
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

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("one_store_cart");
      if (saved) {
        setItems(JSON.parse(saved));
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

    const existingIndex = items.findIndex((i) => i.id === itemId);

    if (existingIndex > -1) {
      const updated = [...items];
      const newQty = Math.min(maxInv, updated[existingIndex].quantity + quantity);
      updated[existingIndex].quantity = newQty;
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
      };
      saveCart([...items, newItem]);
    }

    setIsOpen(true);
  };

  const removeItem = (itemId: string) => {
    saveCart(items.filter((i) => i.id !== itemId));
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
