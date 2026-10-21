/**
 * Dynamic Favicon Service for One Store
 * Provides explicit route-to-favicon mapping and URL resolution.
 */

export type FaviconType =
  | "home"
  | "products"
  | "product-detail"
  | "search"
  | "cart"
  | "checkout"
  | "auth"
  | "profile"
  | "orders"
  | "wishlist"
  | "support"
  | "admin-dashboard"
  | "admin-products"
  | "admin-orders"
  | "admin-inventory"
  | "admin-customers"
  | "admin-settings"
  | "error";

export interface FaviconConfig {
  type: FaviconType;
  path: string;
  label: string;
}

export const FAVICON_MAP: Record<FaviconType, FaviconConfig> = {
  home: { type: "home", path: "/favicons/home.svg", label: "ONE STORE" },
  products: { type: "products", path: "/favicons/products.svg", label: "Products" },
  "product-detail": { type: "product-detail", path: "/favicons/product-detail.svg", label: "Product Overview" },
  search: { type: "search", path: "/favicons/search.svg", label: "Search" },
  cart: { type: "cart", path: "/favicons/cart.svg", label: "Cart" },
  checkout: { type: "checkout", path: "/favicons/checkout.svg", label: "Checkout" },
  auth: { type: "auth", path: "/favicons/auth.svg", label: "Account Access" },
  profile: { type: "profile", path: "/favicons/profile.svg", label: "Customer Profile" },
  orders: { type: "orders", path: "/favicons/orders.svg", label: "Orders" },
  wishlist: { type: "wishlist", path: "/favicons/wishlist.svg", label: "Wishlist" },
  support: { type: "support", path: "/favicons/support.svg", label: "Support" },
  "admin-dashboard": { type: "admin-dashboard", path: "/favicons/admin-dashboard.svg", label: "Operations Command" },
  "admin-products": { type: "admin-products", path: "/favicons/admin-products.svg", label: "Product Matrix" },
  "admin-orders": { type: "admin-orders", path: "/favicons/admin-orders.svg", label: "Orders Console" },
  "admin-inventory": { type: "admin-inventory", path: "/favicons/admin-inventory.svg", label: "Inventory Levels" },
  "admin-customers": { type: "admin-customers", path: "/favicons/admin-customers.svg", label: "Customers Registry" },
  "admin-settings": { type: "admin-settings", path: "/favicons/admin-settings.svg", label: "Admin Settings" },
  error: { type: "error", path: "/favicons/error.svg", label: "Alert" },
};

/**
 * Resolves the appropriate favicon type for a given URL pathname.
 * Handles nested routes, dynamic parameters, query strings, and trailing slashes.
 */
export function getFaviconTypeForPath(rawPathname: string): FaviconType {
  if (!rawPathname) return "home";

  // Clean pathname: remove query params, hashes, and trailing slashes
  const cleanPath = (rawPathname.split("?")[0].split("#")[0] || "/").replace(/\/+$/, "") || "/";

  // 1. High-Priority Admin Portal Routes
  if (cleanPath.startsWith("/admin-portal/orders") || cleanPath.startsWith("/admin/orders")) {
    return "admin-orders";
  }
  if (cleanPath.startsWith("/admin-portal/products") || cleanPath.startsWith("/admin/products")) {
    return "admin-products";
  }
  if (cleanPath.startsWith("/admin-portal/inventory") || cleanPath.startsWith("/admin/inventory")) {
    return "admin-inventory";
  }
  if (cleanPath.startsWith("/admin-portal/customers") || cleanPath.startsWith("/admin/customers")) {
    return "admin-customers";
  }
  if (cleanPath.startsWith("/admin-portal/settings") || cleanPath.startsWith("/admin/settings")) {
    return "admin-settings";
  }
  if (
    cleanPath === "/admin-portal" ||
    cleanPath === "/admin-portal/dashboard" ||
    cleanPath === "/admin" ||
    cleanPath === "/admin/dashboard"
  ) {
    return "admin-dashboard";
  }

  // 2. Customer Routes
  if (cleanPath === "/" || cleanPath === "") {
    return "home";
  }

  // Products: listing vs individual details
  if (cleanPath === "/products") {
    return "products";
  }
  if (cleanPath.startsWith("/products/")) {
    return "product-detail";
  }
  if (cleanPath.startsWith("/categories")) {
    return "products";
  }

  // Search
  if (cleanPath === "/search" || cleanPath.startsWith("/search/")) {
    return "search";
  }

  // Cart & Checkout
  if (cleanPath === "/cart") {
    return "cart";
  }
  if (cleanPath === "/checkout" || cleanPath.startsWith("/checkout/")) {
    return "checkout";
  }

  // Authentication (Login / Signup)
  if (
    cleanPath === "/login" ||
    cleanPath === "/signup" ||
    cleanPath.startsWith("/auth/") ||
    cleanPath === "/admin-portal/login"
  ) {
    return "auth";
  }

  // Customer Profile & Account
  if (cleanPath === "/account" || cleanPath === "/account/addresses" || cleanPath.startsWith("/account/profile")) {
    return "profile";
  }

  // Customer Orders
  if (cleanPath === "/orders" || cleanPath.startsWith("/orders/") || cleanPath.startsWith("/account/orders")) {
    return "orders";
  }

  // Wishlist
  if (cleanPath === "/wishlist" || cleanPath.startsWith("/wishlist/")) {
    return "wishlist";
  }

  // Support & Contact
  if (cleanPath === "/support" || cleanPath.startsWith("/support/") || cleanPath === "/contact") {
    return "support";
  }

  // Error & Not Found
  if (cleanPath === "/404" || cleanPath === "/500" || cleanPath === "/_not-found") {
    return "error";
  }

  // Default fallback for unknown routes
  return "home";
}

import faviconData from "./favicon-data.json";

export const FAVICON_DATA_URIS: Record<FaviconType, string> = faviconData as Record<FaviconType, string>;

/**
 * Returns the absolute favicon SVG URL for a pathname
 */
export function getFaviconUrlForPath(pathname: string): string {
  const type = getFaviconTypeForPath(pathname);
  return FAVICON_MAP[type]?.path || FAVICON_MAP.home.path;
}

/**
 * Returns the inline SVG data URI for a pathname (instant, zero-latency repaint)
 */
export function getFaviconDataUriForPath(pathname: string): string {
  const type = getFaviconTypeForPath(pathname);
  return FAVICON_DATA_URIS[type] || FAVICON_DATA_URIS.home;
}
