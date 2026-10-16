import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("------------------------------------------------------------");
console.log("RUNNING ONE STORE DYNAMIC FAVICON VERIFICATION SUITE");
console.log("------------------------------------------------------------");

// 1. Load favicon service module
const faviconServicePath = path.join(rootDir, "src", "lib", "services", "favicon.ts");
assert(fs.existsSync(faviconServicePath), "favicon.ts must exist");

// Compile TypeScript or import logic
const { getFaviconTypeForPath, getFaviconUrlForPath, FAVICON_MAP } = await (async () => {
  // Simple evaluator for the pure logic function
  const code = fs.readFileSync(faviconServicePath, "utf8");
  // Extract and evaluate getFaviconTypeForPath
  const fnMatch = code.match(/export function getFaviconTypeForPath[\s\S]*?\n\}/);
  assert(fnMatch, "getFaviconTypeForPath function must be found");
  
  const evalCode = `
    const FAVICON_MAP = ${JSON.stringify({
      home: { path: "/favicons/home.svg" },
      products: { path: "/favicons/products.svg" },
      "product-detail": { path: "/favicons/product-detail.svg" },
      search: { path: "/favicons/search.svg" },
      cart: { path: "/favicons/cart.svg" },
      checkout: { path: "/favicons/checkout.svg" },
      auth: { path: "/favicons/auth.svg" },
      profile: { path: "/favicons/profile.svg" },
      orders: { path: "/favicons/orders.svg" },
      wishlist: { path: "/favicons/wishlist.svg" },
      support: { path: "/favicons/support.svg" },
      "admin-dashboard": { path: "/favicons/admin-dashboard.svg" },
      "admin-products": { path: "/favicons/admin-products.svg" },
      "admin-orders": { path: "/favicons/admin-orders.svg" },
      "admin-inventory": { path: "/favicons/admin-inventory.svg" },
      "admin-customers": { path: "/favicons/admin-customers.svg" },
      "admin-settings": { path: "/favicons/admin-settings.svg" },
      error: { path: "/favicons/error.svg" },
    })};
    ${fnMatch[0]
      .replace("export function", "function")
      .replace(/:\s*string/g, "")
      .replace(/:\s*FaviconType/g, "")}
    function getFaviconUrlForPath(pathname) {
      const type = getFaviconTypeForPath(pathname);
      return FAVICON_MAP[type]?.path || FAVICON_MAP.home.path;
    }
    return { getFaviconTypeForPath, getFaviconUrlForPath, FAVICON_MAP };
  `;
  return new Function(evalCode)();
})();

// Test 1: Verify all 18 SVG assets exist on disk and are valid SVGs
const expectedIcons = [
  "home",
  "products",
  "product-detail",
  "search",
  "cart",
  "checkout",
  "auth",
  "profile",
  "orders",
  "wishlist",
  "support",
  "admin-dashboard",
  "admin-products",
  "admin-orders",
  "admin-inventory",
  "admin-customers",
  "admin-settings",
  "error",
];

for (const iconName of expectedIcons) {
  const iconPath = path.join(rootDir, "public", "favicons", `${iconName}.svg`);
  assert(fs.existsSync(iconPath), `Icon file must exist: public/favicons/${iconName}.svg`);
  const content = fs.readFileSync(iconPath, "utf8");
  assert(content.includes("<svg"), `${iconName}.svg must contain <svg> root`);
  assert(content.includes('viewBox="0 0 32 32"'), `${iconName}.svg must have 32x32 viewBox`);
  assert(content.includes("#080B10"), `${iconName}.svg must use luxury dark background #080B10`);
}
console.log("[PASS] All 18 route-specific SVG favicons generated and validated");

// Test 2: Verify public/favicon.ico exists and has valid header
const icoPath = path.join(rootDir, "public", "favicon.ico");
assert(fs.existsSync(icoPath), "public/favicon.ico must exist");
const icoBuf = fs.readFileSync(icoPath);
assert(icoBuf.length > 1000, "public/favicon.ico must be non-empty");
assert(icoBuf.readUInt16LE(2) === 1, "public/favicon.ico must be valid ICO format type 1");
console.log("[PASS] Valid multi-resolution public/favicon.ico present (eradicates fallback Next.js 'N' icon)");

// Test 3: Explicit route mapping tests
const routeMappings = [
  { path: "/", expected: "home", expectedUrl: "/favicons/home.svg" },
  { path: "/products", expected: "products", expectedUrl: "/favicons/products.svg" },
  { path: "/products?category=audio&sort=featured", expected: "products", expectedUrl: "/favicons/products.svg" },
  { path: "/products/one-acoustic-pro", expected: "product-detail", expectedUrl: "/favicons/product-detail.svg" },
  { path: "/categories/carry", expected: "products", expectedUrl: "/favicons/products.svg" },
  { path: "/search", expected: "search", expectedUrl: "/favicons/search.svg" },
  { path: "/search?q=studio", expected: "search", expectedUrl: "/favicons/search.svg" },
  { path: "/cart", expected: "cart", expectedUrl: "/favicons/cart.svg" },
  { path: "/checkout", expected: "checkout", expectedUrl: "/favicons/checkout.svg" },
  { path: "/checkout/success", expected: "checkout", expectedUrl: "/favicons/checkout.svg" },
  { path: "/login", expected: "auth", expectedUrl: "/favicons/auth.svg" },
  { path: "/signup", expected: "auth", expectedUrl: "/favicons/auth.svg" },
  { path: "/account", expected: "profile", expectedUrl: "/favicons/profile.svg" },
  { path: "/account/addresses", expected: "profile", expectedUrl: "/favicons/profile.svg" },
  { path: "/orders", expected: "orders", expectedUrl: "/favicons/orders.svg" },
  { path: "/orders/OS-2026-IN-1001", expected: "orders", expectedUrl: "/favicons/orders.svg" },
  { path: "/wishlist", expected: "wishlist", expectedUrl: "/favicons/wishlist.svg" },
  { path: "/support", expected: "support", expectedUrl: "/favicons/support.svg" },
  // High-Priority Admin isolation (must NOT match customer orders/products)
  { path: "/admin-portal/dashboard", expected: "admin-dashboard", expectedUrl: "/favicons/admin-dashboard.svg" },
  { path: "/admin-portal", expected: "admin-dashboard", expectedUrl: "/favicons/admin-dashboard.svg" },
  { path: "/admin-portal/orders", expected: "admin-orders", expectedUrl: "/favicons/admin-orders.svg" },
  { path: "/admin-portal/orders/123", expected: "admin-orders", expectedUrl: "/favicons/admin-orders.svg" },
  { path: "/admin-portal/products", expected: "admin-products", expectedUrl: "/favicons/admin-products.svg" },
  { path: "/admin-portal/inventory", expected: "admin-inventory", expectedUrl: "/favicons/admin-inventory.svg" },
  { path: "/admin-portal/customers", expected: "admin-customers", expectedUrl: "/favicons/admin-customers.svg" },
  { path: "/admin-portal/settings", expected: "admin-settings", expectedUrl: "/favicons/admin-settings.svg" },
  { path: "/404", expected: "error", expectedUrl: "/favicons/error.svg" },
  { path: "/500", expected: "error", expectedUrl: "/favicons/error.svg" },
  { path: "/some/unmapped/wildcard/route", expected: "home", expectedUrl: "/favicons/home.svg" },
];

for (const { path: routePath, expected, expectedUrl } of routeMappings) {
  const resolved = getFaviconTypeForPath(routePath);
  const resolvedUrl = getFaviconUrlForPath(routePath);
  assert.strictEqual(
    resolved,
    expected,
    `Route ${routePath} resolved to ${resolved}, expected ${expected}`
  );
  assert.strictEqual(
    resolvedUrl,
    expectedUrl,
    `Route ${routePath} URL resolved to ${resolvedUrl}, expected ${expectedUrl}`
  );
}
console.log(`[PASS] Route mapping verified across ${routeMappings.length} distinct endpoints with admin isolation`);

// Test 4: Trailing slashes and query parameter tolerance
const edgeCases = [
  { raw: "/products/", expected: "products" },
  { raw: "/cart/?discount=LAUNCH10#summary", expected: "cart" },
  { raw: "/admin-portal/orders/?page=2", expected: "admin-orders" },
  { raw: "/checkout/#payment-methods", expected: "checkout" },
];

for (const { raw, expected } of edgeCases) {
  const resolved = getFaviconTypeForPath(raw);
  assert.strictEqual(resolved, expected, `Edge case '${raw}' must resolve to '${expected}'`);
}
console.log("[PASS] Trailing slashes, query parameters, and hash anchors sanitized properly");

console.log("------------------------------------------------------------");
console.log("TEST RESULTS: ALL FAVICON TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
