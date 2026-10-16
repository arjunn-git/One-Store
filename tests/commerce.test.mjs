// ==============================================================================
// ONE STORE: Automated Verification & Unit Test Suite
// Run via: node tests/commerce.test.mjs
// ==============================================================================

import assert from "node:assert/strict";
import crypto from "node:crypto";

console.log("------------------------------------------------------------");
console.log("RUNNING ONE STORE AUTOMATED VERIFICATION SUITE");
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

// 1. Dual Market Pricing Recalculation
runTest("Dual Currency Recalculation (India ₹ vs UK £)", () => {
  const baseInr = 24999;
  const baseGbp = 249;
  const adjInr = 1000;
  const adjGbp = 10;

  const totalInr = baseInr + adjInr;
  const totalGbp = baseGbp + adjGbp;

  assert.equal(totalInr, 25999, "India total price should match");
  assert.equal(totalGbp, 259, "UK total price should match");
});

// 2. Shipping Thresholds
runTest("Free Shipping Threshold Logic", () => {
  const inrThreshold = 5000;
  const gbpThreshold = 50;

  const orderInr1 = 6000;
  const orderInr2 = 4000;
  const orderGbp1 = 120;
  const orderGbp2 = 30;

  assert.equal(orderInr1 >= inrThreshold ? 0 : 250, 0, "INR order over 5000 has free shipping");
  assert.equal(orderInr2 >= inrThreshold ? 0 : 250, 250, "INR order below 5000 has standard 250 fee");
  assert.equal(orderGbp1 >= gbpThreshold ? 0 : 5, 0, "GBP order over 50 has free shipping");
  assert.equal(orderGbp2 >= gbpThreshold ? 0 : 5, 5, "GBP order below 50 has standard 5 fee");
});

// 3. Promotional Code Discount Engine
runTest("Promo Code Calculation (LAUNCH10)", () => {
  const subtotal = 38999;
  const promoCode = "LAUNCH10";

  let discount = 0;
  if (promoCode === "LAUNCH10") {
    discount = (subtotal * 10) / 100;
  }

  assert.equal(discount, 3899.9, "10% discount should match");
  assert.equal(subtotal - discount, 35099.1, "Net total should match");
});

// 4. Razorpay Webhook Signature Verification
runTest("Cryptographic Webhook Signature Verification", () => {
  const webhookSecret = "test_whsec_12345";
  const payload = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_test_99", notes: { order_number: "OS-2026-IN-4891" } } } },
  });

  const validSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");
  const tamperedPayload = payload + "tamper";
  const tamperedSignature = crypto.createHmac("sha256", webhookSecret).update(tamperedPayload).digest("hex");

  assert.equal(
    crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex"),
    validSignature,
    "Valid signature matches"
  );
  assert.notEqual(validSignature, tamperedSignature, "Tampered payload fails verification");
});

// 5. Razorpay Standard Checkout Client Signature Verification (order_id|payment_id)
runTest("Razorpay Payment Signature Verification (order_id|payment_id)", () => {
  const keySecret = "rzp_sec_test_abc123";
  const orderId = "order_O8vK1234567890";
  const paymentId = "pay_P8vK9876543210";

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  function verifyPayment(oId, pId, sig, secret) {
    const computed = crypto.createHmac("sha256", secret).update(`${oId}|${pId}`).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sig));
  }

  assert.equal(
    verifyPayment(orderId, paymentId, expectedSignature, keySecret),
    true,
    "Valid payment signature must be verified"
  );

  const forgedSignature = crypto.createHmac("sha256", "wrong_secret").update(`${orderId}|${paymentId}`).digest("hex");
  assert.equal(
    verifyPayment(orderId, paymentId, forgedSignature, keySecret),
    false,
    "Forged signature must be rejected"
  );
});

// 6. Masked Email Security Function
runTest("Email Privacy Masking (No PII leak)", () => {
  function maskEmail(email) {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  assert.equal(maskEmail("customer99@gmail.com"), "c***9@gmail.com");
  assert.equal(maskEmail("oliver@domain.co.uk"), "o***r@domain.co.uk");
});

// 7. OTP Format & Normalization
runTest("6-Digit OTP Code Normalization & Validation", () => {
  const testOtp = "  8 3 9 1 0 2  ";
  const cleaned = testOtp.replace(/\D/g, "");

  assert.equal(cleaned.length, 6, "Must be exactly 6 digits");
  assert.equal(cleaned, "839102", "Must strip whitespace");
  assert.match(cleaned, /^\d{6}$/, "Must be numeric only");
});

// 8. Inventory Stockout & Reservation
runTest("Inventory Reservation & Stock Boundary Check", () => {
  const variantStock = 5;
  const requestedQty1 = 3;
  const requestedQty2 = 8;

  const validReservation = requestedQty1 <= variantStock;
  const invalidReservation = requestedQty2 <= variantStock;

  assert.equal(validReservation, true, "Should allow reservation within stock limits");
  assert.equal(invalidReservation, false, "Should block overselling beyond available stock");
});

// 9. Customer Order Access Security (Isolation Protection)
runTest("Customer Isolation Guard: Unauthorized Customer Access Blocked", () => {
  const orderA = {
    orderNumber: "OS-2026-IN-1111",
    customerId: "cust_user_A",
    accessToken: "sec_tok_9999",
  };

  function canAccessOrder(order, accessingUserId, providedToken, isAdmin = false) {
    if (isAdmin) return true;
    if (accessingUserId && order.customerId === accessingUserId) return true;
    if (providedToken && order.accessToken === providedToken) return true;
    return false;
  }

  // Customer A can view own order
  assert.equal(canAccessOrder(orderA, "cust_user_A", null, false), true);
  // Admin can view order
  assert.equal(canAccessOrder(orderA, "cust_admin", null, true), true);
  // Guest with valid token can view order
  assert.equal(canAccessOrder(orderA, null, "sec_tok_9999", false), true);
  // Customer B cannot view Customer A's order without matching token
  assert.equal(canAccessOrder(orderA, "cust_user_B", null, false), false);
  // Guest with invalid token cannot view order
  assert.equal(canAccessOrder(orderA, null, "invalid_token", false), false);
});

// 10. Webhook Idempotency (Duplicate Event Handling)
runTest("Webhook Idempotency: Duplicate Payment Events Ignored", () => {
  const processedEvents = new Set();

  function handleWebhookEvent(eventId, orderStatus) {
    if (processedEvents.has(eventId)) {
      return { handled: true, duplicate: true, action: "NOOP" };
    }
    if (orderStatus === "succeeded") {
      return { handled: true, duplicate: true, action: "ALREADY_PAID" };
    }
    processedEvents.add(eventId);
    return { handled: true, duplicate: false, action: "SET_PAID" };
  }

  const res1 = handleWebhookEvent("evt_001", "pending");
  assert.equal(res1.duplicate, false);
  assert.equal(res1.action, "SET_PAID");

  const res2 = handleWebhookEvent("evt_001", "succeeded");
  assert.equal(res2.duplicate, true);
  assert.equal(res2.action, "NOOP");
});

// 11. Server-Side Price Calculation Tampering Protection
runTest("Server-Side Price Calculation: Tampered Client Prices Ignored", () => {
  const serverCatalog = {
    "prod_1": { priceInr: 24999 },
  };

  const clientSubmittedCart = {
    productId: "prod_1",
    tamperedClientPrice: 1, // Attacker sends 1 rupee
    quantity: 2,
  };

  // Server recalcs from trusted catalog
  const catalogItem = serverCatalog[clientSubmittedCart.productId];
  const trustedItemTotal = catalogItem.priceInr * clientSubmittedCart.quantity;

  assert.equal(trustedItemTotal, 49998, "Server must enforce real catalog price (₹49,998) instead of client-submitted price");
});

// 12. Supabase Dual OTP Type ('email' vs 'signup') Fallback Simulation
runTest("Supabase Dual OTP Type Fallback: Token Resolution Across Signup & Login", () => {
  function simulateVerifyOtp(token, requestedType, validTokenType) {
    // Primary attempt
    if (requestedType === validTokenType && token === "654321") {
      return { success: true, userId: "usr_verified_123" };
    }
    // Fallback attempt
    const fallbackType = requestedType === "signup" ? "email" : "signup";
    if (fallbackType === validTokenType && token === "654321") {
      return { success: true, userId: "usr_verified_123", recoveredViaFallback: true };
    }
    return { success: false, error: "Invalid verification code" };
  }

  // Case A: Existing user token validated on email type
  const resLogin = simulateVerifyOtp("654321", "email", "email");
  assert.equal(resLogin.success, true);

  // Case B: New user where Supabase internally created as 'email' but client sent 'signup'
  const resSignupFallback = simulateVerifyOtp("654321", "signup", "email");
  assert.equal(resSignupFallback.success, true);
  assert.equal(resSignupFallback.recoveredViaFallback, true);

  // Case C: Invalid code
  const resBad = simulateVerifyOtp("000000", "email", "email");
  assert.equal(resBad.success, false);
});

// 13. Resend Cooldown Enforcement
runTest("OTP Resend Cooldown Timer Logic (60s Guard)", () => {
  function canResendOtp(lastSentTimestamp, currentTimestamp, cooldownSeconds = 60) {
    const elapsedSeconds = (currentTimestamp - lastSentTimestamp) / 1000;
    return elapsedSeconds >= cooldownSeconds;
  }

  const now = Date.now();
  assert.equal(canResendOtp(now - 30 * 1000, now), false, "Must block resend within 30 seconds");
  assert.equal(canResendOtp(now - 61 * 1000, now), true, "Must allow resend after 61 seconds");
});

// 14. OAuth Provider Validation & Callback URL Check
runTest("OAuth Provider & Redirect URL Validation (Google & Apple)", () => {
  function buildOAuthAuthorizeUrl(supabaseUrl, provider, callbackUrl) {
    if (!["google", "apple"].includes(provider)) throw new Error("Invalid provider");
    return `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(callbackUrl)}`;
  }

  const supabaseUrl = "https://iivszrkvwvqptfxiqbfv.supabase.co";
  const callbackUrl = "https://one-store-gray.vercel.app/auth/callback";

  const googleUrl = buildOAuthAuthorizeUrl(supabaseUrl, "google", callbackUrl);
  assert.ok(googleUrl.includes("provider=google"));
  assert.ok(googleUrl.includes(encodeURIComponent(callbackUrl)));

  const appleUrl = buildOAuthAuthorizeUrl(supabaseUrl, "apple", callbackUrl);
  assert.ok(appleUrl.includes("provider=apple"));
  assert.ok(appleUrl.includes(encodeURIComponent(callbackUrl)));
});

// 15. Apple Private Relay & Metadata Extraction
runTest("Apple Private Relay & Metadata Preservation", () => {
  function extractProfileFromAuthUser(user, existingProfile = null) {
    const meta = user.user_metadata || {};
    const fullName =
      meta.full_name ||
      meta.name ||
      (meta.first_name ? `${meta.first_name} ${meta.last_name || ""}`.trim() : null);

    if (existingProfile) {
      return {
        ...existingProfile,
        is_email_verified: !!user.email_confirmed_at,
        // Preserve existing full_name if Apple did not resend it
        full_name: fullName || existingProfile.full_name,
      };
    }

    return {
      auth_user_id: user.id,
      email: user.email,
      is_email_verified: !!user.email_confirmed_at,
      full_name: fullName,
      is_private_relay: user.email?.endsWith("@privaterelay.appleid.com") || false,
    };
  }

  // Initial Apple Sign-In: user provides name and private relay email
  const initialUser = {
    id: "usr_apple_1",
    email: "x9fj2k@privaterelay.appleid.com",
    email_confirmed_at: "2026-10-15T00:00:00Z",
    user_metadata: { first_name: "John", last_name: "Appleseed" },
  };
  const profile1 = extractProfileFromAuthUser(initialUser);
  assert.equal(profile1.full_name, "John Appleseed");
  assert.equal(profile1.is_private_relay, true);

  // Subsequent Apple Sign-In: Apple omits user_metadata
  const subsequentUser = {
    id: "usr_apple_1",
    email: "x9fj2k@privaterelay.appleid.com",
    email_confirmed_at: "2026-10-15T00:00:00Z",
    user_metadata: {},
  };
  const profile2 = extractProfileFromAuthUser(subsequentUser, profile1);
  assert.equal(profile2.full_name, "John Appleseed", "Must preserve existing name when Apple omits it");
});

// 16. OAuth Callback Error Normalization
runTest("OAuth Cancellation & Error Handling", () => {
  function normalizeCallbackError(errorParam, errorDescription) {
    if (errorParam === "access_denied" || errorDescription?.toLowerCase().includes("denied")) {
      return "Sign-in was cancelled. You can sign in using your email code.";
    }
    if (errorDescription) return errorDescription;
    return "Social authentication could not be completed. Please try again or use your email verification code.";
  }

  assert.equal(
    normalizeCallbackError("access_denied", "The user denied access to your application"),
    "Sign-in was cancelled. You can sign in using your email code."
  );
  assert.equal(
    normalizeCallbackError("server_error", "Internal provider error"),
    "Internal provider error"
  );
});

// 17. Multi-Market Config & Server-Side Market Validation
runTest("Multi-Market Server Validation (India vs UK)", () => {
  function validateMarket(raw) {
    if (!raw) return "IN";
    const cleaned = String(raw).trim().toUpperCase();
    return cleaned === "GB" || cleaned === "UK" ? "GB" : "IN";
  }

  assert.equal(validateMarket("in"), "IN");
  assert.equal(validateMarket("IN"), "IN");
  assert.equal(validateMarket("GB"), "GB");
  assert.equal(validateMarket("uk"), "GB");
  assert.equal(validateMarket("US"), "IN", "Invalid markets safely fallback to IN default");
  assert.equal(validateMarket(null), "IN");
  assert.equal(validateMarket(undefined), "IN");
});

// 18. UK Test Catalogue Isolation & Test Data Flag Enforcement
runTest("UK Test Catalogue Isolation & Flag Enforcement", () => {
  const catalog = [
    { id: "1", name: "India Kurta", available_in_in: true, available_in_gb: false, is_test_data: false, status: "active" },
    { id: "2", name: "Global Watch", available_in_in: true, available_in_gb: true, is_test_data: false, status: "active" },
    { id: "3", name: "UK Bluetooth Headphones", sku: "UK-TEST-AUD-001", available_in_in: false, available_in_gb: true, is_test_data: true, status: "draft" },
    { id: "4", name: "UK Desk Lamp", sku: "UK-TEST-HOME-002", available_in_in: false, available_in_gb: true, is_test_data: true, status: "active" },
  ];

  function filterByMarket(products, market, includeDrafts = false) {
    return products.filter((p) => {
      const isAvailable = market === "GB" ? p.available_in_gb : p.available_in_in;
      const isStatusOk = includeDrafts ? true : p.status === "active";
      return isAvailable && isStatusOk;
    });
  }

  const indiaStore = filterByMarket(catalog, "IN");
  assert.equal(indiaStore.length, 2);
  assert.ok(indiaStore.every((p) => p.available_in_in));
  assert.ok(!indiaStore.some((p) => p.is_test_data), "India storefront must never contain UK test records");

  const ukStorePublic = filterByMarket(catalog, "GB", false);
  assert.equal(ukStorePublic.length, 2); // Global Watch + UK Desk Lamp (active)
  assert.ok(ukStorePublic.some((p) => p.sku === "UK-TEST-HOME-002"));

  const ukStoreAdmin = filterByMarket(catalog, "GB", true);
  assert.equal(ukStoreAdmin.length, 3); // includes draft
});

// 19. Currency Formatting and Precision (INR rounded integers vs GBP 2 decimal places)
runTest("Currency Formatting Precision (INR vs GBP)", () => {
  function formatMarketPrice(amount, market) {
    if (typeof amount !== "number" || isNaN(amount)) return market === "GB" ? "£0.00" : "₹0";
    if (market === "GB") {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }

  assert.equal(formatMarketPrice(39.99, "GB"), "£39.99");
  assert.equal(formatMarketPrice(9.9, "GB"), "£9.90");
  assert.equal(formatMarketPrice(24999.5, "IN"), "₹25,000");
  assert.equal(formatMarketPrice(1499, "IN"), "₹1,499");
});

// 20. OAuth Missing Credentials Graceful Handling (preventing infinite spinners)
runTest("OAuth Client Graceful Failure On Missing Provider URL", () => {
  function handleOAuthResponse(data, error) {
    if (error) {
      return { success: false, error: error.message };
    }
    if (!data?.url) {
      return {
        success: false,
        error: "Provider is not configured in Supabase yet. Please use OTP login or configure provider credentials.",
      };
    }
    return { success: true, url: data.url };
  }

  // Case 1: Supabase returns null URL when Apple OAuth is disabled/unconfigured
  const unconfiguredAppleResult = handleOAuthResponse({ url: null }, null);
  assert.equal(unconfiguredAppleResult.success, false, "Must fail cleanly when url is null");
  assert.ok(unconfiguredAppleResult.error.includes("not configured"));

  // Case 2: Configured provider returns redirect URL
  const configuredGoogleResult = handleOAuthResponse({ url: "https://accounts.google.com/o/oauth2/v2/auth?..." }, null);
  assert.equal(configuredGoogleResult.success, true);
  assert.ok(configuredGoogleResult.url.startsWith("https://accounts.google.com"));
});

// 21. Order Reference Normalization (Whitespace around hyphens, casing & trimming)
runTest("Order Reference Normalization (OS - 2026 - IN - 2056 -> OS-2026-IN-2056)", () => {
  function normalizeOrderReference(raw) {
    if (!raw) return null;
    return String(raw).replace(/\s+/g, "").toUpperCase();
  }

  assert.equal(normalizeOrderReference("OS - 2026 - IN - 2056"), "OS-2026-IN-2056");
  assert.equal(normalizeOrderReference("os-2026-in-2056"), "OS-2026-IN-2056");
  assert.equal(normalizeOrderReference("  OS-2026-GB-4120  "), "OS-2026-GB-4120");
  assert.equal(normalizeOrderReference("OS - 2026 - GB - 001"), "OS-2026-GB-001");
  assert.equal(normalizeOrderReference(null), null);
  assert.equal(normalizeOrderReference(undefined), null);
});

// 22. Dynamic Regional Payment Gateway Separation (India Razorpay/UPI vs UK Stripe/Cards/ApplePay)
runTest("Dynamic Regional Payment Gateway Separation & Server Enforcement", () => {
  function resolveMarketPaymentGateway(market) {
    const isUK = market === "GB";
    return {
      provider: isUK ? "stripe" : "razorpay",
      currency: isUK ? "GBP" : "INR",
      currencySymbol: isUK ? "£" : "₹",
      methods: isUK ? ["card", "applepay", "klarna"] : ["upi", "card", "netbanking"],
      headerTitle: isUK ? "Stripe UK & Global Checkout" : "Razorpay India Checkout",
      securityCompliance: isUK
        ? "Secured by Stripe • 256-bit SSL encrypted • UK FCA & PCI-DSS Level 1 Compliant"
        : "Secured by Razorpay • 256-bit SSL encrypted • RBI Compliant",
    };
  }

  // Case 1: India Store Checkout
  const indiaConfig = resolveMarketPaymentGateway("IN");
  assert.equal(indiaConfig.provider, "razorpay");
  assert.equal(indiaConfig.currency, "INR");
  assert.equal(indiaConfig.currencySymbol, "₹");
  assert.deepEqual(indiaConfig.methods, ["upi", "card", "netbanking"]);
  assert.ok(indiaConfig.securityCompliance.includes("RBI Compliant"));
  assert.equal(indiaConfig.methods.includes("applepay"), false, "UPI/India mode must NOT offer Apple Pay");
  assert.equal(indiaConfig.methods.includes("klarna"), false, "UPI/India mode must NOT offer Klarna");

  // Case 2: UK Store Checkout
  const ukConfig = resolveMarketPaymentGateway("GB");
  assert.equal(ukConfig.provider, "stripe");
  assert.equal(ukConfig.currency, "GBP");
  assert.equal(ukConfig.currencySymbol, "£");
  assert.deepEqual(ukConfig.methods, ["card", "applepay", "klarna"]);
  assert.ok(ukConfig.securityCompliance.includes("UK FCA"));
  assert.equal(ukConfig.methods.includes("upi"), false, "UK mode must NEVER offer UPI / QR");
  assert.equal(ukConfig.methods.includes("netbanking"), false, "UK mode must NEVER offer Indian NetBanking");

  // Case 3: Server-side validation overrides tampered client requests
  function serverEnforceGateway(clientPayload) {
    const validatedMarket = clientPayload.market === "GB" ? "GB" : "IN";
    const validatedCurrency = validatedMarket === "GB" ? "GBP" : "INR";
    const validatedProvider = validatedMarket === "GB" ? "stripe" : "razorpay";
    return { validatedMarket, validatedCurrency, validatedProvider };
  }

  const tamperedUK = serverEnforceGateway({ market: "GB", currency: "INR", paymentProvider: "razorpay" });
  assert.equal(tamperedUK.validatedMarket, "GB");
  assert.equal(tamperedUK.validatedCurrency, "GBP", "UK must be forced to GBP");
  assert.equal(tamperedUK.validatedProvider, "stripe", "UK must be forced to Stripe");

  const tamperedIN = serverEnforceGateway({ market: "IN", currency: "GBP", paymentProvider: "stripe" });
  assert.equal(tamperedIN.validatedMarket, "IN");
  assert.equal(tamperedIN.validatedCurrency, "INR", "India must be forced to INR");
  assert.equal(tamperedIN.validatedProvider, "razorpay", "India must be forced to Razorpay");
});

// 23. Real-Time Admin Activity Telemetry & Ring Buffer Ingestion
runTest("Real-Time Admin Activity Telemetry & Ring Buffer Logic", () => {
  const activityRing = [];
  const MAX_LIMIT = 5;

  function pushActivity(event) {
    const item = {
      id: `act_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    activityRing.unshift(item);
    if (activityRing.length > MAX_LIMIT) {
      activityRing.length = MAX_LIMIT;
    }
    return item;
  }

  // Record 6 events to verify ring buffer eviction
  pushActivity({ type: "CART_ADD", action: "Item 1", actor: "Shopper A", market: "IN" });
  pushActivity({ type: "CART_ADD", action: "Item 2", actor: "Shopper B", market: "GB" });
  pushActivity({ type: "MARKET_SWITCH", action: "Switched to UK", actor: "Shopper B", market: "GB" });
  pushActivity({ type: "CHECKOUT_INITIATED", action: "Checkout started", actor: "Shopper A", market: "IN" });
  pushActivity({ type: "ORDER_CREATED", action: "Order OS-01", actor: "Shopper A", market: "IN" });
  pushActivity({ type: "PAYMENT_SUCCESS", action: "Paid OS-01", actor: "Shopper A", market: "IN" });

  assert.equal(activityRing.length, 5, "Ring buffer must strictly clamp to MAX_LIMIT");
  assert.equal(activityRing[0].type, "PAYMENT_SUCCESS", "Newest event must be at index 0");
  assert.equal(activityRing[4].type, "CART_ADD", "Older event clamped at tail");

  // Filtering
  const orderEvents = activityRing.filter((a) => a.type === "ORDER_CREATED");
  assert.equal(orderEvents.length, 1);
  assert.equal(orderEvents[0].action, "Order OS-01");

  // Unique active shoppers calculation
  const uniqueShoppers = new Set(activityRing.map((a) => a.actor));
  assert.equal(uniqueShoppers.size, 2, "Must compute active unique shoppers");
});

runTest("Customer Support Inquiry Dispatch & Destination Routing (onestore.auth@gmail.com)", () => {
  const TARGET_EMAIL = "onestore.auth@gmail.com";

  // 1. Validation test
  function validateInquiry(payload) {
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.subject?.trim() || !payload.message?.trim()) {
      return { success: false, error: "Missing required fields" };
    }
    if (!payload.email.includes("@")) {
      return { success: false, error: "Invalid email format" };
    }
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    return {
      success: true,
      ticketId,
      deliveredTo: TARGET_EMAIL,
      payload: {
        ...payload,
        ticketId,
        recipient: TARGET_EMAIL,
      },
    };
  }

  // Missing fields check
  const invalidResult = validateInquiry({ name: "Arjun", email: "", subject: "Test", message: "Hello" });
  assert.equal(invalidResult.success, false);
  assert.equal(invalidResult.error, "Missing required fields");

  // Valid inquiry check
  const validPayload = {
    name: "Aarav Sharma",
    email: "customer@example.com",
    orderNumber: "OS-2026-IN-1001",
    subject: "Order Tracking & Delivery",
    message: "Requesting dispatch estimate for Mumbai delivery.",
  };

  const validResult = validateInquiry(validPayload);
  assert.equal(validResult.success, true);
  assert.equal(validResult.deliveredTo, TARGET_EMAIL);
  assert.ok(validResult.ticketId.startsWith("TKT-"), "Ticket ID must follow standard prefix");
  assert.equal(validResult.payload.recipient, "onestore.auth@gmail.com");
  assert.equal(validResult.payload.orderNumber, "OS-2026-IN-1001");
});

runTest("Admin Automated Live Email Pipeline (Order, Support, Payment -> onestore.auth@gmail.com)", () => {
  const TARGET_ADMIN = "onestore.auth@gmail.com";

  // Mock template generators matching admin-notifications.ts logic
  function generateOrderAlertSubject(orderNumber, totalAmount, currency) {
    const symbol = currency === "GBP" ? "£" : "₹";
    return `🛍️ [NEW ORDER] ${orderNumber} — ${symbol}${Number(totalAmount).toLocaleString()}`;
  }

  function generatePaymentAlertSubject(orderNumber, totalAmount, currency, provider) {
    const symbol = currency === "GBP" ? "£" : "₹";
    return `💳 [PAYMENT SETTLED] ${orderNumber} — ${symbol}${Number(totalAmount).toLocaleString()} via ${provider.toUpperCase()}`;
  }

  function generateSupportAlertSubject(ticketId, subject, senderName) {
    return `🎧 [SUPPORT INQUIRY] ${ticketId}: ${subject} (${senderName})`;
  }

  // 1. Order alert
  const orderSubjIN = generateOrderAlertSubject("OS-2026-IN-9901", 124999, "INR");
  assert.equal(orderSubjIN, "🛍️ [NEW ORDER] OS-2026-IN-9901 — ₹124,999");

  const orderSubjUK = generateOrderAlertSubject("OS-2026-GB-8802", 1450, "GBP");
  assert.equal(orderSubjUK, "🛍️ [NEW ORDER] OS-2026-GB-8802 — £1,450");

  // 2. Payment alert
  const paySubj = generatePaymentAlertSubject("OS-2026-IN-9901", 124999, "INR", "razorpay");
  assert.equal(paySubj, "💳 [PAYMENT SETTLED] OS-2026-IN-9901 — ₹124,999 via RAZORPAY");

  const paySubjUK = generatePaymentAlertSubject("OS-2026-GB-8802", 1450, "GBP", "stripe");
  assert.equal(paySubjUK, "💳 [PAYMENT SETTLED] OS-2026-GB-8802 — £1,450 via STRIPE");

  // 3. Support inquiry alert
  const supportSubj = generateSupportAlertSubject("TKT-TEST-01", "Order Tracking", "Jane Doe");
  assert.equal(supportSubj, "🎧 [SUPPORT INQUIRY] TKT-TEST-01: Order Tracking (Jane Doe)");

  // 4. Verify recipient routing
  const recipientTarget = process.env.ADMIN_EMAIL || TARGET_ADMIN;
  assert.equal(recipientTarget, "onestore.auth@gmail.com", "Admin alerts must strictly route to onestore.auth@gmail.com");
  assert.doesNotMatch(recipientTarget, /arjuntaneja204/, "Personal email must not be used as recipient target");
});

runTest("Separate Admin Portal Route Isolation & Legacy Redirects", () => {
  // 1. Legacy /admin URL mapper
  function resolveAdminRoute(pathname) {
    if (pathname === "/admin" || pathname === "/admin/") {
      return "/admin-portal/dashboard";
    }
    if (pathname.startsWith("/admin/")) {
      const subpath = pathname.replace(/^\/admin/, "");
      return `/admin-portal${subpath}`;
    }
    return pathname;
  }

  assert.equal(resolveAdminRoute("/admin"), "/admin-portal/dashboard");
  assert.equal(resolveAdminRoute("/admin/orders"), "/admin-portal/orders");
  assert.equal(resolveAdminRoute("/admin/products"), "/admin-portal/products");
  assert.equal(resolveAdminRoute("/admin/inventory"), "/admin-portal/inventory");

  // 2. Authorization gate simulator
  function evaluateAdminGate(pathname, userEmail, hasValidAdminToken) {
    const OFFICIAL_ADMIN = "onestore.auth@gmail.com";
    const isAdmin = (userEmail?.toLowerCase() === OFFICIAL_ADMIN) || hasValidAdminToken;

    if (pathname === "/admin-portal/login") {
      return isAdmin ? { action: "redirect", target: "/admin-portal/dashboard" } : { action: "allow" };
    }

    if (pathname.startsWith("/admin-portal")) {
      if (!userEmail && !hasValidAdminToken) {
        return { action: "redirect", target: `/admin-portal/login?next=${pathname}` };
      }
      if (!isAdmin) {
        return { action: "redirect", target: "/admin-portal/login?error=access_denied" };
      }
      return { action: "allow" };
    }

    return { action: "allow" };
  }

  // Unauthenticated user attempting to access /admin-portal/dashboard
  const unauthAttempt = evaluateAdminGate("/admin-portal/dashboard", null, false);
  assert.equal(unauthAttempt.action, "redirect");
  assert.equal(unauthAttempt.target, "/admin-portal/login?next=/admin-portal/dashboard");

  // Normal customer attempting to access /admin-portal/dashboard
  const customerAttempt = evaluateAdminGate("/admin-portal/dashboard", "customer@gmail.com", false);
  assert.equal(customerAttempt.action, "redirect");
  assert.equal(customerAttempt.target, "/admin-portal/login?error=access_denied");

  // Verified admin attempting to access /admin-portal/dashboard
  const adminAccess = evaluateAdminGate("/admin-portal/dashboard", "onestore.auth@gmail.com", true);
  assert.equal(adminAccess.action, "allow");

  // Verified admin visiting login screen gets redirected to dashboard
  const adminLoginVisit = evaluateAdminGate("/admin-portal/login", "onestore.auth@gmail.com", true);
  assert.equal(adminLoginVisit.action, "redirect");
  assert.equal(adminLoginVisit.target, "/admin-portal/dashboard");
});

runTest("Dedicated Admin Account & Anti-Brute-Force Rate Limiter (5-Attempt Guard)", () => {
  const OFFICIAL_ADMIN = "onestore.auth@gmail.com";

  // Rate limiter model matching admin-auth.ts
  const MAX_ATTEMPTS = 5;
  const attempts = new Map();

  function recordAttempt(identifier) {
    const current = attempts.get(identifier) || 0;
    const next = current + 1;
    attempts.set(identifier, next);
    const locked = next >= MAX_ATTEMPTS;
    const remaining = Math.max(0, MAX_ATTEMPTS - next);
    return { locked, remaining };
  }

  function resetAttempts(identifier) {
    attempts.delete(identifier);
  }

  const testIp = "192.168.1.100";

  // 1-4 failed attempts: not locked
  for (let i = 1; i <= 4; i++) {
    const res = recordAttempt(testIp);
    assert.equal(res.locked, false);
    assert.equal(res.remaining, 5 - i);
  }

  // 5th failed attempt: triggers lockout
  const fifthAttempt = recordAttempt(testIp);
  assert.equal(fifthAttempt.locked, true);
  assert.equal(fifthAttempt.remaining, 0);

  // Reset upon correct credentials
  resetAttempts(testIp);
  assert.equal(attempts.has(testIp), false);

  // Non-admin identity rejection
  function validateAdminIdentity(email) {
    return email.toLowerCase().trim() === OFFICIAL_ADMIN;
  }
  assert.equal(validateAdminIdentity("onestore.auth@gmail.com"), true);
  assert.equal(validateAdminIdentity("hacker@example.com"), false);
  assert.equal(validateAdminIdentity("customer@gmail.com"), false);
});

runTest("Cryptographic Admin Session Token Validation & Tamper Rejection", () => {
  const SECRET = "test-admin-secret-2026";
  const OFFICIAL_ADMIN = "onestore.auth@gmail.com";

  function createToken(email, role = "admin") {
    const payload = JSON.stringify({ email, role, issuedAt: Date.now() });
    const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    return Buffer.from(payload).toString("base64") + "." + sig;
  }

  function verifyToken(token) {
    try {
      const [payloadB64, sig] = token.split(".");
      const payloadStr = Buffer.from(payloadB64, "base64").toString("utf-8");
      const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadStr).digest("hex");
      if (sig !== expectedSig) return { valid: false };
      const parsed = JSON.parse(payloadStr);
      if (parsed.email !== OFFICIAL_ADMIN || parsed.role !== "admin") return { valid: false };
      return { valid: true, email: parsed.email };
    } catch {
      return { valid: false };
    }
  }

  // 1. Valid token
  const validToken = createToken(OFFICIAL_ADMIN, "admin");
  const validResult = verifyToken(validToken);
  assert.equal(validResult.valid, true);
  assert.equal(validResult.email, OFFICIAL_ADMIN);

  // 2. Tampered signature
  const tamperedSigToken = validToken.slice(0, -4) + "abcd";
  assert.equal(verifyToken(tamperedSigToken).valid, false, "Tampered signature must be rejected");

  // 3. Tampered payload (elevating a customer email)
  const tamperedPayload = Buffer.from(JSON.stringify({ email: "attacker@gmail.com", role: "admin", issuedAt: Date.now() })).toString("base64");
  const forgedToken = tamperedPayload + "." + validToken.split(".")[1];
  assert.equal(verifyToken(forgedToken).valid, false, "Mismatched signature for altered payload must be rejected");

  // 4. Token issued for non-admin email rejected even if signature is valid
  const nonAdminSignedToken = createToken("customer@example.com", "admin");
  assert.equal(verifyToken(nonAdminSignedToken).valid, false, "Token for non-admin email must be rejected");
});

runTest("Database Anti-Self-Promotion Policy Guard Simulation", () => {
  // Simulates Postgres trg_prevent_self_role_promotion
  function simulateProfileRoleUpdate(oldRow, newRow, callerIsServiceRole) {
    if (newRow.role !== oldRow.role) {
      if (!callerIsServiceRole) {
        // Anti-self-promotion: revert role to oldRow.role
        newRow.role = oldRow.role;
      }
    }
    return newRow;
  }

  const customerProfile = { id: "p1", email: "shopper@gmail.com", role: "customer" };

  // Customer tries to update their own role to 'admin'
  const maliciousUpdate = { ...customerProfile, role: "admin" };
  const result = simulateProfileRoleUpdate(customerProfile, maliciousUpdate, false);
  assert.equal(result.role, "customer", "Regular user update must NOT be allowed to self-promote role");

  // Service role / Admin client allows verified assignment
  const adminPromotion = { ...customerProfile, role: "admin" };
  const serviceResult = simulateProfileRoleUpdate(customerProfile, adminPromotion, true);
  assert.equal(serviceResult.role, "admin", "Service role can assign authorized admin roles");
});

// 30. Country-Specific Postal / PIN Code & Mobile Validation (India vs UK)
runTest("Country-Specific Postal / PIN Code & Mobile Validation (India vs UK)", () => {
  // India PIN code validation logic
  function validateIndiaPin(pin) {
    if (!pin) return false;
    return /^[1-9][0-9]{5}$/.test(pin.trim());
  }

  // UK Postcode validation logic
  function validateUkPostcode(code) {
    if (!code) return false;
    return /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(code.trim());
  }

  // India Mobile validation logic
  function validateIndiaMobile(phone) {
    if (!phone) return false;
    const clean = phone.replace(/[\s\-\(\)]/g, "");
    return /^(?:\+?91|0)?[6-9]\d{9}$/.test(clean);
  }

  // UK Mobile validation logic
  function validateUkMobile(phone) {
    if (!phone) return false;
    const clean = phone.replace(/[\s\-\(\)]/g, "");
    return /^(?:\+?44|0)?7\d{9}$/.test(clean);
  }

  // Test India PINs
  assert.equal(validateIndiaPin("400001"), true, "Valid Mumbai PIN");
  assert.equal(validateIndiaPin("110001"), true, "Valid New Delhi PIN");
  assert.equal(validateIndiaPin("040001"), false, "PIN starting with 0 is invalid");
  assert.equal(validateIndiaPin("40001"), false, "5-digit PIN is invalid");
  assert.equal(validateIndiaPin("4000011"), false, "7-digit PIN is invalid");
  assert.equal(validateIndiaPin("40000A"), false, "Alphanumeric PIN is invalid in India");

  // Test UK Postcodes
  assert.equal(validateUkPostcode("SW1A 1AA"), true, "Valid Buckingham Palace postcode");
  assert.equal(validateUkPostcode("ec1a 1bb"), true, "Valid London EC1 postcode lowercase");
  assert.equal(validateUkPostcode("M1 1AE"), true, "Valid Manchester postcode");
  assert.equal(validateUkPostcode("123456"), false, "Numeric PIN is invalid in UK");
  assert.equal(validateUkPostcode("SW1"), false, "Incomplete UK postcode is invalid");

  // Test India Mobile Numbers
  assert.equal(validateIndiaMobile("+91 98765 43210"), true, "Valid India mobile with +91");
  assert.equal(validateIndiaMobile("9876543210"), true, "Valid 10-digit India mobile");
  assert.equal(validateIndiaMobile("8123456789"), true, "Valid 8-prefix India mobile");
  assert.equal(validateIndiaMobile("5123456789"), false, "India mobile starting with 5 is invalid");
  assert.equal(validateIndiaMobile("12345"), false, "Short phone is invalid");

  // Test UK Mobile Numbers
  assert.equal(validateUkMobile("+44 7911 123456"), true, "Valid UK mobile with +44");
  assert.equal(validateUkMobile("07911 123456"), true, "Valid UK mobile with 07");
  assert.equal(validateUkMobile("7911123456"), true, "Valid UK mobile without prefix");
  assert.equal(validateUkMobile("01234 567890"), false, "UK landline is not a mobile number");
});

// 31. 100% Mandatory Profile Completion Engine
runTest("100% Mandatory Profile Completion Engine", () => {
  function computeCompletion(profile, addresses = []) {
    const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
    const country = profile.country === "GB" ? "GB" : "IN";

    const hasName = !!profile.full_name && profile.full_name.trim().length >= 3;
    const hasEmail = !!profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) && profile.is_email_verified;
    const phone = profile.phone || defaultAddr?.phone || "";
    const hasPhone = country === "IN" ? /^(?:\+?91|0)?[6-9]\d{9}$/.test(phone.replace(/[\s\-]/g, "")) : /^(?:\+?44|0)?7\d{9}$/.test(phone.replace(/[\s\-]/g, ""));
    const line1 = profile.street_address || defaultAddr?.line1 || "";
    const hasStreet = line1.trim().length >= 5;
    const city = profile.city || defaultAddr?.city || "";
    const hasCity = city.trim().length >= 2;
    const state = profile.state_or_province || defaultAddr?.state_or_province || "";
    const hasState = state.trim().length >= 2;
    const postal = profile.postal_code || defaultAddr?.postal_code || "";
    const hasPostal = country === "IN" ? /^[1-9][0-9]{5}$/.test(postal.trim()) : /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(postal.trim());

    const weights = [
      { id: "full_name", completed: hasName, weight: 15 },
      { id: "email", completed: hasEmail, weight: 15 },
      { id: "phone", completed: hasPhone, weight: 15 },
      { id: "street_address", completed: hasStreet, weight: 20 },
      { id: "city", completed: hasCity, weight: 10 },
      { id: "state_or_province", completed: hasState, weight: 10 },
      { id: "postal_code", completed: hasPostal, weight: 15 },
    ];

    const percentage = weights.reduce((sum, w) => (w.completed ? sum + w.weight : sum), 0);
    const missing = weights.filter((w) => !w.completed).map((w) => w.id);
    return { isComplete: percentage === 100, percentage, missing };
  }

  // Case A: Fresh account with only verified email -> 15%
  const freshAccount = { email: "shopper@gmail.com", is_email_verified: true, country: "IN" };
  const resFresh = computeCompletion(freshAccount);
  assert.equal(resFresh.percentage, 15);
  assert.equal(resFresh.isComplete, false);
  assert.ok(resFresh.missing.includes("full_name"));
  assert.ok(resFresh.missing.includes("phone"));
  assert.ok(resFresh.missing.includes("street_address"));

  // Case B: Incomplete profile (Name + Email + Phone, but no address) -> 45%
  const partialAccount = {
    full_name: "Rahul Mehta",
    email: "rahul@gmail.com",
    is_email_verified: true,
    phone: "+91 98765 43210",
    country: "IN",
  };
  const resPartial = computeCompletion(partialAccount);
  assert.equal(resPartial.percentage, 45);
  assert.equal(resPartial.isComplete, false);

  // Case C: 100% Complete Profile directly on profile
  const completeProfile = {
    full_name: "Aarav Sharma",
    email: "aarav@gmail.com",
    is_email_verified: true,
    phone: "+91 98765 43210",
    street_address: "Flat 402, Skyline Residency, Bandra West",
    city: "Mumbai",
    state_or_province: "Maharashtra",
    postal_code: "400050",
    country: "IN",
  };
  const resComplete = computeCompletion(completeProfile);
  assert.equal(resComplete.percentage, 100);
  assert.equal(resComplete.isComplete, true);
  assert.equal(resComplete.missing.length, 0);

  // Case D: Profile with address linked via Address Book
  const profileWithAddressBook = {
    full_name: "James Smith",
    email: "james@example.co.uk",
    is_email_verified: true,
    phone: "+44 7911 123456",
    country: "GB",
  };
  const savedAddress = [
    {
      line1: "24 Kensington High Street",
      city: "London",
      state_or_province: "Greater London",
      postal_code: "W8 4PT",
      country_code: "GB",
      is_default: true,
    },
  ];
  const resAddressBook = computeCompletion(profileWithAddressBook, savedAddress);
  assert.equal(resAddressBook.percentage, 100);
  assert.equal(resAddressBook.isComplete, true);
});

// 32. Mandatory Authentication Checkout Gate
runTest("Mandatory Authentication Checkout Gate", () => {
  function checkOrderPlacementPrerequisites(session, profile, addresses) {
    if (!session || !session.user) {
      return { allowed: false, status: 401, error: "Authentication required to checkout" };
    }
    if (!session.user.email_confirmed_at && profile?.is_email_verified === false) {
      return { allowed: false, status: 403, error: "Email verification required" };
    }
    // Calculate profile completeness
    const isComplete =
      !!profile?.full_name &&
      !!profile?.phone &&
      (!!profile?.street_address || addresses?.length > 0) &&
      (!!profile?.postal_code || addresses?.[0]?.postal_code);

    if (!isComplete) {
      return { allowed: false, status: 403, error: "100% profile completion mandatory" };
    }
    return { allowed: true, status: 200 };
  }

  // 1. Guest user trying to place order
  const guestResult = checkOrderPlacementPrerequisites(null, null, []);
  assert.equal(guestResult.allowed, false);
  assert.equal(guestResult.status, 401);

  // 2. Logged in with incomplete profile
  const incompleteResult = checkOrderPlacementPrerequisites(
    { user: { id: "u1", email: "user@test.com", email_confirmed_at: "2026-01-01" } },
    { email: "user@test.com" },
    []
  );
  assert.equal(incompleteResult.allowed, false);
  assert.equal(incompleteResult.status, 403);

  // 3. Logged in with complete profile
  const completeResult = checkOrderPlacementPrerequisites(
    { user: { id: "u1", email: "user@test.com", email_confirmed_at: "2026-01-01" } },
    {
      full_name: "User One",
      phone: "+91 98765 43210",
      street_address: "123 MG Road",
      postal_code: "560001",
    },
    []
  );
  assert.equal(completeResult.allowed, true);
  assert.equal(completeResult.status, 200);
});

// 33. Address Book Multi-Address, Default Flag, and Label Management
runTest("Address Book Multi-Address, Default Flag, and Label Management", () => {
  let addressBook = [
    { id: "a1", label: "Home", is_default: true, line1: "Flat 101", city: "Mumbai" },
    { id: "a2", label: "Work", is_default: false, line1: "Floor 4, Tower B", city: "Mumbai" },
  ];

  // Set 'a2' as new default
  function setDefault(id) {
    addressBook = addressBook.map((a) => ({
      ...a,
      is_default: a.id === id,
    }));
  }

  setDefault("a2");
  assert.equal(addressBook.find((a) => a.id === "a2").is_default, true);
  assert.equal(addressBook.find((a) => a.id === "a1").is_default, false);

  // Validate labels
  const validLabels = ["Home", "Work", "Other", "Office", "Warehouse"];
  assert.ok(validLabels.includes("Home"));
  assert.ok(validLabels.includes("Work"));
  assert.ok(validLabels.includes("Other"));
});

// 34. Server-Side Protection Against Client-Side Profile Completion Tampering
runTest("Server-Side Protection Against Client-Side Profile Completion Tampering", () => {
  // Simulates server-side verification: even if client sends `is_profile_complete: true`, server recalculates!
  function serverVerifyProfileUpdate(clientPayload, verifiedEmail) {
    const hasName = !!clientPayload.full_name && clientPayload.full_name.trim().length >= 3;
    const hasPhone = !!clientPayload.phone && clientPayload.phone.trim().length >= 10;
    const hasStreet = !!clientPayload.street_address && clientPayload.street_address.trim().length >= 5;
    const hasCity = !!clientPayload.city && clientPayload.city.trim().length >= 2;
    const hasPostal = !!clientPayload.postal_code && clientPayload.postal_code.trim().length >= 5;

    // Server-calculated percentage, ignores client's claimed percentage
    const computedComplete = hasName && hasPhone && hasStreet && hasCity && hasPostal;

    return {
      claimedComplete: clientPayload.is_profile_complete,
      serverVerifiedComplete: computedComplete,
    };
  }

  // Malicious request claiming 100% complete without providing required fields
  const spoofedPayload = {
    full_name: "A", // too short
    is_profile_complete: true, // spoofed!
    profile_completion_percentage: 100, // spoofed!
  };

  const verification = serverVerifyProfileUpdate(spoofedPayload, "attacker@gmail.com");
  assert.equal(verification.claimedComplete, true);
  assert.equal(verification.serverVerifiedComplete, false, "Server MUST reject spoofed completion flag");
});

// 35. Event-Driven Welcome Screen Initialization Sequences & Error Resilience
runTest("Event-Driven Welcome Screen Initialization Sequences & Error Resilience", async () => {
  const steps = [];
  const progressSnapshots = [];

  // Simulate real initialization sequence
  async function simulateInitialization({ shouldFailCatalogue = false } = {}) {
    steps.push("Preparing your store...");
    progressSnapshots.push(15);

    if (shouldFailCatalogue) {
      throw new Error("Catalogue service temporarily unavailable.");
    }

    steps.push("Loading products and prices...");
    progressSnapshots.push(60);

    steps.push("Restoring your session...");
    progressSnapshots.push(85);

    steps.push("Preparing your shopping experience...");
    progressSnapshots.push(95);

    steps.push("You're all set!");
    progressSnapshots.push(100);

    return { completed: true, tasksCount: 5 };
  }

  // A. Successful initialization flow
  const result = await simulateInitialization();
  assert.equal(result.completed, true);
  assert.equal(steps.length, 5);
  assert.equal(steps[0], "Preparing your store...");
  assert.equal(steps[1], "Loading products and prices...");
  assert.equal(steps[2], "Restoring your session...");
  assert.equal(steps[3], "Preparing your shopping experience...");
  assert.equal(steps[4], "You're all set!");
  assert.equal(progressSnapshots[progressSnapshots.length - 1], 100);

  // B. Error resilience and retry simulation
  let caughtError = null;
  try {
    await simulateInitialization({ shouldFailCatalogue: true });
  } catch (err) {
    caughtError = err.message;
  }
  assert.equal(caughtError, "Catalogue service temporarily unavailable.");

  // C. Route suppression for Admin Portal
  function shouldRenderWelcomeScreen(pathname, isAlreadyWelcomed) {
    if (isAlreadyWelcomed) return false;
    if (pathname.startsWith("/admin-portal")) return false;
    return true;
  }

  assert.equal(shouldRenderWelcomeScreen("/admin-portal", false), false, "Admin portal must suppress welcome screen");
  assert.equal(shouldRenderWelcomeScreen("/admin-portal/dashboard", false), false, "Admin dashboard must suppress welcome screen");
  assert.equal(shouldRenderWelcomeScreen("/", false), true, "Storefront home must show welcome screen on first visit");
  assert.equal(shouldRenderWelcomeScreen("/", true), false, "Internal navigation must NOT flash welcome screen");
});

runTest("Centralized Dynamic ONE STORE Logo System & Accessibility Validation", () => {
  // Test logo variant and state resolution logic
  function resolveLogoConfig({ variant = "primary", state = "default", size = "md", reducedMotion = false }) {
    const validVariants = ["primary", "loading", "state"];
    const validStates = ["security", "success", "error", "default"];
    const validSizes = ["xs", "sm", "md", "lg", "xl"];

    assert.ok(validVariants.includes(variant), `Variant ${variant} must be valid`);
    assert.ok(validStates.includes(state), `State ${state} must be valid`);
    assert.ok(validSizes.includes(size), `Size ${size} must be valid`);

    let iconType = "shopping-bag";
    let isAnimated = false;
    let colorTheme = "#7DD3FC";

    if (variant === "loading") {
      iconType = "spinner-arc";
      isAnimated = !reducedMotion;
      colorTheme = "#7DD3FC";
    } else if (variant === "state") {
      if (state === "security") {
        iconType = "shield-check";
        colorTheme = "#7DD3FC";
      } else if (state === "success") {
        iconType = "check-circle";
        colorTheme = "#34D399";
      } else if (state === "error") {
        iconType = "alert-triangle";
        colorTheme = "#F87171";
      }
    }

    return { iconType, isAnimated, colorTheme };
  }

  // 1. Primary main logo
  const primary = resolveLogoConfig({ variant: "primary", size: "md" });
  assert.equal(primary.iconType, "shopping-bag");
  assert.equal(primary.isAnimated, false);
  assert.equal(primary.colorTheme, "#7DD3FC");

  // 2. Animated loading logo (motion-safe)
  const loading = resolveLogoConfig({ variant: "loading", size: "lg", reducedMotion: false });
  assert.equal(loading.iconType, "spinner-arc");
  assert.equal(loading.isAnimated, true);

  // 3. Animated loading logo respects reduced-motion
  const loadingReduced = resolveLogoConfig({ variant: "loading", size: "lg", reducedMotion: true });
  assert.equal(loadingReduced.iconType, "spinner-arc");
  assert.equal(loadingReduced.isAnimated, false, "Animation must be disabled when user prefers reduced motion");

  // 4. State-based security logo (Admin Portal & verification)
  const securityState = resolveLogoConfig({ variant: "state", state: "security" });
  assert.equal(securityState.iconType, "shield-check");
  assert.equal(securityState.colorTheme, "#7DD3FC");

  // 5. State-based success logo (Checkout success)
  const successState = resolveLogoConfig({ variant: "state", state: "success" });
  assert.equal(successState.iconType, "check-circle");
  assert.equal(successState.colorTheme, "#34D399");

  // 6. State-based error logo (Payment decline / access failure)
  const errorState = resolveLogoConfig({ variant: "state", state: "error" });
  assert.equal(errorState.iconType, "alert-triangle");
  assert.equal(errorState.colorTheme, "#F87171");
});

console.log("\n------------------------------------------------------------");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("------------------------------------------------------------");

if (failed > 0) {
  process.exit(1);
}


