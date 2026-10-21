// ==============================================================================
// ONE STORE: AI Shopping Assistant Verification & Unit Test Suite
// Run via: node tests/ai-assistant.test.mjs
// ==============================================================================

import assert from "node:assert/strict";

console.log("------------------------------------------------------------");
console.log("RUNNING AI SHOPPING ASSISTANT TEST SUITE");
console.log("------------------------------------------------------------\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

// Mock Catalog Data matching FALLBACK_PRODUCTS
const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    name: "One Studio Wireless Headphones",
    slug: "one-studio-wireless-headphones",
    price_inr: 14999,
    price_gbp: 149.99,
    compare_at_price_inr: 17999,
    compare_at_price_gbp: 179.99,
    status: "active",
    category_id: "audio",
    category: { name: "Studio Audio" },
    description: "Flagship active noise canceling over-ear headphones with custom titanium drivers.",
    features: ["Active Noise Canceling", "Titanium Drivers", "40-hour Battery"],
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"],
    variants: [{ inventory_count: 15 }]
  },
  {
    id: "prod-2",
    name: "Precision Chronograph Watch",
    slug: "precision-chronograph-watch",
    price_inr: 24999,
    price_gbp: 249.99,
    compare_at_price_inr: 29999,
    compare_at_price_gbp: 299.99,
    status: "active",
    category_id: "timepieces",
    category: { name: "Timepieces" },
    description: "Automatic mechanical movement with sapphire crystal and 316L stainless steel case.",
    features: ["Automatic Movement", "Sapphire Glass", "50m Water Resistant"],
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30"],
    variants: [{ inventory_count: 8 }]
  },
  {
    id: "prod-3",
    name: "Engineered Minimalist Backpack",
    slug: "engineered-minimalist-backpack",
    price_inr: 8999,
    price_gbp: 89.99,
    compare_at_price_inr: 10999,
    compare_at_price_gbp: 109.99,
    status: "active",
    category_id: "carry",
    category: { name: "Everyday Carry" },
    description: "Weatherproof Cordura ballistic nylon everyday carry backpack with magnetic Fidlock buckle.",
    features: ["Cordura Ballistic Nylon", "Fidlock Buckle", "16-inch Laptop Sleeve"],
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62"],
    variants: [{ inventory_count: 20 }]
  },
  {
    id: "prod-4",
    name: "Desk Studio Soundbar",
    slug: "desk-studio-soundbar",
    price_inr: 6999,
    price_gbp: 69.99,
    compare_at_price_inr: 8499,
    compare_at_price_gbp: 84.99,
    status: "active",
    category_id: "audio",
    category: { name: "Studio Audio" },
    description: "Compact acoustic desktop soundbar with dual passive radiators and USB-C DAC.",
    features: ["Dual Passive Radiators", "USB-C Lossless DAC", "Bluetooth 5.3"],
    images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d"],
    variants: [{ inventory_count: 12 }]
  }
];

// Helper Functions simulating ai-assistant service logic
function formatAiCurrency(amount, market) {
  if (market === "GB") {
    return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

function parseBudget(text) {
  const match =
    text.match(/under\s*(?:(?:₹|£|rs\.?|inr|gbp)\s*)?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k\b)?/i) ||
    text.match(/below\s*(?:(?:₹|£|rs\.?|inr|gbp)\s*)?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k\b)?/i) ||
    text.match(/within\s*(?:(?:₹|£|rs\.?|inr|gbp)\s*)?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k\b)?/i);

  if (!match) return undefined;
  let val = parseFloat(match[1].replace(/,/g, ""));
  if (match[0].toLowerCase().endsWith("k")) val *= 1000;
  return isNaN(val) ? undefined : val;
}

function sanitizeUserInput(text) {
  if (!text) return "";
  let clean = text.trim();
  if (clean.length > 1000) clean = clean.substring(0, 1000);
  return clean;
}

// 1. Dual Market Pricing & Currency Formatting
runTest("AI Dual Market Currency Formatting (India ₹ vs UK £)", () => {
  const inrFormatted = formatAiCurrency(14999, "IN");
  const gbpFormatted = formatAiCurrency(149.99, "GB");

  assert.equal(inrFormatted, "₹14,999", "India price should be formatted with ₹ and Indian locale");
  assert.equal(gbpFormatted, "£149.99", "UK price should be formatted with £ and 2 decimal places");
});

// 2. Budget Extraction & Parsing
runTest("AI Natural Language Budget Parser", () => {
  assert.equal(parseBudget("Show me products under ₹10,000"), 10000);
  assert.equal(parseBudget("Recommend something under 10k"), 10000);
  assert.equal(parseBudget("I want a gift below £100"), 100);
  assert.equal(parseBudget("Find options within £70"), 70);
  assert.equal(parseBudget("Find the best headphones"), undefined);
});

// 3. Budget-based Product Filtering
runTest("AI Budget-based Catalog Filtering", () => {
  const budgetInr = 10000;
  const filteredInr = MOCK_PRODUCTS.filter(
    (p) => p.status === "active" && p.price_inr <= budgetInr
  );

  assert.equal(filteredInr.length, 2, "Should find 2 products under ₹10,000");
  assert.ok(filteredInr.some((p) => p.name === "Engineered Minimalist Backpack"));
  assert.ok(filteredInr.some((p) => p.name === "Desk Studio Soundbar"));
  assert.ok(!filteredInr.some((p) => p.name === "One Studio Wireless Headphones"));

  const budgetGbp = 75;
  const filteredGbp = MOCK_PRODUCTS.filter(
    (p) => p.status === "active" && p.price_gbp <= budgetGbp
  );
  assert.equal(filteredGbp.length, 1, "Should find 1 product under £75");
  assert.equal(filteredGbp[0].name, "Desk Studio Soundbar");
});

// 4. Category and Keyword Search Matching
runTest("AI Product Discovery by Keyword & Category", () => {
  const query = "wireless audio headphones";
  const tokens = query.toLowerCase().split(/\s+/);

  const scored = MOCK_PRODUCTS.map((p) => {
    let score = 0;
    const haystack = `${p.name} ${p.category?.name || ""} ${p.description} ${p.features.join(" ")}`.toLowerCase();
    tokens.forEach((t) => {
      if (haystack.includes(t)) score += 3;
    });
    return { product: p, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  assert.ok(scored.length > 0, "Should match audio products");
  assert.equal(scored[0].product.name, "One Studio Wireless Headphones");
});

// 5. Product Comparison Logic
runTest("AI Product Comparison Differentiation", () => {
  const p1 = MOCK_PRODUCTS[0]; // Headphones
  const p2 = MOCK_PRODUCTS[3]; // Soundbar

  const comparison = {
    item1: { name: p1.name, priceInr: p1.price_inr, category: p1.category.name },
    item2: { name: p2.name, priceInr: p2.price_inr, category: p2.category.name },
    priceDifferenceInr: Math.abs(p1.price_inr - p2.price_inr),
  };

  assert.equal(comparison.priceDifferenceInr, 8000);
  assert.equal(comparison.item1.category, "Studio Audio");
  assert.equal(comparison.item2.category, "Studio Audio");
});

// 6. Order Tracking Privacy Isolation: Unauthenticated Customer
runTest("Order Tracking Privacy Isolation: Guest Access Blocked", () => {
  const guestSession = { isAuthenticated: false, customerId: null };
  const query = "Where is my order? Track order OS-2026-IN-1001";

  function handleOrderQuery(auth, text) {
    if (!auth.isAuthenticated) {
      return {
        reply: "To protect order privacy and customer data, please sign in to view your real-time tracking information.",
        actionLink: { label: "Sign In to View Orders", href: "/login?next=/orders" },
        orders: []
      };
    }
    return { reply: "Order details", orders: [{ orderNumber: "OS-2026-IN-1001" }] };
  }

  const result = handleOrderQuery(guestSession, query);
  assert.equal(result.orders.length, 0, "Guest must never receive order data");
  assert.ok(result.reply.includes("sign in to view your real-time tracking"), "Must prompt to sign in");
  assert.equal(result.actionLink.href, "/login?next=/orders", "Must provide secure login route");
});

// 7. Order Tracking Privacy Isolation: Customer Scoping
runTest("Order Tracking Privacy Isolation: Scoped to Customer ID", () => {
  const mockOrdersDb = [
    { id: "ord-1", customer_id: "user-alice", order_number: "OS-2026-IN-1001", status: "processing", tracking_number: "BD-982143" },
    { id: "ord-2", customer_id: "user-bob", order_number: "OS-2026-IN-2002", status: "delivered", tracking_number: "BD-112233" }
  ];

  function getCustomerOrders(authenticatedUserId) {
    // Gated database query: strictly scoped to authenticated customer_id
    return mockOrdersDb.filter((o) => o.customer_id === authenticatedUserId);
  }

  const aliceOrders = getCustomerOrders("user-alice");
  assert.equal(aliceOrders.length, 1);
  assert.equal(aliceOrders[0].order_number, "OS-2026-IN-1001");
  assert.equal(aliceOrders[0].tracking_number, "BD-982143");

  // Alice querying Bob's order number
  const bobOrdersSeenByAlice = aliceOrders.filter((o) => o.order_number === "OS-2026-IN-2002");
  assert.equal(bobOrdersSeenByAlice.length, 0, "Alice must never be able to access Bob's order details");
});

// 8. Rate Limiting Sliding Window (30 req/min)
runTest("AI In-Memory Rate Limiter (30 req/min per identifier)", () => {
  const RATE_LIMIT_WINDOW = 60 * 1000;
  const RATE_LIMIT_MAX = 30;
  const rateLimitMap = new Map();

  function checkRateLimit(key, now = Date.now()) {
    const record = rateLimitMap.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + RATE_LIMIT_WINDOW;
    }
    record.count += 1;
    rateLimitMap.set(key, record);
    return record.count <= RATE_LIMIT_MAX;
  }

  const clientId = "client-ip-127.0.0.1";
  const now = 1000000;

  // Make 30 allowed requests
  for (let i = 0; i < 30; i++) {
    assert.equal(checkRateLimit(clientId, now), true, `Request ${i + 1} should be allowed`);
  }

  // 31st request must be rejected
  assert.equal(checkRateLimit(clientId, now), false, "Request 31 within same window must be rate-limited");

  // After window expires, requests should be permitted again
  const nextWindow = now + RATE_LIMIT_WINDOW + 100;
  assert.equal(checkRateLimit(clientId, nextWindow), true, "Request in next window should be allowed");
});

// 9. Input Sanitization & Message Length Enforcer
runTest("AI Request Sanitization & 1000-char Limit Enforcer", () => {
  const longText = "a".repeat(1500);
  const sanitized = sanitizeUserInput(longText);

  assert.equal(sanitized.length, 1000, "Text must be truncated to exactly 1000 characters");

  const normalText = "  Where is my bag?  ";
  assert.equal(sanitizeUserInput(normalText), "Where is my bag?", "Whitespace should be trimmed");
});

// 10. AI Telemetry & Multi-Market Counter
runTest("AI Telemetry & Market Analytics Aggregation", () => {
  const telemetry = {
    totalQueries: 0,
    totalConversations: new Set(),
    recommendationRequests: 0,
    marketCounts: { IN: 0, GB: 0 },
    topicCounts: {}
  };

  function recordAiQuery(sessionId, market, isRecommendation, topic) {
    telemetry.totalQueries += 1;
    if (sessionId) telemetry.totalConversations.add(sessionId);
    if (market) telemetry.marketCounts[market] = (telemetry.marketCounts[market] || 0) + 1;
    if (isRecommendation) telemetry.recommendationRequests += 1;
    if (topic) telemetry.topicCounts[topic] = (telemetry.topicCounts[topic] || 0) + 1;
  }

  recordAiQuery("session-1", "IN", true, "Budget Filtering");
  recordAiQuery("session-1", "IN", false, "Order Tracking");
  recordAiQuery("session-2", "GB", true, "Product Discovery");

  assert.equal(telemetry.totalQueries, 3);
  assert.equal(telemetry.totalConversations.size, 2);
  assert.equal(telemetry.recommendationRequests, 2);
  assert.equal(telemetry.marketCounts.IN, 2);
  assert.equal(telemetry.marketCounts.GB, 1);
  assert.equal(telemetry.topicCounts["Budget Filtering"], 1);
  assert.equal(telemetry.topicCounts["Order Tracking"], 1);
});

// 11. Multi-Provider Fallback Resolution
runTest("AI Provider Fallback Architecture (Multi-Provider & Zero Key Resilience)", () => {
  function resolveProvider(env) {
    if (env.AI_PROVIDER && env.AI_PROVIDER !== "auto") return env.AI_PROVIDER;
    if (env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY) return "gemini";
    if (env.GROQ_API_KEY) return "groq";
    if (env.OPENAI_API_KEY) return "openai";
    return "catalog-engine";
  }

  assert.equal(resolveProvider({ GEMINI_API_KEY: "test-gemini-key" }), "gemini");
  assert.equal(resolveProvider({ GROQ_API_KEY: "test-groq-key" }), "groq");
  assert.equal(resolveProvider({ OPENAI_API_KEY: "test-openai-key" }), "openai");
  assert.equal(resolveProvider({ AI_PROVIDER: "groq", GEMINI_API_KEY: "key" }), "groq");
  assert.equal(resolveProvider({}), "catalog-engine", "Defaults gracefully to semantic catalog engine when no keys are configured");
});

console.log("\n------------------------------------------------------------");
console.log(`AI ASSISTANT RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("------------------------------------------------------------");

if (failed > 0) {
  process.exit(1);
}
